import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  ObjectStorageService,
  ObjectNotFoundError,
} from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import {
  insertCourtSchema,
  insertEquipmentSchema,
  insertBookingSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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

  app.get("/api/courts/:id", async (req, res) => {
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

  app.get("/api/vendor/courts", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user.claims.sub;
      const courts = await storage.getCourtsByVendor(vendorId);
      res.json(courts);
    } catch (error) {
      console.error("Error fetching vendor courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });

  app.post("/api/courts", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user.claims.sub;
      const courtData = insertCourtSchema.parse(req.body);
      const court = await storage.createCourt(vendorId, courtData);
      res.status(201).json(court);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
      const customerId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(customerId, bookingData);
      
      // Here you would integrate with M-Pesa API and send SMS/Email
      // For now, we'll just return success
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
      const customerId = req.user.claims.sub;
      const bookings = await storage.getBookingsByCustomer(customerId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/vendor", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user.claims.sub;
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
        res.json({ success: true, message: "Admin authenticated" });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Authentication error" });
    }
  });

  // Admin routes
  app.get("/api/admin/pending-courts", async (req: any, res) => {
    try {
      const pendingCourts = await storage.getPendingCourts();
      res.json(pendingCourts);
    } catch (error) {
      console.error("Error fetching pending courts:", error);
      res.status(500).json({ message: "Failed to fetch pending courts" });
    }
  });

  app.put("/api/admin/courts/:id/approve", async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const court = await storage.approveCourt(req.params.id, adminNotes);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      res.json(court);
    } catch (error) {
      console.error("Error approving court:", error);
      res.status(500).json({ message: "Failed to approve court" });
    }
  });

  app.put("/api/admin/courts/:id/reject", async (req: any, res) => {
    try {
      const { adminNotes } = req.body;
      const court = await storage.rejectCourt(req.params.id, adminNotes);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      res.json(court);
    } catch (error) {
      console.error("Error rejecting court:", error);
      res.status(500).json({ message: "Failed to reject court" });
    }
  });

  // Vendor analytics
  app.get("/api/vendor/stats", isAuthenticated, async (req: any, res) => {
    try {
      const vendorId = req.user.claims.sub;
      const stats = await storage.getVendorStats(vendorId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching vendor stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
