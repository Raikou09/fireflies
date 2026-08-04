import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupGoogleAuth, isAuthenticated } from "./googleAuth";// import { setupGoogleAuth } from "./googleAuth"; // Disabled - using Replit Auth instead
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertCourtSchema,
  insertEquipmentSchema,
  insertBookingSchema,
  insertUserNotificationPreferencesSchema,
  insertVenueSchema,
  insertEventSchema,
  insertTicketTierSchema,
  insertEventBookingSchema,
} from "@shared/schema";
import { notificationService } from "./notificationService";
import { EnhancedNotificationService } from "./enhancedNotificationService";
import { EmailService } from "./emailService";
import { SMSService } from "./smsService";
import { initiateSTKPush, querySTKPushStatus, parseCallbackData, formatPhoneNumber, getSimulatedReceiptNumber, isSimulationMode, type MPesaCallbackData } from "./mpesaService";
import { generatePitchPDF } from "./pitchDocument";
import { requireAdmin, requireOwner, seedOwner, isAdminEmail } from "./adminAuth";
import { registerMatchRoutes } from "./matchRoutes";
import { adminUsers } from "@shared/schema";
import { db } from "./db";
import { eq as eqAdmin } from "drizzle-orm";
import { z } from "zod";

// Admin middleware moved to server/adminAuth.ts

// Helper function to verify vendor status
const verifyVendorStatus = async (userId: string) => {
  const vendor = await storage.getUser(userId);
  if (!vendor) {
    return { error: { status: 404, message: "User not found" } };
  }
  
  if (vendor.userType !== "vendor") {
    return { 
      error: { 
        status: 403, 
        message: "Access denied. Only verified vendors can perform this action.",
        code: "NOT_VENDOR"
      } 
    };
  }
  
  if (vendor.vendorVerificationStatus !== "verified") {
    const statusMessages = {
      pending: "Your vendor application is still under review. You cannot perform this action until verified.",
      rejected: "Your vendor application was rejected. Please contact support for assistance."
    };
    
    return { 
      error: { 
        status: 403,
        message: statusMessages[vendor.vendorVerificationStatus as keyof typeof statusMessages] || "Vendor verification required.",
        code: "NOT_VERIFIED",
        verificationStatus: vendor.vendorVerificationStatus
      } 
    };
  }
  
  return { vendor };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - using Replit's built-in authentication
  setupGoogleAuth(app);
  // Google OAuth disabled - using Replit Auth instead
  // setupGoogleAuth(app);
  seedOwner();
  registerMatchRoutes(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      console.log('Auth user route - extracted userId:', userId);
      console.log('Auth user route - req.user structure:', req.user);
      
      const user = await storage.getUser(userId);
      console.log('Auth user route - found user:', user);
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Vendor onboarding endpoint
  app.post('/api/vendor/onboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate vendor onboarding data
      const { vendorOnboardingSchema } = await import("@shared/schema");
      const validatedData = vendorOnboardingSchema.parse(req.body);

      // Update user with vendor details and mark as pending verification
      const updatedUser = await storage.upsertUser({
        ...user,
        userType: "vendor",
        vendorVerificationStatus: "pending",
        ...validatedData
      });

      try {
        const vendorName = `${validatedData.firstName || ''} ${validatedData.lastName || ''}`.trim() || 'Vendor';
        const businessName = validatedData.businessName || 'Unknown Business';
        const vendorEmail = user.email || '';

        await Promise.all([
          EmailService.sendNewVendorAlertToAdmin({ vendorName, businessName, vendorEmail }),
          vendorEmail ? EmailService.sendVendorApplicationReceived({ vendorEmail, vendorName, businessName }) : Promise.resolve(false)
        ]);
      } catch (emailError) {
        console.warn('Failed to send vendor onboarding emails:', emailError);
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error during vendor onboarding:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid vendor data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to complete vendor onboarding" });
    }
  });

  // Update existing vendor application (for pending vendors)
  app.put('/api/vendor/update', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Allow verified vendors to update their profile details

      // Validate vendor onboarding data
      const { vendorOnboardingSchema } = await import("@shared/schema");
      const validatedData = vendorOnboardingSchema.parse(req.body);

      // Update user with new vendor details, keep status as pending
      const updatedUser = await storage.upsertUser({
        ...user,
        ...validatedData,
        vendorVerificationStatus: user.vendorVerificationStatus || "pending"
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating vendor application:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid vendor data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update vendor application" });
    }
  });

  // Update payment details for verified vendors
  app.put('/api/vendor/payment-details', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.userType !== "vendor") {
        return res.status(403).json({ message: "Only vendors can update payment details" });
      }

      const paymentDetailsSchema = z.object({
        paymentPreference: z.enum(["bank", "mpesa", "both"]),
        mpesaNumber: z.string().optional(),
        bankName: z.string().optional(),
        bankAccountNumber: z.string().optional(),
        bankAccountName: z.string().optional(),
      }).superRefine((data, ctx) => {
        if (data.paymentPreference === "mpesa" || data.paymentPreference === "both") {
          if (!data.mpesaNumber || data.mpesaNumber.length < 10) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "M-Pesa number is required (min 10 digits)", path: ["mpesaNumber"] });
          }
        }
        if (data.paymentPreference === "bank" || data.paymentPreference === "both") {
          if (!data.bankName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Bank name is required", path: ["bankName"] });
          if (!data.bankAccountNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account number is required", path: ["bankAccountNumber"] });
          if (!data.bankAccountName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Account holder name is required", path: ["bankAccountName"] });
        }
      });

      const validatedData = paymentDetailsSchema.parse(req.body);

      const updatedUser = await storage.upsertUser({
        ...user,
        paymentPreference: validatedData.paymentPreference,
        mpesaNumber: validatedData.mpesaNumber || user.mpesaNumber,
        bankName: validatedData.bankName || user.bankName,
        bankAccountNumber: validatedData.bankAccountNumber || user.bankAccountNumber,
        bankAccountName: validatedData.bankAccountName || user.bankAccountName,
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating payment details:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment details" });
    }
  });

  // Check if user can create courts (must be verified vendor)
  app.get('/api/vendor/can-create-courts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const canCreate = user.userType === "vendor" && user.vendorVerificationStatus === "verified";
      
      // Provide detailed verification status
      const verificationDetails = {
        canCreate,
        userType: user.userType,
        verificationStatus: user.vendorVerificationStatus,
        hasBusinessLicense: !!user.businessLicense,
      };
      
      res.json({ ...verificationDetails, user });
    } catch (error) {
      console.error("Error checking vendor status:", error);
      res.status(500).json({ message: "Failed to check vendor status" });
    }
  });

  // Enhanced vendor verification status check
  app.get('/api/vendor/verification-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const missingRequirements = [];
      
      // Check basic info requirements
      if (!user.phoneNumber) missingRequirements.push("Phone number");
      if (!user.businessName) missingRequirements.push("Business name");
      if (!user.businessAddress) missingRequirements.push("Business address");
      if (!user.kraPin) missingRequirements.push("KRA PIN");

      const verificationStatus = {
        status: user.vendorVerificationStatus,
        canCreateCourts: user.vendorVerificationStatus === "verified",
        isComplete: missingRequirements.length === 0,
        missingRequirements,
        documentsUploaded: {
          businessLicense: !!user.businessLicense
        }
      };

      res.json(verificationStatus);
    } catch (error) {
      console.error("Error checking verification status:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });

  // Object storage routes for court images
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const aclPolicy = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      if (!aclPolicy) {
        return res.sendStatus(404);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });


  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      console.log('Upload URL request received from user:', req.user?.claims?.sub);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('Generated upload URL:', uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL', message: error.message });
    }
  });

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.post("/api/objects/upload-file", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { uploadToCloudinary } = await import("./cloudinaryStorage");
      const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'fireflies');
      res.json({ url });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file", message: error.message });
    }
  });

  // Serve uploaded documents (handles both old mock documents and new real uploads)
  app.get("/api/documents/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      
      // For old mock documents, return a placeholder
      if (documentId.startsWith('doc_')) {
        const placeholderImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjM4MCIgaGVpZ2h0PSIyODAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMDAiIHk9IjEzMCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSI2MDAiPkRvY3VtZW50IFBsYWNlaG9sZGVyPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSIjOUI3QzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+VGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciBvbGQgdXBsb2FkczwvdGV4dD48dGV4dCB4PSIyMDAiIHk9IjE3MCIgZmlsbD0iIzlCN0M4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5ldyB1cGxvYWRzIHdpbGwgc2hvdyByZWFsIGZpbGVzPC90ZXh0Pjwvc3ZnPg==';
        
        res.set({
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600'
        });
        
        const imageBuffer = Buffer.from(placeholderImageUrl.split(',')[1], 'base64');
        res.send(imageBuffer);
        return;
      }
      
      // For new uploads, this shouldn't be reached as they use /objects/ paths
      res.status(404).json({ error: 'Document not found' });
    } catch (error) {
      console.error('Error serving document:', error);
      res.status(500).json({ error: 'Failed to serve document' });
    }
  });

  // Document upload endpoint specifically for vendor onboarding
  app.post("/api/vendor/upload-document", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const { uploadToCloudinary } = await import("./cloudinaryStorage");
      const url = await uploadToCloudinary(req.file.buffer, req.file.mimetype, 'vendor-documents');
      res.json({ uploadURL: url, documentUrl: url });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document", message: error.message });
    }
  });
      
  // Court routes
  app.get("/api/courts", async (req, res) => {
    try {
      const { city, sport, search } = req.query;
      const courts = await storage.getCourts({
        city: city as string,
        sport: sport as string,
        search: search as string,
      });
      res.json(courts);
    } catch (error) {
      console.error("Error fetching courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  // Route for specific court by ID (with UUID check)
  app.get("/api/courts/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", async (req, res) => {
    try {
      const court = await storage.getCourtById(req.params.id);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      res.json(court);
    } catch (error) {
      console.error("Error fetching court:", error);
      res.status(500).json({ message: "Failed to fetch court" });
    }
  });

  // Route for courts by city and sport
  app.get("/api/courts/:city/:sport", async (req, res) => {
    try {
      const { city, sport } = req.params;
      const { search, lat, lng, maxDistance, sortByDistance } = req.query;
      const courts = await storage.getCourts({
        city: city === 'All Cities' ? undefined : city,
        sport: sport === 'All Sports' ? undefined : sport,
        search: search as string,
        userLatitude: lat ? parseFloat(lat as string) : undefined,
        userLongitude: lng ? parseFloat(lng as string) : undefined,
        maxDistance: maxDistance ? parseFloat(maxDistance as string) : undefined,
        sortByDistance: sortByDistance === 'true',
      });
      res.json(courts);
    } catch (error) {
      console.error("Error fetching courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  // Booking availability route - returns bookings and court info for availability calculation
  app.get("/api/bookings/availability/:courtId", async (req, res) => {
    try {
      const { courtId } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const bookings = await storage.getBookingsByCourtAndDate(courtId, date as string);
      const court = await storage.getCourtById(courtId);
      
      // Return bookings with court facility type and per-sport capacity for smart availability
      res.json({
        bookings,
        facilityType: court?.facilityType || 'shared_area',
        availableSports: court?.availableSports || [],
        sportCapacities: (court as any)?.sportCapacities || {}
      });
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Create booking route
  // Allow both authenticated and guest bookings
  app.post("/api/bookings", async (req: any, res) => {
    try {
      const { 
        courtId, date, timeSlot, duration, totalAmount, selectedSport, sportSegments,
        courtsBooked: requestedCourts,
        // Guest booking fields
        isGuestBooking, guestName, guestEmail, guestPhone
        // Note: discount fields are NOT accepted from client - calculated server-side
      } = req.body;
      const courtsBooked = Math.max(1, parseInt(requestedCourts) || 1);
      
      // Check if user is authenticated
      const customerId = req.user?.claims?.sub || req.user?.id || null;
      
      // Validate required fields
      if (!courtId || !date || !timeSlot || !duration || !totalAmount) {
        return res.status(400).json({ message: "Missing required booking fields" });
      }
      
      // For guest bookings, require guest info
      if (!customerId && isGuestBooking) {
        if (!guestName || !guestEmail || !guestPhone) {
          return res.status(400).json({ message: "Guest name, email, and phone are required for guest bookings" });
        }
      }

      const endTime = `${parseInt(timeSlot.split(':')[0]) + duration}:00`;
      
      // Server-side discount calculation for authenticated users only
      let serverDiscountAmount = 0;
      let serverDiscountType: string | null = null;
      let isEligibleForDiscount = false;
      
      if (customerId) {
        const user = await storage.getUser(customerId);
        if (user && !user.hasUsedFirstDiscount) {
          isEligibleForDiscount = true;
          // Calculate 10% discount server-side
          serverDiscountAmount = Math.round(Number(totalAmount) * 0.10);
          serverDiscountType = 'first_booking';
        }
      }
      
      // Calculate final amount (discount only for eligible authenticated users)
      const originalAmount = Number(totalAmount);
      const finalAmount = isEligibleForDiscount ? originalAmount - serverDiscountAmount : originalAmount;
      
      // Build booking data
      const bookingData: any = {
        courtId,
        selectedSport: selectedSport || "General",
        sportSegments: sportSegments || null,
        bookingDate: date,
        timeSlot: timeSlot,
        startTime: timeSlot,
        endTime: endTime,
        duration: duration,
        courtAmount: originalAmount.toString(),
        totalAmount: finalAmount.toString(),
        paymentMethod: "mpesa",
        paymentStatus: "pending",
        status: "confirmed",
      };
      
      // Handle guest vs authenticated booking
      if (customerId) {
        bookingData.customerId = customerId;
        bookingData.isGuestBooking = false;
        
        // Apply first booking discount if eligible (calculated server-side)
        if (isEligibleForDiscount && serverDiscountAmount > 0) {
          bookingData.discountAmount = serverDiscountAmount.toString();
          bookingData.discountType = serverDiscountType;
          bookingData.originalAmount = originalAmount.toString();
          
          // Mark user as having used their first booking discount AFTER validation
          await storage.updateUser(customerId, { hasUsedFirstDiscount: true });
        }
      } else {
        // Guest booking - no discount available (must sign up to get discount)
        bookingData.customerId = null;
        bookingData.isGuestBooking = true;
        bookingData.guestName = guestName;
        bookingData.guestEmail = guestEmail;
        bookingData.guestPhone = guestPhone;
      }
      
      // Server-side capacity enforcement for separate_areas courts
      const court = await storage.getCourtById(courtId);
      if (court && (court as any).facilityType === 'separate_areas' && selectedSport) {
        const sportCapacities: Record<string, number> = (court as any).sportCapacities || {};
        const capacity = sportCapacities[selectedSport] ?? 1;
        // Count courts already booked for this sport at overlapping times on the same date
        const existingBookings = await storage.getBookingsByCourtAndDate(courtId, date);
        const startHour = parseInt(timeSlot.split(':')[0]);
        let alreadyBooked = 0;
        for (const b of existingBookings) {
          if (b.status === 'cancelled') continue;
          const bStart = parseInt((b.startTime || b.timeSlot).split(':')[0]);
          const bEnd = bStart + (b.duration || 1);
          const overlapsSport = b.selectedSport === selectedSport ||
            (Array.isArray(b.sportSegments) && b.sportSegments.some(
              (seg: any) => seg.sport === selectedSport && seg.hour >= startHour && seg.hour < startHour + duration
            ));
          const overlapsTime = startHour < bEnd && (startHour + duration) > bStart;
          if (overlapsTime && overlapsSport) {
            alreadyBooked += (b as any).courtsBooked || 1;
          }
        }
        if (alreadyBooked + courtsBooked > capacity) {
          const remaining = Math.max(0, capacity - alreadyBooked);
          return res.status(409).json({
            message: remaining === 0
              ? `All ${selectedSport} courts are fully booked at this time`
              : `Only ${remaining} court${remaining === 1 ? '' : 's'} available for ${selectedSport} at this time`
          });
        }
      }
      bookingData.courtsBooked = courtsBooked;

      const booking = await storage.createBooking(bookingData);

      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Review routes
  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const reviewData = { ...req.body, customerId: userId };
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  // Get court reviews with customer details
  app.get("/api/courts/:id/reviews", async (req, res) => {
    try {
      const { id } = req.params;
      const reviews = await storage.getCourtReviews(id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching court reviews:", error);
      res.status(500).json({ message: "Failed to fetch court reviews" });
    }
  });

  app.get("/api/reviews/:courtId", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByCourt(req.params.courtId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/customer/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const reviews = await storage.getReviewsByCustomer(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching customer reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Booking history and user profile routes
  app.get("/api/customer/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const bookings = await storage.getBookingsByCustomer(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch booking history" });
    }
  });

  app.get("/api/customer/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get additional profile data
      const bookings = await storage.getBookingsByCustomer(userId);
      const reviews = await storage.getReviewsByCustomer(userId);
      
      const profile = {
        ...user,
        totalBookings: bookings.length,
        totalReviews: reviews.length,
        recentBookings: bookings.slice(0, 5), // Last 5 bookings
        memberSince: user.createdAt
      };

      res.json(profile);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/customer/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { firstName, lastName, profileImageUrl } = req.body;
      const updateData: any = {};
      
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

      // Update the user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Equipment rental routes
  app.get("/api/courts/:id/equipment/available", async (req, res) => {
    try {
      const equipment = await storage.getAvailableEquipmentByCourt(req.params.id);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching available equipment:", error);
      res.status(500).json({ message: "Failed to fetch available equipment" });
    }
  });

  app.post("/api/equipment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Verify user owns the court
      const court = await storage.getCourtById(req.body.courtId);
      if (!court || court.vendorId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only add equipment to your own courts." });
      }

      const equipment = await storage.createEquipment(req.body);
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  app.put("/api/equipment/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get equipment and verify ownership through court
      const equipmentList = await storage.getEquipmentByCourt(req.body.courtId || "");
      const existingEquipment = equipmentList.find(e => e.id === req.params.id);
      
      if (!existingEquipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }

      const court = await storage.getCourtById(existingEquipment.courtId);
      if (!court || court.vendorId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only update your own equipment." });
      }

      const updatedEquipment = await storage.updateEquipment(req.params.id, req.body);
      res.json(updatedEquipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });

  app.delete("/api/equipment/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // We need to get all equipment and find the one to verify ownership
      const allCourts = await storage.getCourtsByVendor(userId);
      let equipmentToDelete: any = null;
      
      for (const court of allCourts) {
        const courtEquipment = await storage.getEquipmentByCourt(court.id);
        equipmentToDelete = courtEquipment.find(e => e.id === req.params.id);
        if (equipmentToDelete) break;
      }

      if (!equipmentToDelete) {
        return res.status(404).json({ message: "Equipment not found or access denied" });
      }

      const deleted = await storage.deleteEquipment(req.params.id);
      if (deleted) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Equipment not found" });
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });

  // Vendor gallery-only update route (no re-approval needed)
  app.put("/api/vendor/courts/:id/gallery", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const court = await storage.getCourtById(req.params.id);
      if (!court || court.vendorId !== userId) {
        return res.status(404).json({ message: "Court not found or access denied" });
      }

      const { images, imageUrl } = req.body;
      const imageList: string[] = Array.isArray(images) ? images : [];
      const coverUrl: string | null = imageUrl || (imageList.length > 0 ? imageList[0] : null);

      // Attempt to publicize images (ACL failures are non-fatal — images served via /objects/uploads/:id)
      const publicizedImages: string[] = [];
      const objectStorageService = new ObjectStorageService();
      for (const url of imageList) {
        try {
          const publicPath = await objectStorageService.trySetObjectEntityAclPolicy(url, {
            owner: userId,
            visibility: "public",
          });
          publicizedImages.push(publicPath);
        } catch {
          publicizedImages.push(url);
        }
      }

      let publicCoverUrl = coverUrl;
      if (coverUrl && !publicizedImages.includes(coverUrl)) {
        try {
          publicCoverUrl = await objectStorageService.trySetObjectEntityAclPolicy(coverUrl, {
            owner: userId,
            visibility: "public",
          });
        } catch {
          // Keep original URL if ACL fails
        }
      }

      const updatedCourt = await storage.updateCourt(req.params.id, userId, {
        images: publicizedImages,
        imageUrl: publicCoverUrl ?? null,
      });

      if (!updatedCourt) {
        return res.status(404).json({ message: "Court not found or access denied" });
      }

      res.json({ ...updatedCourt, message: "Gallery updated successfully." });
    } catch (error) {
      console.error("Error updating court gallery:", error);
      res.status(500).json({ message: "Failed to update gallery" });
    }
  });

  // Vendor court update routes (requires re-approval)
  app.put("/api/vendor/courts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      // Publicize gallery images before saving
      if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        req.body.images = await publicizeCourtImages(userId, req.body.images);
      }
      if (req.body.imageUrl) {
        const publicized = await publicizeCourtImages(userId, [req.body.imageUrl]);
        req.body.imageUrl = publicized[0];
      }

      const updatedCourt = await storage.updateCourtDetails(req.params.id, userId, req.body);
      if (!updatedCourt) {
        return res.status(404).json({ message: "Court not found or access denied" });
      }

      // Notify admin about court update requiring approval
      await storage.createNotification({
        userId: "admin", // This should be actual admin user ID
        type: "court_update_pending",
        title: "Court Update Pending Approval",
        message: `Vendor has updated court details for "${updatedCourt.name}". Approval required.`,
        data: { courtId: updatedCourt.id, vendorId: userId }
      });

      res.json({ 
        ...updatedCourt, 
        message: "Court details updated successfully. Your changes are pending admin approval." 
      });
    } catch (error) {
      console.error("Error updating court:", error);
      res.status(500).json({ message: "Failed to update court" });
    }
  });

  app.post("/api/reviews/:reviewId/helpful", isAuthenticated, async (req, res) => {
    try {
      const { increment } = req.body;
      const review = await storage.updateReviewHelpfulness(req.params.reviewId, increment);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating review helpfulness:", error);
      res.status(500).json({ message: "Failed to update review" });
    }
  });

  app.post("/api/reviews/:reviewId/report", isAuthenticated, async (req, res) => {
    try {
      const review = await storage.reportReview(req.params.reviewId);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }
      res.json({ message: "Review reported successfully" });
    } catch (error) {
      console.error("Error reporting review:", error);
      res.status(500).json({ message: "Failed to report review" });
    }
  });

  app.get("/api/vendor/courts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const courts = await storage.getCourtsByVendor(userId);
      res.json(courts);
    } catch (error) {
      console.error("Error fetching vendor courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  // Get default commission rate for new courts
  app.get("/api/default-commission-rate", async (req, res) => {
    try {
      // Default commission rate for new courts
      const defaultRate = 15.00;
      res.json({ defaultCommissionRate: defaultRate });
    } catch (error) {
      console.error("Error fetching default commission rate:", error);
      res.status(500).json({ message: "Failed to fetch default commission rate" });
    }
  });

  // Helper: set public ACL for an array of image URLs (best-effort, errors are swallowed)
  const publicizeCourtImages = async (vendorId: string, imageUrls: string[]): Promise<string[]> => {
    const objectStorageService = new ObjectStorageService();
    const publicPaths: string[] = [];
    for (const url of imageUrls) {
      try {
        const publicPath = await objectStorageService.trySetObjectEntityAclPolicy(url, {
          owner: vendorId,
          visibility: "public",
        });
        publicPaths.push(publicPath);
      } catch {
        // If ACL fails (e.g. already public or external URL), keep original
        publicPaths.push(url);
      }
    }
    return publicPaths;
  };

  app.post("/api/courts", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      if (!vendorId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check vendor verification status before allowing court creation
      const vendor = await storage.getUser(vendorId);
      if (!vendor) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (vendor.userType !== "vendor") {
        return res.status(403).json({ 
          message: "Access denied. Only verified vendors can create courts.",
          code: "NOT_VENDOR"
        });
      }
      
      if (vendor.vendorVerificationStatus !== "verified") {
        const statusMessages = {
          pending: "Your vendor application is still under review. You cannot create courts until verified.",
          rejected: "Your vendor application was rejected. Please contact support for assistance."
        };
        
        return res.status(403).json({ 
          message: statusMessages[vendor.vendorVerificationStatus as keyof typeof statusMessages] || "Vendor verification required.",
          code: "NOT_VERIFIED",
          verificationStatus: vendor.vendorVerificationStatus
        });
      }
      
      console.log('Creating court with data:', req.body);

      // Publicize gallery images before saving
      if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        req.body.images = await publicizeCourtImages(vendorId, req.body.images);
      }
      if (req.body.imageUrl) {
        const publicized = await publicizeCourtImages(vendorId, [req.body.imageUrl]);
        req.body.imageUrl = publicized[0];
      }
      if (req.body.sportCapacities && Object.keys(req.body.sportCapacities).length === 0) {
        req.body.sportCapacities = null;
      }
      if (!Array.isArray(req.body.images)) req.body.images = [];
      if (!Array.isArray(req.body.availableSports)) req.body.availableSports = req.body.availableSports ? [req.body.availableSports] : [];
      if (!Array.isArray(req.body.availableDays)) req.body.availableDays = req.body.availableDays ? [req.body.availableDays] : [];
      if (typeof req.body.availableSports === 'string') {
        req.body.availableSports = [req.body.availableSports];
      }
      if (typeof req.body.availableDays === 'string') {
        req.body.availableDays = [req.body.availableDays];
      }
      if (typeof req.body.images === 'string') {
        req.body.images = [req.body.images];
      }
      const courtData = insertCourtSchema.parse(req.body);
      console.log('Parsed court data:', courtData);
      
      const court = await storage.createCourt(vendorId, courtData);
      res.status(201).json(court);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid court data", errors: error.errors });
      }
      console.error("Error creating court:", error);
      res.status(500).json({ message: "Failed to create court" });
    }
  });

  app.put("/api/courts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;

      // Publicize gallery images before saving
      if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        req.body.images = await publicizeCourtImages(vendorId, req.body.images);
      }
      if (req.body.imageUrl) {
        const publicized = await publicizeCourtImages(vendorId, [req.body.imageUrl]);
        req.body.imageUrl = publicized[0];
      }

      const courtData = insertCourtSchema.partial().parse(req.body);
      const court = await storage.updateCourt(req.params.id, vendorId, courtData);
      if (!court) {
        return res.status(404).json({ message: "Court not found or unauthorized" });
      }
      res.json(court);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid court data", errors: error.errors });
      }
      console.error("Error updating court:", error);
      res.status(500).json({ message: "Failed to update court" });
    }
  });

  app.delete("/api/courts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      const success = await storage.deleteCourt(req.params.id, vendorId);
      if (!success) {
        return res.status(404).json({ message: "Court not found or unauthorized" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting court:", error);
      res.status(500).json({ message: "Failed to delete court" });
    }
  });

  // Set court image after upload
  app.put("/api/courts/:id/image", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: vendorId,
          visibility: "public", // Court images should be publicly accessible
        },
      );

      const court = await storage.updateCourt(req.params.id, vendorId, {
        imageUrl: objectPath,
      });

      if (!court) {
        return res.status(404).json({ message: "Court not found or unauthorized" });
      }

      res.json({ objectPath });
    } catch (error) {
      console.error("Error setting court image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add image to court gallery
  app.post("/api/courts/:id/images", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Verify court ownership BEFORE any storage writes
      const court = await storage.getCourtById(req.params.id);
      if (!court || court.vendorId !== vendorId) {
        return res.status(404).json({ message: "Court not found or unauthorized" });
      }

      const objectStorageService = new ObjectStorageService();
      const { randomUUID } = await import("crypto");
      const objectId = randomUUID();
      const privateObjectDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/uploads/${objectId}`;

      const pathParts = fullPath.startsWith("/") ? fullPath.split("/") : `/${fullPath}`.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");

      const { objectStorageClient } = await import("./objectStorage");
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
      });

      const servingUrl = `/objects/uploads/${objectId}`;

      // Make it public
      await objectStorageService.trySetObjectEntityAclPolicy(servingUrl, {
        owner: vendorId,
        visibility: "public",
      });

      // Append to court's images array
      const currentImages = court.images || [];
      const updatedImages = [...currentImages, servingUrl];

      await storage.updateCourt(req.params.id, vendorId, { images: updatedImages });

      res.json({ url: servingUrl, images: updatedImages });
    } catch (error: any) {
      console.error("Error uploading gallery image:", error);
      res.status(500).json({ error: "Failed to upload gallery image", message: error.message });
    }
  });

  // Remove image from court gallery
  app.delete("/api/courts/:id/images", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      const court = await storage.getCourtById(req.params.id);
      if (!court || court.vendorId !== vendorId) {
        return res.status(404).json({ message: "Court not found or unauthorized" });
      }

      const currentImages = court.images || [];
      const updatedImages = currentImages.filter((img: string) => img !== imageUrl);

      await storage.updateCourt(req.params.id, vendorId, { images: updatedImages });

      res.json({ images: updatedImages });
    } catch (error: any) {
      console.error("Error removing gallery image:", error);
      res.status(500).json({ error: "Failed to remove gallery image", message: error.message });
    }
  });

  // Equipment routes
  app.get("/api/courts/:courtId/equipment", async (req, res) => {
    try {
      const equipment = await storage.getEquipmentByCourt(req.params.courtId);
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  app.post("/api/equipment", isAuthenticated, async (req: any, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
      }
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  app.get("/api/bookings/customer", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user?.claims?.sub || req.user?.id;
      const bookings = await storage.getBookingsByCustomer(customerId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/vendor", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      const bookings = await storage.getBookingsByVendor(vendorId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.put("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking status:", error);
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Customer booking cancellation (must be >2 hours before start time)
  app.post("/api/bookings/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const booking = await storage.getBooking(req.params.id);

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      if (booking.customerId !== user.id) {
        return res.status(403).json({ message: "You can only cancel your own bookings" });
      }
      if (booking.status === "cancelled") {
        return res.status(400).json({ message: "Booking is already cancelled" });
      }
      if (booking.status === "completed") {
        return res.status(400).json({ message: "Completed bookings cannot be cancelled" });
      }

      // Build booking datetime and enforce 2-hour window
      const bookingDateTime = new Date(`${booking.bookingDate}T${booking.startTime}`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking < 2) {
        return res.status(400).json({
          message: "Cancellations are only allowed up to 2 hours before the booking start time"
        });
      }

      const cancelled = await storage.updateBookingStatus(booking.id, "cancelled");

      // Send emails asynchronously — don't block the response
      (async () => {
        try {
          const court = await storage.getCourt(booking.courtId);
          const formatTime = (t: string) => {
            const [h, m] = t.split(":");
            const hour = parseInt(h);
            return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
          };
          const formattedDate = new Date(booking.bookingDate).toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          });

          // Customer email
          const customerEmail = user.email;
          const customerName = user.firstName || user.name || "Customer";
          if (customerEmail) {
            await EmailService.sendBookingCancellationCustomer({
              customerEmail,
              customerName,
              courtName: court?.name || "Court",
              bookingDate: formattedDate,
              startTime: formatTime(booking.startTime || "00:00"),
              endTime: formatTime(booking.endTime || "00:00"),
              totalAmount: booking.totalAmount,
              bookingId: booking.id,
            });
          }

          // Vendor email
          if (court?.vendorId) {
            const vendor = await storage.getUser(court.vendorId);
            const vendorEmail = vendor?.email;
            if (vendorEmail) {
              await EmailService.sendBookingCancellationVendor({
                vendorEmail,
                vendorName: vendor?.firstName || vendor?.name || "Vendor",
                courtName: court.name,
                customerName,
                bookingDate: formattedDate,
                startTime: formatTime(booking.startTime || "00:00"),
                endTime: formatTime(booking.endTime || "00:00"),
                totalAmount: booking.totalAmount,
                bookingId: booking.id,
              });
            }
          }
        } catch (emailErr) {
          console.error("Cancellation email error:", emailErr);
        }
      })();

      res.json({ success: true, booking: cancelled });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      res.status(500).json({ message: "Failed to cancel booking" });
    }
  });

  // ── Ops Center Auth (Google OAuth) ──────────────────────────────────
  app.get("/api/admin/me", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ isAdmin: false });
    const email = req.user?.email;
    if (!email) return res.status(401).json({ isAdmin: false });
    const admin = await isAdminEmail(email);
    if (!admin) return res.status(403).json({ isAdmin: false });
    res.json({ isAdmin: true, role: admin.role, email: admin.email });
  });

  app.get("/api/admin/auth", async (req: any, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ authenticated: false });
    const email = req.user?.email;
    const admin = email ? await isAdminEmail(email) : null;
    if (!admin) return res.status(403).json({ authenticated: false });
    res.json({ authenticated: true, adminId: email, role: admin.role });
  });

  app.post("/api/admin/login", (req, res) => {
    res.status(400).json({ message: "Use Google OAuth. Visit /api/auth/google" });
  });

  app.post("/api/admin/logout", (req: any, res) => {
    req.logout(() => { res.json({ success: true }); });
  });

  app.get("/api/admin/admins", requireOwner, async (req: any, res) => {
    try {
      const admins = await db.select().from(adminUsers);
      res.json(admins);
    } catch (error) { res.status(500).json({ message: "Failed to fetch admins" }); }
  });

  app.post("/api/admin/admins", requireOwner, async (req: any, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const existing = await db.select().from(adminUsers).where(eqAdmin(adminUsers.email, email));
      if (existing.length > 0) return res.status(409).json({ message: "Already an admin" });
      const [newAdmin] = await db.insert(adminUsers).values({ email, role: "admin", addedBy: req.adminUser.email }).returning();
      res.json(newAdmin);
    } catch (error) { res.status(500).json({ message: "Failed to add admin" }); }
  });

  app.delete("/api/admin/admins/:email", requireOwner, async (req: any, res) => {
    try {
      const { email } = req.params;
      if (email === req.adminUser.email) return res.status(400).json({ message: "Cannot remove yourself" });
      const target = await db.select().from(adminUsers).where(eqAdmin(adminUsers.email, email));
      if (!target[0]) return res.status(404).json({ message: "Admin not found" });
      if (target[0].role === "owner") return res.status(403).json({ message: "Cannot remove owner" });
      await db.delete(adminUsers).where(eqAdmin(adminUsers.email, email));
      res.json({ success: true });
    } catch (error) { res.status(500).json({ message: "Failed to remove admin" }); }
  });

  // ============================================
  // FIREFLIES EVENT BOOKING SYSTEM ROUTES
  // ============================================

  // Venue template routes
  app.get("/api/venue-templates", async (req, res) => {
    try {
      const { VENUE_TEMPLATES } = await import("@shared/venueTemplates");
      // Return template info without the full seat data (too large for initial load)
      const templates = VENUE_TEMPLATES.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        capacity: t.capacity,
        sections: t.sections,
      }));
      res.json(templates);
    } catch (error) {
      console.error("Error fetching venue templates:", error);
      res.status(500).json({ message: "Failed to fetch venue templates" });
    }
  });

  app.get("/api/venue-templates/:id", async (req, res) => {
    try {
      const { getTemplateById } = await import("@shared/venueTemplates");
      const template = getTemplateById(req.params.id);
      
      if (!template) {
        res.status(404).json({ message: "Template not found" });
        return;
      }
      
      res.json(template);
    } catch (error) {
      console.error("Error fetching venue template:", error);
      res.status(500).json({ message: "Failed to fetch venue template" });
    }
  });

  // Venue routes
  app.get("/api/venues", async (req, res) => {
    try {
      const { city, search, lat, lng, maxDistance, sortByDistance } = req.query;
      const venues = await storage.getVenues({
        city: city as string,
        search: search as string,
        userLatitude: lat ? parseFloat(lat as string) : undefined,
        userLongitude: lng ? parseFloat(lng as string) : undefined,
        maxDistance: maxDistance ? parseFloat(maxDistance as string) : undefined,
        sortByDistance: sortByDistance === 'true',
      });
      res.json(venues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.get("/api/venues/:id", async (req, res) => {
    try {
      const venue = await storage.getVenueById(req.params.id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      console.error("Error fetching venue:", error);
      res.status(500).json({ message: "Failed to fetch venue" });
    }
  });

  app.post("/api/venues", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify vendor status
      const verification = await verifyVendorStatus(userId);
      if (verification.error) {
        return res.status(verification.error.status).json(verification.error);
      }
      
      const validatedData = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(userId, validatedData);
      res.json(venue);
    } catch (error) {
      console.error("Error creating venue:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid venue data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  app.put("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify vendor status
      const verification = await verifyVendorStatus(userId);
      if (verification.error) {
        return res.status(verification.error.status).json(verification.error);
      }
      
      const validatedData = insertVenueSchema.partial().parse(req.body);
      const venue = await storage.updateVenue(req.params.id, userId, validatedData);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found or unauthorized" });
      }
      res.json(venue);
    } catch (error) {
      console.error("Error updating venue:", error);
      res.status(500).json({ message: "Failed to update venue" });
    }
  });

  app.delete("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const deleted = await storage.deleteVenue(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Venue not found or unauthorized" });
      }
      res.json({ message: "Venue deleted successfully" });
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ message: "Failed to delete venue" });
    }
  });

  app.get("/api/vendor/venues", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const venues = await storage.getVenuesByVendor(userId);
      res.json(venues);
    } catch (error) {
      console.error("Error fetching vendor venues:", error);
      res.status(500).json({ message: "Failed to fetch vendor venues" });
    }
  });

  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { city, category, search, dateFrom, dateTo, lat, lng, maxDistance, sortByDistance } = req.query;
      const events = await storage.getEvents({
        city: city as string,
        category: category as string,
        search: search as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        userLatitude: lat ? parseFloat(lat as string) : undefined,
        userLongitude: lng ? parseFloat(lng as string) : undefined,
        maxDistance: maxDistance ? parseFloat(maxDistance as string) : undefined,
        sortByDistance: sortByDistance === 'true',
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify vendor status
      const verification = await verifyVendorStatus(userId);
      if (verification.error) {
        return res.status(verification.error.status).json(verification.error);
      }
      
      // Handle both old format (direct event data) and new format (with ticketTiers)
      const { event: eventData, ticketTiers } = req.body.event ? req.body : { event: req.body, ticketTiers: [] };
      
      const validatedEvent = insertEventSchema.parse(eventData);
      
      // Verify vendor owns the venue
      const venue = await storage.getVenueById(validatedEvent.venueId);
      if (!venue || venue.vendorId !== userId) {
        return res.status(403).json({ 
          message: "Access denied. You can only create events at your own venues.",
          code: "VENUE_NOT_OWNED"
        });
      }
      
      // Create the event first
      const createdEvent = await storage.createEvent(userId, validatedEvent);
      
      // Create ticket tiers if provided
      if (ticketTiers && ticketTiers.length > 0) {
        // Validate and create each ticket tier
        const validatedTiers = ticketTiers.map((tier: any) => 
          insertTicketTierSchema.parse({ ...tier, eventId: createdEvent.id })
        );
        
        await Promise.all(
          validatedTiers.map((tier: any) => storage.createTicketTier(tier))
        );
      }
      
      res.json(createdEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify vendor status
      const verification = await verifyVendorStatus(userId);
      if (verification.error) {
        return res.status(verification.error.status).json(verification.error);
      }
      
      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, userId, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found or unauthorized" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const deleted = await storage.deleteEvent(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ message: "Event not found or unauthorized" });
      }
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  app.get("/api/vendor/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const events = await storage.getEventsByVendor(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching vendor events:", error);
      res.status(500).json({ message: "Failed to fetch vendor events" });
    }
  });

  // Ticket tier routes
  app.get("/api/events/:eventId/ticket-tiers", async (req, res) => {
    try {
      const ticketTiers = await storage.getTicketTiersByEvent(req.params.eventId);
      res.json(ticketTiers);
    } catch (error) {
      console.error("Error fetching ticket tiers:", error);
      res.status(500).json({ message: "Failed to fetch ticket tiers" });
    }
  });

  app.post("/api/ticket-tiers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTicketTierSchema.parse(req.body);
      const ticketTier = await storage.createTicketTier(validatedData);
      res.json(ticketTier);
    } catch (error) {
      console.error("Error creating ticket tier:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid ticket tier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket tier" });
    }
  });

  app.put("/api/ticket-tiers/:id", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTicketTierSchema.partial().parse(req.body);
      const ticketTier = await storage.updateTicketTier(req.params.id, validatedData);
      if (!ticketTier) {
        return res.status(404).json({ message: "Ticket tier not found" });
      }
      res.json(ticketTier);
    } catch (error) {
      console.error("Error updating ticket tier:", error);
      res.status(500).json({ message: "Failed to update ticket tier" });
    }
  });

  app.delete("/api/ticket-tiers/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteTicketTier(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Ticket tier not found" });
      }
      res.json({ message: "Ticket tier deleted successfully" });
    } catch (error) {
      console.error("Error deleting ticket tier:", error);
      res.status(500).json({ message: "Failed to delete ticket tier" });
    }
  });

  // Event booking routes
  app.post("/api/event-bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const validatedData = insertEventBookingSchema.parse({
        ...req.body,
        customerId: userId,
      });
      
      // Generate unique booking code
      const bookingCode = `FB${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      
      const booking = await storage.createEventBooking({
        ...validatedData,
        bookingCode,
      });
      
      res.json(booking);
    } catch (error) {
      console.error("Error creating event booking:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event booking" });
    }
  });

  app.get("/api/event-bookings/customer", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const bookings = await storage.getEventBookingsByCustomer(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching customer event bookings:", error);
      res.status(500).json({ message: "Failed to fetch customer event bookings" });
    }
  });

  app.get("/api/event-bookings/vendor", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const bookings = await storage.getEventBookingsByVendor(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching vendor event bookings:", error);
      res.status(500).json({ message: "Failed to fetch vendor event bookings" });
    }
  });

  app.get("/api/event-bookings/:id", isAuthenticated, async (req, res) => {
    try {
      const booking = await storage.getEventBookingById(req.params.id);
      if (!booking) {
        return res.status(404).json({ message: "Event booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching event booking:", error);
      res.status(500).json({ message: "Failed to fetch event booking" });
    }
  });

  app.put("/api/event-bookings/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateEventBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ message: "Event booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error updating event booking status:", error);
      res.status(500).json({ message: "Failed to update event booking status" });
    }
  });

  // Seat map routes
  app.get("/api/venues/:id/seat-map", async (req, res) => {
    try {
      const venueId = req.params.id;
      const sections = await storage.getSeatSectionsByVenue(venueId);
      const seats = await storage.getSeatsByVenue(venueId);
      res.json({ sections, seats });
    } catch (error) {
      console.error("Error fetching seat map:", error);
      res.status(500).json({ message: "Failed to fetch seat map" });
    }
  });

  app.post("/api/venues/:id/seat-map", isAuthenticated, async (req, res) => {
    try {
      const venueId = req.params.id;
      const userId = req.user?.claims?.sub || req.user?.id;
      const { sections, seats } = req.body;

      // Verify venue ownership
      const venue = await storage.getVenueById(venueId);
      if (!venue || venue.vendorId !== userId) {
        return res.status(403).json({ message: "Unauthorized to modify this venue" });
      }

      // Validate input
      if (!Array.isArray(sections) || !Array.isArray(seats)) {
        return res.status(400).json({ message: "Invalid seat map data" });
      }

      // Start transaction by clearing all existing seat data for this venue
      // This cascades to seats and event_seat_reservations
      const existingSections = await storage.getSeatSectionsByVenue(venueId);
      for (const section of existingSections) {
        await storage.deleteSeatSection(section.id);
      }

      // Create new sections (strip temp IDs and other UI-only fields)
      const createdSections = [];
      const sectionIdMap = new Map();
      
      for (const section of sections) {
        const { tempId, ...sectionData } = section;
        const created = await storage.createSeatSection({
          venueId,
          name: sectionData.name,
          color: sectionData.color,
          basePrice: sectionData.basePrice,
          description: sectionData.description || null,
        });
        createdSections.push(created);
        if (tempId) {
          sectionIdMap.set(tempId, created.id);
        }
      }

      // Create seats with sanitized data and correct section IDs
      const seatsToCreate = seats.map((seat: any) => {
        const { tempId, ...seatData } = seat;
        return {
          venueId,
          sectionId: sectionIdMap.get(seat.sectionId) || seat.sectionId,
          row: seatData.row,
          number: seatData.number,
          seatLabel: seatData.seatLabel,
          priceOverride: seatData.priceOverride || null,
          x: seatData.x,
          y: seatData.y,
          isAccessible: seatData.isAccessible || false,
        };
      });

      const createdSeats = await storage.bulkCreateSeats(seatsToCreate);

      // Update venue to indicate it has a seat map
      await storage.updateVenue(venueId, userId, { hasSeatMap: true });

      res.json({ sections: createdSections, seats: createdSeats });
    } catch (error) {
      console.error("Error saving seat map:", error);
      res.status(500).json({ message: "Failed to save seat map" });
    }
  });

  app.get("/api/events/:id/seat-availability", async (req, res) => {
    try {
      const eventId = req.params.id;
      
      // Release expired reservations first
      await storage.releaseExpiredReservations(eventId);
      
      const availability = await storage.getEventSeatAvailability(eventId);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching seat availability:", error);
      res.status(500).json({ message: "Failed to fetch seat availability" });
    }
  });

  app.post("/api/events/:id/reserve-seats", isAuthenticated, async (req, res) => {
    try {
      const eventId = req.params.id;
      const { seatIds } = req.body;

      if (!Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({ message: "Seat IDs are required" });
      }

      // Release expired reservations first (before availability check)
      await storage.releaseExpiredReservations(eventId);

      // Check if seats are available (immediately before reservation attempt)
      const availability = await storage.getEventSeatAvailability(eventId);
      const unavailableSeats = seatIds.filter(seatId => {
        const seat = availability.find(a => a.seat.id === seatId);
        return !seat || seat.status !== 'available';
      });

      if (unavailableSeats.length > 0) {
        return res.status(409).json({ 
          message: "Some seats are no longer available",
          unavailableSeats 
        });
      }

      // Attempt to reserve the seats
      // The database unique constraint on (event_id, seat_id) will prevent double-booking
      try {
        const reservations = await storage.reserveEventSeats(eventId, seatIds);
        res.json(reservations);
      } catch (dbError: any) {
        // If constraint violation, seats were just reserved by another request
        if (dbError.code === '23505') { // Unique constraint violation
          return res.status(409).json({ 
            message: "Some seats were just reserved by another user",
          });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Error reserving seats:", error);
      res.status(500).json({ message: "Failed to reserve seats" });
    }
  });

  // Admin routes (protected with middleware)
  
  // Get all courts data for admin (with detailed information)
  app.get("/api/admin/courts/all", requireAdmin, async (req: any, res) => {
    try {
      const courts = await storage.getAllCourtsWithDetails();
      res.json(courts);
    } catch (error) {
      console.error("Error fetching all courts:", error);
      res.status(500).json({ message: "Failed to fetch all courts" });
    }
  });

  // Set commission rate for a specific court
  app.put("/api/admin/courts/:id/commission", requireAdmin, async (req: any, res) => {
    try {
      const { commissionRate } = req.body;
      if (!commissionRate || isNaN(parseFloat(commissionRate))) {
        return res.status(400).json({ message: "Valid commission rate is required" });
      }
      
      const court = await storage.setCourtCommission(req.params.id, parseFloat(commissionRate));
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      res.json({ message: "Commission rate updated successfully", court });
    } catch (error) {
      console.error("Error updating commission rate:", error);
      res.status(500).json({ message: "Failed to update commission rate" });
    }
  });

  // Admin routes for vendor approval management
  app.get('/api/admin/pending-vendors', requireAdmin, async (req, res) => {
    try {
      const pendingVendors = await storage.getPendingVendors();
      res.json(pendingVendors);
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
      res.status(500).json({ message: "Failed to fetch pending vendors" });
    }
  });

  app.post('/api/admin/approve-vendor/:vendorId', requireAdmin, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const updatedVendor = await storage.updateVendorStatus(vendorId, "verified");
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      try {
        const vendorEmail = updatedVendor.email || '';
        const vendorName = `${updatedVendor.firstName || ''} ${updatedVendor.lastName || ''}`.trim() || 'Vendor';
        if (vendorEmail) {
          await EmailService.sendVendorApproved({ vendorEmail, vendorName });
        }
      } catch (emailError) {
        console.warn('Failed to send vendor approval email:', emailError);
      }

      res.json({ message: "Vendor approved successfully", vendor: updatedVendor });
    } catch (error) {
      console.error("Error approving vendor:", error);
      res.status(500).json({ message: "Failed to approve vendor" });
    }
  });

  app.post('/api/admin/reject-vendor/:vendorId', requireAdmin, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { reason } = req.body;
      const updatedVendor = await storage.updateVendorStatus(vendorId, "rejected");
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }

      try {
        const vendorEmail = updatedVendor.email || '';
        const vendorName = `${updatedVendor.firstName || ''} ${updatedVendor.lastName || ''}`.trim() || 'Vendor';
        if (vendorEmail) {
          await EmailService.sendVendorRejected({ vendorEmail, vendorName, reason });
        }
      } catch (emailError) {
        console.warn('Failed to send vendor rejection email:', emailError);
      }

      res.json({ message: "Vendor rejected successfully", vendor: updatedVendor });
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({ message: "Failed to reject vendor" });
    }
  });

  app.get("/api/admin/pending-courts", requireAdmin, async (req: any, res) => {
    try {
      const pendingCourts = await storage.getPendingCourts();
      res.json(pendingCourts);
    } catch (error) {
      console.error("Error fetching pending courts:", error);
      res.status(500).json({ message: "Failed to fetch pending courts" });
    }
  });

  app.put("/api/admin/courts/:id/approve", requireAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const court = await storage.approveCourt(req.params.id, adminNotes);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }

      // Send court approval notification
      try {
        const vendor = await storage.getUser(court.vendorId);
        if (vendor) {
          await EnhancedNotificationService.sendCourtApprovalNotification({
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorPhone: vendor.phoneNumber || undefined,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            courtName: court.name,
            approved: true
          });
        }
      } catch (notificationError) {
        console.error('Error sending court approval notification:', notificationError);
      }

      res.json(court);
    } catch (error) {
      console.error("Error approving court:", error);
      res.status(500).json({ message: "Failed to approve court" });
    }
  });

  app.put("/api/admin/courts/:id/reject", requireAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const court = await storage.rejectCourt(req.params.id, adminNotes);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }

      // Send court rejection notification
      try {
        const vendor = await storage.getUser(court.vendorId);
        if (vendor) {
          await EnhancedNotificationService.sendCourtApprovalNotification({
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorPhone: vendor.phoneNumber || undefined,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            courtName: court.name,
            approved: false,
            rejectionReason: adminNotes || 'Please review and update your court information.'
          });
        }
      } catch (notificationError) {
        console.error('Error sending court rejection notification:', notificationError);
      }

      res.json(court);
    } catch (error) {
      console.error("Error rejecting court:", error);
      res.status(500).json({ message: "Failed to reject court" });
    }
  });

  // Fireflies Admin Routes - Venue and Event Approval
  app.get("/api/admin/pending-venues", requireAdmin, async (req: any, res) => {
    try {
      const pendingVenues = await storage.getPendingVenues();
      res.json(pendingVenues);
    } catch (error) {
      console.error("Error fetching pending venues:", error);
      res.status(500).json({ message: "Failed to fetch pending venues" });
    }
  });

  app.put("/api/admin/venues/:id/approve", requireAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const venue = await storage.approveVenue(req.params.id, adminNotes);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      console.error("Error approving venue:", error);
      res.status(500).json({ message: "Failed to approve venue" });
    }
  });

  app.put("/api/admin/venues/:id/reject", requireAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const venue = await storage.rejectVenue(req.params.id, adminNotes);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      console.error("Error rejecting venue:", error);
      res.status(500).json({ message: "Failed to reject venue" });
    }
  });

  app.get("/api/admin/pending-events", requireAdmin, async (req: any, res) => {
    try {
      const pendingEvents = await storage.getPendingEvents();
      res.json(pendingEvents);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      res.status(500).json({ message: "Failed to fetch pending events" });
    }
  });

  app.put("/api/admin/events/:id/approve", requireAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const event = await storage.approveEvent(req.params.id, adminNotes);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error approving event:", error);
      res.status(500).json({ message: "Failed to approve event" });
    }
  });

  app.put("/api/admin/events/:id/reject", requireAdmin, async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const event = await storage.rejectEvent(req.params.id, adminNotes);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error rejecting event:", error);
      res.status(500).json({ message: "Failed to reject event" });
    }
  });

  // Admin seed sample courts for production
  app.post("/api/admin/seed-courts", requireAdmin, async (req: any, res) => {
    try {
      const sampleCourts = [
        {
          name: "Kenya Nairobi Basketball Court",
          availableSports: ["Basketball"],
          city: "Nairobi",
          area: "Westlands",
          hourlyRate: "1500.00",
          peakHourRate: "2000.00",
          openingTime: "06:30",
          closingTime: "22:30",
          availableDays: ["Monday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          description: "Premium indoor basketball court with professional flooring",
          rules: "Please wear proper sports shoes",
          isActive: true,
          approvalStatus: "approved" as const,
          commissionRate: "12.00"
        },
        {
          name: "Mombasa Beach Football Pitch",
          availableSports: ["Football"],
          city: "Mombasa",
          area: "Nyali",
          hourlyRate: "1200.00",
          peakHourRate: "1800.00",
          openingTime: "06:00",
          closingTime: "21:00",
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          description: "Beautiful beachside football pitch with ocean views",
          rules: "No metal studs allowed",
          isActive: true,
          approvalStatus: "approved" as const,
          commissionRate: "15.00"
        },
        {
          name: "Kisumu Tennis Club",
          availableSports: ["Tennis", "Badminton"],
          city: "Kisumu",
          area: "Milimani",
          hourlyRate: "2000.00",
          peakHourRate: "2500.00",
          openingTime: "07:00",
          closingTime: "20:00",
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          description: "Professional tennis courts with excellent lighting",
          rules: "Proper tennis attire required",
          isActive: true,
          approvalStatus: "approved" as const,
          commissionRate: "14.00"
        },
        {
          name: "Nakuru Multi-Sports Arena",
          availableSports: ["Football", "Basketball", "Volleyball", "Netball"],
          city: "Nakuru",
          area: "Town Centre",
          hourlyRate: "1800.00",
          peakHourRate: "2200.00",
          openingTime: "06:00",
          closingTime: "22:00",
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          description: "Versatile indoor arena suitable for multiple sports",
          rules: "Book in advance for peak hours",
          isActive: true,
          approvalStatus: "approved" as const,
          commissionRate: "13.00"
        },
        {
          name: "Eldoret Athletics Track",
          availableSports: ["Athletics", "Football"],
          city: "Eldoret",
          area: "Kipchoge Arena",
          hourlyRate: "1000.00",
          peakHourRate: "1500.00",
          openingTime: "05:00",
          closingTime: "19:00",
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          description: "World-class athletics track in the home of champions",
          rules: "Spikes allowed on track only",
          isActive: true,
          approvalStatus: "approved" as const,
          commissionRate: "10.00"
        },
        {
          name: "Nairobi Swimming Complex",
          availableSports: ["Swimming"],
          city: "Nairobi",
          area: "Kasarani",
          hourlyRate: "800.00",
          peakHourRate: "1200.00",
          openingTime: "06:00",
          closingTime: "21:00",
          availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          description: "Olympic-sized swimming pool with trained lifeguards",
          rules: "Swimming cap required",
          isActive: true,
          approvalStatus: "approved" as const,
          commissionRate: "15.00"
        }
      ];

      // First, create or get a system vendor user
      let systemVendor = await storage.getUser("system-vendor");
      if (!systemVendor) {
        systemVendor = await storage.upsertUser({
          id: "system-vendor",
          email: "vendor@sportsbox.co.ke",
          firstName: "SportsBox",
          lastName: "Vendor",
          userType: "vendor",
          vendorVerificationStatus: "verified"
        });
      }

      const createdCourts = [];
      for (const courtData of sampleCourts) {
        const court = await storage.createCourt({
          ...courtData,
          vendorId: systemVendor.id
        });
        createdCourts.push(court);
      }

      res.json({ 
        message: `Successfully seeded ${createdCourts.length} courts`,
        courts: createdCourts 
      });
    } catch (error) {
      console.error("Error seeding courts:", error);
      res.status(500).json({ message: "Failed to seed courts" });
    }
  });

  // Admin delete court
  app.delete("/api/admin/courts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      
      if (!user || user.userType !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id: courtId } = req.params;

      const success = await storage.adminDeleteCourt(courtId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete court" });
      }

      res.json({ message: "Court deleted successfully" });
    } catch (error) {
      console.error("Error deleting court:", error);
      res.status(500).json({ message: "Failed to delete court" });
    }
  });

  // Get analytics for a specific court
  app.get("/api/admin/courts/:courtId/analytics", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      
      if (!user || user.userType !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { courtId } = req.params;
      const analytics = await storage.getCourtAnalytics(courtId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching court analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get all courts analytics overview
  app.get("/api/admin/courts/analytics/overview", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      
      if (!user || user.userType !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const overview = await storage.getAllCourtsAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  // Vendor stats with Google auth
  app.get("/api/vendor/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      console.log("Vendor stats - User ID:", userId);
      const user = await storage.getUser(userId);
      console.log("Vendor stats - Found user:", user);
      
      if (!user || user.userType !== "vendor") {
        console.log("Vendor stats - Access denied. User type:", user?.userType);
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const stats = await storage.getVendorStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Vendor courts with Google auth
  app.get("/api/vendor/courts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const courts = await storage.getCourtsByVendor(userId);
      res.json(courts);
    } catch (error) {
      console.error("Error fetching vendor courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  // Vendor bookings with Google auth
  app.get("/api/vendor/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const bookings = await storage.getBookingsByVendor(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  // Check if current user is vendor
  app.get("/api/vendor/check", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      
      const isVendor = user?.userType === "vendor";
      res.json({ 
        isVendor,
        user: isVendor ? user : null
      });
    } catch (error) {
      console.error("Error checking vendor status:", error);
      res.status(500).json({ message: "Failed to check vendor status" });
    }
  });

  // Vendor analytics - detailed court analytics with Google auth
  app.get("/api/vendor/analytics/courts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const courtAnalytics = await storage.getVendorCourtAnalytics(userId);
      res.json(courtAnalytics);
    } catch (error) {
      console.error("Error fetching court analytics:", error);
      res.status(500).json({ message: "Failed to fetch court analytics" });
    }
  });

  // Vendor analytics - city performance with Google auth
  app.get("/api/vendor/analytics/cities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const cityAnalytics = await storage.getVendorCityAnalytics(userId);
      res.json(cityAnalytics);
    } catch (error) {
      console.error("Error fetching city analytics:", error);
      res.status(500).json({ message: "Failed to fetch city analytics" });
    }
  });

  // Vendor event bookings with Google auth
  app.get("/api/vendor/event-bookings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }

      const eventBookings = await storage.getEventBookingsByVendor(userId);
      res.json(eventBookings);
    } catch (error) {
      console.error("Error fetching vendor event bookings:", error);
      res.status(500).json({ message: "Failed to fetch event bookings" });
    }
  });

  // Notification API routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const notifications = await storage.getUserNotifications(userId, limit, offset);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });

  app.post("/api/notifications/:notificationId/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { notificationId } = req.params;
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:notificationId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const { notificationId } = req.params;
      await storage.deleteNotification(notificationId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Notification preferences routes
  app.get("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let preferences = await storage.getUserNotificationPreferences(userId);
      
      // Create default preferences if none exist
      if (!preferences) {
        preferences = await storage.createUserNotificationPreferences({
          userId,
          bookingConfirmations: true,
          bookingReminders: true,
          bookingCancellations: true,
          vendorBookingAlerts: true,
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });

  app.put("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const preferences = insertUserNotificationPreferencesSchema.partial().parse(req.body);
      await storage.updateUserNotificationPreferences(userId, preferences);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      res.status(500).json({ message: "Failed to update notification preferences" });
    }
  });

  // Notification testing endpoints
  app.post("/api/test/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { type } = req.body;

      switch (type) {
        case 'booking_confirmation':
          await EnhancedNotificationService.sendBookingConfirmation({
            bookingId: 'TEST-BOOKING-123',
            customerId: user.id,
            customerEmail: user.email,
            customerPhone: user.phoneNumber || undefined,
            customerName: `${user.firstName} ${user.lastName}`,
            courtName: 'Test Basketball Court',
            bookingDate: new Date().toLocaleDateString('en-KE'),
            startTime: '10:00 AM',
            endTime: '11:00 AM',
            totalAmount: '2500',
            equipmentRented: ['Basketball', 'Court Shoes']
          });
          break;

        case 'email_test':
          await EmailService.sendEmail({
            to: user.email,
            subject: 'SportsBox Kenya - Email Test Successful!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
                  <h1>SportsBox Kenya</h1>
                  <h2>Email System Working!</h2>
                </div>
                <div style="padding: 20px;">
                  <p>Hello ${user.firstName}!</p>
                  <p>Your SportsBox Kenya email notifications are working perfectly.</p>
                </div>
              </div>
            `
          });
          break;

        default:
          return res.status(400).json({ message: 'Invalid notification type' });
      }

      res.json({ 
        success: true, 
        message: `Test ${type} notification sent successfully!`,
        recipient: user.email
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({ message: 'Failed to send test notification' });
    }
  });

  // ==========================================
  // M-PESA PAYMENT ROUTES
  // ==========================================

  // Initiate M-Pesa STK Push for SportsBox court booking
  // Allow unauthenticated requests for guest bookings
  app.post("/api/mpesa/stkpush/booking", async (req: any, res) => {
    try {
      const { bookingId, phone } = req.body;
      
      if (!bookingId || !phone) {
        return res.status(400).json({ message: "Booking ID and phone number are required" });
      }
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Validate booking ownership: either user's booking or guest booking
      const customerId = req.user?.claims?.sub || req.user?.id || null;
      if (!booking.isGuestBooking && booking.customerId !== customerId) {
        return res.status(403).json({ message: "Unauthorized to pay for this booking" });
      }
      
      if (booking.paymentStatus === "completed") {
        return res.status(400).json({ message: "Payment already completed for this booking" });
      }
      
      const response = await initiateSTKPush({
        phone,
        amount: Number(booking.totalAmount),
        accountReference: `BK${bookingId.slice(0, 8).toUpperCase()}`,
        transactionDesc: "Court Booking",
      });
      
      // Store the checkout request ID for later verification
      await storage.updateBookingPayment(bookingId, {
        mpesaCheckoutRequestId: response.CheckoutRequestID,
        mpesaMerchantRequestId: response.MerchantRequestID,
        mpesaPhoneNumber: formatPhoneNumber(phone),
      });
      
      res.json({
        success: true,
        message: "Payment prompt sent to your phone",
        checkoutRequestId: response.CheckoutRequestID,
        customerMessage: response.CustomerMessage,
      });
    } catch (error: any) {
      console.error("M-Pesa STK Push error:", error);
      res.status(500).json({ message: error.message || "Failed to initiate payment" });
    }
  });

  // Initiate M-Pesa STK Push for Fireflies event ticket
  app.post("/api/mpesa/stkpush/event-booking", isAuthenticated, async (req, res) => {
    try {
      const { eventBookingId, phone } = req.body;
      
      if (!eventBookingId || !phone) {
        return res.status(400).json({ message: "Event booking ID and phone number are required" });
      }
      
      const eventBooking = await storage.getEventBooking(eventBookingId);
      if (!eventBooking) {
        return res.status(404).json({ message: "Event booking not found" });
      }
      
      if (eventBooking.paymentStatus === "completed") {
        return res.status(400).json({ message: "Payment already completed for this booking" });
      }
      
      const response = await initiateSTKPush({
        phone,
        amount: Number(eventBooking.totalAmount),
        accountReference: `EV${eventBookingId.slice(0, 8).toUpperCase()}`,
        transactionDesc: "Event Ticket",
      });
      
      // Store the checkout request ID for later verification
      await storage.updateEventBookingPayment(eventBookingId, {
        mpesaCheckoutRequestId: response.CheckoutRequestID,
        mpesaMerchantRequestId: response.MerchantRequestID,
        mpesaPhoneNumber: formatPhoneNumber(phone),
      });
      
      res.json({
        success: true,
        message: "Payment prompt sent to your phone",
        checkoutRequestId: response.CheckoutRequestID,
        customerMessage: response.CustomerMessage,
      });
    } catch (error: any) {
      console.error("M-Pesa STK Push error:", error);
      res.status(500).json({ message: error.message || "Failed to initiate payment" });
    }
  });

  // M-Pesa callback endpoint (receives payment notifications from Safaricom)
  app.post("/api/mpesa/callback", async (req, res) => {
    try {
      console.log("===== M-PESA CALLBACK RECEIVED =====");
      console.log(JSON.stringify(req.body, null, 2));
      
      const callbackData = parseCallbackData(req.body as MPesaCallbackData);
      
      if (callbackData.success) {
        console.log("✅ M-Pesa Payment successful!");
        console.log("Receipt:", callbackData.mpesaReceiptNumber);
        console.log("Amount:", callbackData.amount);
        console.log("Phone:", callbackData.phoneNumber);
        
        // Try to find and update court booking
        const booking = await storage.getBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (booking) {
          await storage.updateBookingPayment(booking.id, {
            paymentStatus: "completed",
            mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
            mpesaTransactionDate: callbackData.transactionDate,
          });
          console.log("Court booking payment updated:", booking.id);

          // Send confirmation email only after payment is confirmed
          try {
            const court = await storage.getCourtById(booking.courtId);
            let recipientEmail: string | undefined;
            let recipientName: string;

            if (booking.isGuestBooking) {
              recipientEmail = booking.guestEmail ?? undefined;
              recipientName = booking.guestName || 'Valued Guest';
            } else if (booking.customerId) {
              const customer = await storage.getUser(booking.customerId);
              recipientEmail = customer?.email ?? undefined;
              recipientName = `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Valued Customer';
            }

            if (recipientEmail && court) {
              await EmailService.sendBookingConfirmation({
                customerEmail: recipientEmail,
                customerName: recipientName!,
                courtName: court.name,
                bookingDate: booking.date,
                startTime: booking.timeSlot,
                endTime: booking.endTime,
                totalAmount: booking.totalAmount?.toString() ?? '0',
                bookingId: booking.id,
              });
              console.log("Post-payment confirmation email sent to:", recipientEmail);
            }
          } catch (emailError) {
            console.error("Failed to send post-payment confirmation email:", emailError);
          }
        }
        
        // Try to find and update event booking
        const eventBooking = await storage.getEventBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (eventBooking) {
          await storage.updateEventBookingPayment(eventBooking.id, {
            paymentStatus: "completed",
            mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
            mpesaTransactionDate: callbackData.transactionDate,
          });
          console.log("Event booking payment updated:", eventBooking.id);
        }
      } else {
        console.log("❌ M-Pesa Payment failed:", callbackData.resultDesc);
        
        // Update booking status to failed
        const booking = await storage.getBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (booking) {
          await storage.updateBookingPayment(booking.id, {
            paymentStatus: "failed",
          });
        }
        
        const eventBooking = await storage.getEventBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (eventBooking) {
          await storage.updateEventBookingPayment(eventBooking.id, {
            paymentStatus: "failed",
          });
        }
      }
      
      // Always respond with success to Safaricom
      res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
      console.error("M-Pesa callback error:", error);
      res.json({ ResultCode: 0, ResultDesc: "Success" });
    }
  });

  // Query M-Pesa payment status for court booking
  // Allow unauthenticated requests for guest bookings
  app.get("/api/mpesa/query/booking/:bookingId", async (req: any, res) => {
    try {
      const { bookingId } = req.params;
      
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // Validate booking ownership: either user's booking or guest booking
      const customerId = req.user?.claims?.sub || req.user?.id || null;
      if (!booking.isGuestBooking && booking.customerId !== customerId) {
        return res.status(403).json({ message: "Unauthorized to query this payment" });
      }
      
      if (!booking.mpesaCheckoutRequestId) {
        return res.status(400).json({ message: "No M-Pesa payment initiated for this booking" });
      }
      
      // If already completed, return status from database
      if (booking.paymentStatus === "completed") {
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: booking.mpesaReceiptNumber,
        });
      }
      
      // Query for status (works with both real and simulated)
      const response = await querySTKPushStatus(booking.mpesaCheckoutRequestId);
      
      const isSuccess = response.ResultCode === "0";
      if (isSuccess && booking.paymentStatus !== "completed") {
        // For simulated payments, generate a receipt number
        const receiptNumber = getSimulatedReceiptNumber(booking.mpesaCheckoutRequestId) || undefined;
        
        await storage.updateBookingPayment(bookingId, {
          paymentStatus: "completed",
          mpesaReceiptNumber: receiptNumber,
        });
        
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: receiptNumber,
          resultDesc: response.ResultDesc,
          isSimulation: isSimulationMode(),
        });
      }
      
      res.json({
        success: isSuccess,
        status: isSuccess ? "completed" : "pending",
        resultDesc: response.ResultDesc,
        isSimulation: isSimulationMode(),
      });
    } catch (error: any) {
      console.error("M-Pesa query error:", error);
      res.status(500).json({ message: error.message || "Failed to query payment status" });
    }
  });

  // Query M-Pesa payment status for event booking
  app.get("/api/mpesa/query/event-booking/:eventBookingId", isAuthenticated, async (req, res) => {
    try {
      const { eventBookingId } = req.params;
      
      const eventBooking = await storage.getEventBooking(eventBookingId);
      if (!eventBooking) {
        return res.status(404).json({ message: "Event booking not found" });
      }
      
      if (!eventBooking.mpesaCheckoutRequestId) {
        return res.status(400).json({ message: "No M-Pesa payment initiated for this booking" });
      }
      
      // If already completed, return status from database
      if (eventBooking.paymentStatus === "completed") {
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: eventBooking.mpesaReceiptNumber,
        });
      }
      
      // Query for status (works with both real and simulated)
      const response = await querySTKPushStatus(eventBooking.mpesaCheckoutRequestId);
      
      const isSuccess = response.ResultCode === "0";
      if (isSuccess && eventBooking.paymentStatus !== "completed") {
        // For simulated payments, generate a receipt number
        const receiptNumber = getSimulatedReceiptNumber(eventBooking.mpesaCheckoutRequestId) || undefined;
        
        await storage.updateEventBookingPayment(eventBookingId, {
          paymentStatus: "completed",
          mpesaReceiptNumber: receiptNumber,
        });
        
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: receiptNumber,
          resultDesc: response.ResultDesc,
          isSimulation: isSimulationMode(),
        });
      }
      
      res.json({
        success: isSuccess,
        status: isSuccess ? "completed" : "pending",
        resultDesc: response.ResultDesc,
        isSimulation: isSimulationMode(),
      });
    } catch (error: any) {
      console.error("M-Pesa query error:", error);
      res.status(500).json({ message: error.message || "Failed to query payment status" });
    }
  });

  // Investor pitch PDF download
  app.get("/api/pitch/download", (req, res) => {
    try {
      generatePitchPDF(res);
    } catch (error: any) {
      console.error("Pitch PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate pitch document" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
