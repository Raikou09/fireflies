import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
// import { setupGoogleAuth } from "./googleAuth"; // Disabled - using Replit Auth instead
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
} from "@shared/schema";
import { notificationService } from "./notificationService";
import { EnhancedNotificationService } from "./enhancedNotificationService";
import { EmailService } from "./emailService";
import { SMSService } from "./smsService";
import { z } from "zod";

// Admin middleware to check authentication
const requireAdminAuth = (req: any, res: any, next: any) => {
  if ((req.session as any)?.adminAuthenticated) {
    next();
  } else {
    res.status(401).json({ message: "Admin authentication required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - using Replit's built-in authentication
  await setupAuth(app);
  // Google OAuth disabled - using Replit Auth instead
  // setupGoogleAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
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

  // Check if user can create courts (must be verified vendor)
  app.get('/api/vendor/can-create-courts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const canCreate = user.userType === "vendor" && user.vendorVerificationStatus === "verified";
      res.json({ canCreate, user });
    } catch (error) {
      console.error("Error checking vendor status:", error);
      res.status(500).json({ message: "Failed to check vendor status" });
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
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
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

  // Booking availability route
  app.get("/api/bookings/availability/:courtId", async (req, res) => {
    try {
      const { courtId } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const bookings = await storage.getBookingsByCourtAndDate(courtId, date as string);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Create booking route
  app.post("/api/bookings", async (req, res) => {
    try {
      const { courtId, date, timeSlot, duration, totalAmount } = req.body;
      
      if (!courtId || !date || !timeSlot || !duration || !totalAmount) {
        return res.status(400).json({ message: "Missing required booking fields" });
      }

      // For now, create booking without authentication
      // In production, you would get userId from authenticated session
      const booking = await storage.createBooking({
        courtId,
        bookingDate: new Date(date),
        startTime: timeSlot,
        endTime: `${parseInt(timeSlot.split(':')[0]) + duration}:00`,
        courtAmount: totalAmount.toString(),
        totalAmount: totalAmount.toString(),
        status: "confirmed",
      });

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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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
      const userId = req.user?.claims?.sub;
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

  app.post("/api/courts", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      if (!vendorId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log('Creating court with data:', req.body);
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
      const vendorId = req.user.claims.sub;
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
      const vendorId = req.user.claims.sub;
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
      const vendorId = req.user.claims.sub;
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

  // Booking routes
  app.post("/api/bookings", isAuthenticated, async (req: any, res) => {
    try {
      const customerId = req.user?.claims?.sub || req.user?.id;
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking({ 
        ...bookingData, 
        customerId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Get customer and court details for notifications
      const customer = await storage.getUser(customerId);
      const court = await storage.getCourtById(bookingData.courtId);
      
      if (customer && court) {
        // Send comprehensive booking confirmation notifications
        try {
          await EnhancedNotificationService.sendBookingConfirmation({
            bookingId: booking.id,
            customerId: customer.id,
            customerEmail: customer.email,
            customerPhone: customer.phoneNumber || undefined,
            customerName: `${customer.firstName} ${customer.lastName}`,
            courtName: court.name,
            bookingDate: new Date(bookingData.bookingDate).toLocaleDateString('en-KE'),
            startTime: bookingData.startTime,
            endTime: bookingData.endTime,
            totalAmount: bookingData.totalAmount,
            equipmentRented: bookingData.equipmentIds || []
          });

          // Send vendor earnings notification
          const vendor = await storage.getUser(court.vendorId);
          if (vendor) {
            const commissionRate = 0.15; // 15% commission
            const totalAmount = parseFloat(bookingData.totalAmount);
            const commission = totalAmount * commissionRate;
            const earnings = totalAmount - commission;

            await EnhancedNotificationService.sendVendorEarningsNotification({
              vendorId: vendor.id,
              vendorEmail: vendor.email,
              vendorName: `${vendor.firstName} ${vendor.lastName}`,
              courtName: court.name,
              bookingDate: new Date(bookingData.bookingDate).toLocaleDateString('en-KE'),
              customerName: `${customer.firstName} ${customer.lastName}`,
              earnings: earnings.toFixed(2),
              commission: commission.toFixed(2),
              bookingId: booking.id
            });
          }
        } catch (notificationError) {
          console.error('Error sending booking notifications:', notificationError);
          // Don't fail the booking if notifications fail
        }
      }
      
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
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

  // Admin authentication
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple admin credentials check (you can enhance this with proper hashing)
      if (username === "admin" && password === "admin123") {
        // Set admin session
        (req.session as any).adminAuthenticated = true;
        (req.session as any).adminId = "admin";
        
        res.json({ success: true, message: "Admin authenticated" });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Authentication error" });
    }
  });

  // Admin authentication check
  app.get("/api/admin/auth", (req: any, res) => {
    if ((req.session as any)?.adminAuthenticated) {
      res.json({ authenticated: true, adminId: (req.session as any).adminId });
    } else {
      res.status(401).json({ authenticated: false, message: "Not authenticated" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req: any, res) => {
    if (req.session) {
      (req.session as any).adminAuthenticated = false;
      (req.session as any).adminId = null;
    }
    res.json({ success: true, message: "Admin logged out" });
  });

  // Admin routes (protected with middleware)
  
  // Get all courts data for admin (with detailed information)
  app.get("/api/admin/courts/all", requireAdminAuth, async (req: any, res) => {
    try {
      const courts = await storage.getAllCourtsWithDetails();
      res.json(courts);
    } catch (error) {
      console.error("Error fetching all courts:", error);
      res.status(500).json({ message: "Failed to fetch all courts" });
    }
  });

  // Set commission rate for a specific court
  app.put("/api/admin/courts/:id/commission", requireAdminAuth, async (req: any, res) => {
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

  app.get("/api/admin/pending-courts", requireAdminAuth, async (req: any, res) => {
    try {
      const pendingCourts = await storage.getPendingCourts();
      res.json(pendingCourts);
    } catch (error) {
      console.error("Error fetching pending courts:", error);
      res.status(500).json({ message: "Failed to fetch pending courts" });
    }
  });

  app.put("/api/admin/courts/:id/approve", requireAdminAuth, async (req: any, res) => {
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

  app.put("/api/admin/courts/:id/reject", requireAdminAuth, async (req: any, res) => {
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
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

  const httpServer = createServer(app);
  return httpServer;
}
