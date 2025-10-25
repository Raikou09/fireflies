import {
  users,
  courts,
  equipment,
  bookings,
  reviews,
  notifications,
  userNotificationPreferences,
  venues,
  events,
  ticketTiers,
  eventBookings,
  type User,
  type UpsertUser,
  type Court,
  type InsertCourt,
  type Equipment,
  type InsertEquipment,
  type Booking,
  type InsertBooking,
  type Review,
  type InsertReview,
  type Notification,
  type InsertNotification,
  type UserNotificationPreferences,
  type InsertUserNotificationPreferences,
  type CourtWithDetails,
  type BookingWithDetails,
  type ReviewWithDetails,
  type Venue,
  type InsertVenue,
  type Event,
  type InsertEvent,
  type TicketTier,
  type InsertTicketTier,
  type EventBooking,
  type InsertEventBooking,
  type VenueWithDetails,
  type EventWithDetails,
  type EventBookingWithDetails,
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'profileImageUrl'>>): Promise<User | undefined>;

  // Court operations
  getCourts(filters?: {
    city?: string;
    sport?: string;
    search?: string;
    userLatitude?: number;
    userLongitude?: number;
    maxDistance?: number; // in km
    sortByDistance?: boolean;
  }): Promise<CourtWithDetails[]>;
  getCourtById(id: string): Promise<CourtWithDetails | undefined>;
  getCourtsByVendor(vendorId: string): Promise<CourtWithDetails[]>;
  createCourt(vendorId: string, court: InsertCourt): Promise<Court>;
  updateCourt(id: string, vendorId: string, court: Partial<InsertCourt>): Promise<Court | undefined>;
  updateCourtDetails(id: string, vendorId: string, updates: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: string, vendorId: string): Promise<boolean>;

  // Equipment operations
  getEquipmentByCourt(courtId: string): Promise<Equipment[]>;
  getAvailableEquipmentByCourt(courtId: string): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, equipment: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
  checkEquipmentAvailability(equipmentId: string, quantity: number, startTime: Date, endTime: Date): Promise<boolean>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingsByCustomer(customerId: string): Promise<BookingWithDetails[]>;
  getBookingsByVendor(vendorId: string): Promise<BookingWithDetails[]>;
  getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<BookingWithDetails | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;

  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByCourt(courtId: string): Promise<ReviewWithDetails[]>;
  getReviewsByCustomer(customerId: string): Promise<ReviewWithDetails[]>;
  updateReviewHelpfulness(reviewId: string, increment: boolean): Promise<Review | undefined>;
  reportReview(reviewId: string): Promise<Review | undefined>;

  // Analytics
  getVendorStats(vendorId: string): Promise<{
    totalCourts: number;
    activeBookings: number;
    monthlyRevenue: number;
    averageRating: number;
  }>;
  getVendorCourtAnalytics(vendorId: string): Promise<Array<{
    courtId: string;
    courtName: string;
    city: string;
    totalBookings: number;
    revenue: number;
    averageRating: number;
    popularSports: Array<{ sport: string; bookings: number }>;
    recentBookings: Array<{
      date: string;
      sport: string;
      revenue: number;
      customerPhone: string;
    }>;
  }>>;
  getVendorCityAnalytics(vendorId: string): Promise<Array<{
    city: string;
    totalCourts: number;
    totalBookings: number;
    revenue: number;
    popularSports: Array<{ sport: string; bookings: number }>;
  }>>;

  // Admin operations
  getPendingCourts(): Promise<CourtWithDetails[]>;
  getPendingVendors(): Promise<User[]>;
  updateVendorStatus(vendorId: string, status: "pending" | "verified" | "rejected"): Promise<User | null>;
  getAllCourtsWithDetails(): Promise<CourtWithDetails[]>;
  setCourtCommission(id: string, commissionRate: number): Promise<Court | undefined>;
  approveCourt(courtId: string, adminNotes?: string): Promise<Court | undefined>;
  rejectCourt(courtId: string, adminNotes?: string): Promise<Court | undefined>;

  // FIREFLIES EVENT OPERATIONS
  
  // Venue operations
  getVenues(filters?: {
    city?: string;
    search?: string;
    userLatitude?: number;
    userLongitude?: number;
    maxDistance?: number;
    sortByDistance?: boolean;
  }): Promise<VenueWithDetails[]>;
  getVenueById(id: string): Promise<VenueWithDetails | undefined>;
  getVenuesByVendor(vendorId: string): Promise<VenueWithDetails[]>;
  createVenue(vendorId: string, venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, vendorId: string, venue: Partial<InsertVenue>): Promise<Venue | undefined>;
  deleteVenue(id: string, vendorId: string): Promise<boolean>;

  // Event operations
  getEvents(filters?: {
    city?: string;
    category?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    userLatitude?: number;
    userLongitude?: number;
    maxDistance?: number;
    sortByDistance?: boolean;
  }): Promise<EventWithDetails[]>;
  getEventById(id: string): Promise<EventWithDetails | undefined>;
  getEventsByVendor(vendorId: string): Promise<EventWithDetails[]>;
  createEvent(vendorId: string, event: InsertEvent): Promise<Event>;
  updateEvent(id: string, vendorId: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string, vendorId: string): Promise<boolean>;

  // Ticket tier operations
  getTicketTiersByEvent(eventId: string): Promise<TicketTier[]>;
  createTicketTier(ticketTier: InsertTicketTier): Promise<TicketTier>;
  updateTicketTier(id: string, ticketTier: Partial<InsertTicketTier>): Promise<TicketTier | undefined>;
  deleteTicketTier(id: string): Promise<boolean>;

  // Event booking operations
  createEventBooking(booking: InsertEventBooking): Promise<EventBooking>;
  getEventBookingsByCustomer(customerId: string): Promise<EventBookingWithDetails[]>;
  getEventBookingsByVendor(vendorId: string): Promise<EventBookingWithDetails[]>;
  getEventBookingById(id: string): Promise<EventBookingWithDetails | undefined>;
  updateEventBookingStatus(id: string, status: string): Promise<EventBooking | undefined>;

  // Event admin operations
  getPendingVenues(): Promise<VenueWithDetails[]>;
  getPendingEvents(): Promise<EventWithDetails[]>;
  approveVenue(venueId: string, adminNotes?: string): Promise<Venue | undefined>;
  rejectVenue(venueId: string, adminNotes?: string): Promise<Venue | undefined>;
  approveEvent(eventId: string, adminNotes?: string): Promise<Event | undefined>;
  rejectEvent(eventId: string, adminNotes?: string): Promise<Event | undefined>;
}

export class DatabaseStorage implements IStorage {
  
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, updates: Partial<Pick<User, 'firstName' | 'lastName' | 'profileImageUrl'>>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Court operations
  async getCourts(filters?: {
    city?: string;
    sport?: string;
    search?: string;
    userLatitude?: number;
    userLongitude?: number;
    maxDistance?: number; // in km
    sortByDistance?: boolean;
  }): Promise<CourtWithDetails[]> {
    let whereConditions = [eq(courts.isActive, true), eq(courts.approvalStatus, "approved")];

    if (filters?.city) {
      whereConditions.push(eq(courts.city, filters.city));
    }

    if (filters?.sport && filters.sport !== "All Sports") {
      // Check if the sport is in the availableSports array
      whereConditions.push(sql`${courts.availableSports} @> ARRAY[${filters.sport}]`);
    }

    const query = db
      .select()
      .from(courts)
      .leftJoin(users, eq(courts.vendorId, users.id))
      .leftJoin(equipment, eq(courts.id, equipment.courtId))
      .where(and(...whereConditions));

    const results = await query.orderBy(desc(courts.createdAt));

    // Group results by court
    const courtMap = new Map<string, CourtWithDetails>();
    
    for (const row of results) {
      if (!row.courts) continue;
      
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users!,
          equipment: [],
        });
      }
      
      if (row.equipment) {
        courtMap.get(courtId)!.equipment.push(row.equipment);
      }
    }

    let courtsArray = Array.from(courtMap.values());

    // Apply location-based filtering and sorting if user location is provided
    if (filters?.userLatitude && filters?.userLongitude) {
      // Add distance calculation to each court
      courtsArray = courtsArray.map(court => ({
        ...court,
        distance: court.latitude && court.longitude
          ? this.calculateDistance(
              filters.userLatitude!,
              filters.userLongitude!,
              parseFloat(court.latitude),
              parseFloat(court.longitude)
            )
          : undefined
      }));

      // Filter by max distance if specified
      if (filters.maxDistance) {
        courtsArray = courtsArray.filter(court => 
          court.distance !== undefined && court.distance <= filters.maxDistance!
        );
      }

      // Sort by distance if requested
      if (filters.sortByDistance) {
        courtsArray.sort((a, b) => {
          if (a.distance === undefined && b.distance === undefined) return 0;
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
      }
    }

    return courtsArray;
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private degToRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async getCourtById(id: string): Promise<CourtWithDetails | undefined> {
    const results = await db
      .select()
      .from(courts)
      .leftJoin(users, eq(courts.vendorId, users.id))
      .leftJoin(equipment, eq(courts.id, equipment.courtId))
      .where(eq(courts.id, id));

    if (results.length === 0) return undefined;

    const court = results[0].courts!;
    const vendor = results[0].users!;
    const equipmentList = results
      .filter(row => row.equipment)
      .map(row => row.equipment!);

    return {
      ...court,
      vendor,
      equipment: equipmentList,
    };
  }

  async getCourtsByVendor(vendorId: string): Promise<CourtWithDetails[]> {
    const results = await db
      .select()
      .from(courts)
      .leftJoin(users, eq(courts.vendorId, users.id))
      .leftJoin(equipment, eq(courts.id, equipment.courtId))
      .where(eq(courts.vendorId, vendorId))
      .orderBy(desc(courts.createdAt));

    // Group results by court
    const courtMap = new Map<string, CourtWithDetails>();
    
    for (const row of results) {
      if (!row.courts) continue;
      
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users!,
          equipment: [],
        });
      }
      
      if (row.equipment) {
        courtMap.get(courtId)!.equipment.push(row.equipment);
      }
    }

    return Array.from(courtMap.values());
  }

  async createCourt(vendorId: string, court: InsertCourt): Promise<Court> {
    const [newCourt] = await db
      .insert(courts)
      .values({ 
        ...court, 
        vendorId,
        approvalStatus: "pending", // Courts need admin approval
        isActive: false, // Inactive until approved
        commissionRate: "15.00" // Set default commission rate
      })
      .returning();
    return newCourt;
  }

  async updateCourt(id: string, vendorId: string, court: Partial<InsertCourt>): Promise<Court | undefined> {
    const [updatedCourt] = await db
      .update(courts)
      .set({ ...court, updatedAt: new Date() })
      .where(and(eq(courts.id, id), eq(courts.vendorId, vendorId)))
      .returning();
    return updatedCourt;
  }

  async updateCourtDetails(id: string, vendorId: string, updates: Partial<InsertCourt>): Promise<Court | undefined> {
    // When vendors update court details, it needs re-approval
    const [updatedCourt] = await db
      .update(courts)
      .set({ 
        ...updates, 
        approvalStatus: "pending",
        adminNotes: "Court details updated by vendor - pending re-approval",
        updatedAt: new Date() 
      })
      .where(and(eq(courts.id, id), eq(courts.vendorId, vendorId)))
      .returning();
    return updatedCourt;
  }

  async deleteCourt(id: string, vendorId: string): Promise<boolean> {
    const result = await db
      .delete(courts)
      .where(and(eq(courts.id, id), eq(courts.vendorId, vendorId)));
    return (result.rowCount || 0) > 0;
  }

  // Equipment operations
  async getEquipmentByCourt(courtId: string): Promise<Equipment[]> {
    return await db
      .select()
      .from(equipment)
      .where(eq(equipment.courtId, courtId))
      .orderBy(equipment.category, equipment.name);
  }

  async getAvailableEquipmentByCourt(courtId: string): Promise<Equipment[]> {
    return await db
      .select()
      .from(equipment)
      .where(and(eq(equipment.courtId, courtId), eq(equipment.isAvailable, true)))
      .orderBy(equipment.category, equipment.name);
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db
      .insert(equipment)
      .values({
        ...equipmentData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEquipment;
  }

  async updateEquipment(id: string, equipmentData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [updatedEquipment] = await db
      .update(equipment)
      .set({ ...equipmentData, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return updatedEquipment;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const result = await db
      .delete(equipment)
      .where(eq(equipment.id, id));
    return (result.rowCount || 0) > 0;
  }

  async checkEquipmentAvailability(equipmentId: string, quantity: number, startTime: Date, endTime: Date): Promise<boolean> {
    // Get equipment info
    const [equipmentInfo] = await db.select().from(equipment).where(eq(equipment.id, equipmentId));
    if (!equipmentInfo || !equipmentInfo.isAvailable) {
      return false;
    }

    // Check if requested quantity is available
    if (quantity > (equipmentInfo.quantityAvailable || 1)) {
      return false;
    }

    // For now, return true - will implement detailed availability checking later
    return true;
  }

  // Booking operations
  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values(booking as typeof bookings.$inferInsert)
      .returning();
    return newBooking;
  }

  async getBookingsByCustomer(customerId: string): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(courts, eq(bookings.courtId, courts.id))
      .leftJoin(users, eq(bookings.customerId, users.id))
      .where(eq(bookings.customerId, customerId))
      .orderBy(desc(bookings.createdAt));

    return results.map(row => ({
      ...row.bookings!,
      court: row.courts!,
      customer: row.users!,
    }));
  }

  async getBookingsByVendor(vendorId: string): Promise<BookingWithDetails[]> {
    const results = await db
      .select()
      .from(bookings)
      .leftJoin(courts, eq(bookings.courtId, courts.id))
      .leftJoin(users, eq(bookings.customerId, users.id))
      .where(eq(courts.vendorId, vendorId))
      .orderBy(desc(bookings.createdAt));

    return results.map(row => ({
      ...row.bookings!,
      court: row.courts!,
      customer: row.users!,
    }));
  }

  async getBookingsByCourtAndDate(courtId: string, date: string): Promise<Booking[]> {
    const bookingDate = new Date(date);
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    return await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.courtId, courtId),
          gte(bookings.bookingDate, bookingDate),
          lte(bookings.bookingDate, nextDay)
        )
      );
  }

  async getBookingById(id: string): Promise<BookingWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(courts, eq(bookings.courtId, courts.id))
      .leftJoin(users, eq(bookings.customerId, users.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    return {
      ...result.bookings!,
      court: result.courts!,
      customer: result.users!,
    };
  }

  async updateBookingStatus(id: string, status: "confirmed" | "completed" | "cancelled"): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Review operations
  async createReview(reviewData: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values(reviewData)
      .returning();
    
    // Update court rating after new review
    await this.updateCourtRating(reviewData.courtId);
    
    return newReview;
  }

  async getReviewsByCourt(courtId: string): Promise<ReviewWithDetails[]> {
    const results = await db
      .select()
      .from(reviews)
      .leftJoin(users, eq(reviews.customerId, users.id))
      .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
      .where(and(eq(reviews.courtId, courtId), eq(reviews.isVisible, true)))
      .orderBy(desc(reviews.createdAt));

    return results.map(row => ({
      ...row.reviews!,
      customer: row.users!,
      booking: row.bookings || undefined,
    }));
  }

  async getReviewsByCustomer(customerId: string): Promise<ReviewWithDetails[]> {
    const results = await db
      .select()
      .from(reviews)
      .leftJoin(users, eq(reviews.customerId, users.id))
      .leftJoin(courts, eq(reviews.courtId, courts.id))
      .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
      .where(eq(reviews.customerId, customerId))
      .orderBy(desc(reviews.createdAt));

    return results.map(row => ({
      ...row.reviews!,
      customer: row.users!,
      court: row.courts || undefined,
      booking: row.bookings || undefined,
    }));
  }

  async updateReviewHelpfulness(reviewId: string, increment: boolean): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ 
        helpfulVotes: increment 
          ? sql`${reviews.helpfulVotes} + 1`
          : sql`${reviews.helpfulVotes} - 1`
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updatedReview;
  }

  async reportReview(reviewId: string): Promise<Review | undefined> {
    const [updatedReview] = await db
      .update(reviews)
      .set({ 
        reportCount: sql`${reviews.reportCount} + 1`,
        // Hide review if it gets 5+ reports
        isVisible: sql`CASE WHEN ${reviews.reportCount} >= 4 THEN false ELSE ${reviews.isVisible} END`
      })
      .where(eq(reviews.id, reviewId))
      .returning();
    return updatedReview;
  }

  // Helper method to update court rating based on reviews
  private async updateCourtRating(courtId: string): Promise<void> {
    const [{ avg: averageRating, count: totalReviews }] = await db
      .select({ 
        avg: sql<number>`coalesce(avg(${reviews.rating}), 0)`,
        count: sql<number>`count(*)`
      })
      .from(reviews)
      .where(and(eq(reviews.courtId, courtId), eq(reviews.isVisible, true)));

    await db
      .update(courts)
      .set({ 
        rating: averageRating.toFixed(2),
        totalBookings: Number(totalReviews) // Using this field to store review count for now
      })
      .where(eq(courts.id, courtId));
  }

  // Analytics
  async getVendorStats(vendorId: string): Promise<{
    totalCourts: number;
    activeBookings: number;
    monthlyRevenue: number;
    averageRating: number;
  }> {
    // Get total courts
    const [{ count: totalCourts }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(courts)
      .where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)));

    // Get active bookings for current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    const [{ count: activeBookings }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .leftJoin(courts, eq(bookings.courtId, courts.id))
      .where(
        and(
          eq(courts.vendorId, vendorId),
          eq(bookings.status, "confirmed"),
          sql`${bookings.createdAt} >= ${startOfMonth}`,
          sql`${bookings.createdAt} <= ${endOfMonth}`
        )
      );

    // Get monthly revenue
    const [{ sum: monthlyRevenue }] = await db
      .select({ sum: sql<number>`coalesce(sum(${bookings.totalAmount}), 0)` })
      .from(bookings)
      .leftJoin(courts, eq(bookings.courtId, courts.id))
      .where(
        and(
          eq(courts.vendorId, vendorId),
          eq(bookings.paymentStatus, "completed"),
          sql`${bookings.createdAt} >= ${startOfMonth}`,
          sql`${bookings.createdAt} <= ${endOfMonth}`
        )
      );

    // Get average rating
    const [{ avg: averageRating }] = await db
      .select({ avg: sql<number>`coalesce(avg(${courts.rating}), 0)` })
      .from(courts)
      .where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)));

    return {
      totalCourts: Number(totalCourts) || 0,
      activeBookings: Number(activeBookings) || 0,
      monthlyRevenue: Number(monthlyRevenue) || 0,
      averageRating: Number(averageRating) || 0,
    };
  }

  // Vendor Court Analytics
  async getVendorCourtAnalytics(vendorId: string) {
    const vendorCourts = await db
      .select()
      .from(courts)
      .where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)));

    const analytics = [];
    
    for (const court of vendorCourts) {
      // Get total bookings for this court
      const [{ count: totalBookings }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(eq(bookings.courtId, court.id));

      // Get revenue for this court
      const [{ sum: revenue }] = await db
        .select({ sum: sql<number>`coalesce(sum(${bookings.totalAmount}), 0)` })
        .from(bookings)
        .where(and(
          eq(bookings.courtId, court.id),
          eq(bookings.paymentStatus, "completed")
        ));

      // Get popular sports for this court
      const popularSports = await db
        .select({
          sport: bookings.selectedSport,
          bookings: sql<number>`count(*)`
        })
        .from(bookings)
        .where(eq(bookings.courtId, court.id))
        .groupBy(bookings.selectedSport)
        .orderBy(sql`count(*) desc`)
        .limit(5);

      // Get recent bookings for this court
      const recentBookings = await db
        .select({
          date: bookings.bookingDate,
          sport: bookings.selectedSport,
          revenue: bookings.totalAmount,
          customerPhone: bookings.customerPhone
        })
        .from(bookings)
        .where(eq(bookings.courtId, court.id))
        .orderBy(desc(bookings.createdAt))
        .limit(10);

      analytics.push({
        courtId: court.id,
        courtName: court.name,
        city: court.city,
        totalBookings: Number(totalBookings) || 0,
        revenue: Number(revenue) || 0,
        averageRating: Number(court.rating) || 0,
        popularSports: popularSports.map(s => ({
          sport: s.sport || "General",
          bookings: Number(s.bookings) || 0
        })),
        recentBookings: recentBookings.map(b => ({
          date: b.date?.toISOString() || new Date().toISOString(),
          sport: b.sport || "General",
          revenue: Number(b.revenue) || 0,
          customerPhone: b.customerPhone || ""
        }))
      });
    }

    return analytics;
  }

  // Vendor City Analytics
  async getVendorCityAnalytics(vendorId: string) {
    const cities = await db
      .select({ 
        city: courts.city,
        count: sql<number>`count(*)`
      })
      .from(courts)
      .where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)))
      .groupBy(courts.city);

    const analytics = [];
    
    for (const cityInfo of cities) {
      const city = cityInfo.city;
      
      // Get total bookings for this city
      const [{ count: totalBookings }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(bookings)
        .leftJoin(courts, eq(bookings.courtId, courts.id))
        .where(and(
          eq(courts.vendorId, vendorId),
          eq(courts.city, city)
        ));

      // Get revenue for this city
      const [{ sum: revenue }] = await db
        .select({ sum: sql<number>`coalesce(sum(${bookings.totalAmount}), 0)` })
        .from(bookings)
        .leftJoin(courts, eq(bookings.courtId, courts.id))
        .where(and(
          eq(courts.vendorId, vendorId),
          eq(courts.city, city),
          eq(bookings.paymentStatus, "completed")
        ));

      // Get popular sports for this city
      const popularSports = await db
        .select({
          sport: bookings.selectedSport,
          bookings: sql<number>`count(*)`
        })
        .from(bookings)
        .leftJoin(courts, eq(bookings.courtId, courts.id))
        .where(and(
          eq(courts.vendorId, vendorId),
          eq(courts.city, city)
        ))
        .groupBy(bookings.selectedSport)
        .orderBy(sql`count(*) desc`)
        .limit(5);

      analytics.push({
        city,
        totalCourts: Number(cityInfo.count) || 0,
        totalBookings: Number(totalBookings) || 0,
        revenue: Number(revenue) || 0,
        popularSports: popularSports.map(s => ({
          sport: s.sport || "General",
          bookings: Number(s.bookings) || 0
        }))
      });
    }

    return analytics;
  }

  // Admin operations
  async getPendingCourts(): Promise<CourtWithDetails[]> {
    const results = await db
      .select()
      .from(courts)
      .leftJoin(users, eq(courts.vendorId, users.id))
      .leftJoin(equipment, eq(courts.id, equipment.courtId))
      .where(eq(courts.approvalStatus, "pending"))
      .orderBy(desc(courts.createdAt));

    // Group results by court
    const courtMap = new Map<string, CourtWithDetails>();
    
    for (const row of results) {
      if (!row.courts) continue;
      
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users!,
          equipment: [],
        });
      }
      
      if (row.equipment) {
        courtMap.get(courtId)!.equipment.push(row.equipment);
      }
    }

    return Array.from(courtMap.values());
  }

  async getPendingVendors(): Promise<User[]> {
    const results = await db
      .select()
      .from(users)
      .where(and(
        eq(users.userType, "vendor"),
        eq(users.vendorVerificationStatus, "pending")
      ))
      .orderBy(desc(users.createdAt));

    return results;
  }

  async updateVendorStatus(vendorId: string, status: "pending" | "verified" | "rejected"): Promise<User | null> {
    const results = await db
      .update(users)
      .set({ 
        vendorVerificationStatus: status,
        updatedAt: new Date()
      })
      .where(eq(users.id, vendorId))
      .returning();

    return results[0] || null;
  }

  async approveCourt(courtId: string, adminNotes?: string): Promise<Court | undefined> {
    const [updatedCourt] = await db
      .update(courts)
      .set({ 
        approvalStatus: "approved",
        isActive: true, // Make court active when approved
        adminNotes,
        updatedAt: new Date() 
      })
      .where(eq(courts.id, courtId))
      .returning();
    return updatedCourt;
  }

  async rejectCourt(courtId: string, adminNotes?: string): Promise<Court | undefined> {
    const [updatedCourt] = await db
      .update(courts)
      .set({ 
        approvalStatus: "rejected",
        adminNotes,
        updatedAt: new Date() 
      })
      .where(eq(courts.id, courtId))
      .returning();
    return updatedCourt;
  }

  async adminDeleteCourt(courtId: string): Promise<boolean> {
    try {
      // First delete all related bookings
      await db.delete(bookings).where(eq(bookings.courtId, courtId));
      
      // Then delete all related equipment
      await db.delete(equipment).where(eq(equipment.courtId, courtId));
      
      // Finally delete the court itself
      const result = await db.delete(courts).where(eq(courts.id, courtId));
      
      return true;
    } catch (error) {
      console.error("Error deleting court:", error);
      return false;
    }
  }

  // Admin: Get all courts with full details (including pending/rejected)
  async getAllCourtsWithDetails(): Promise<CourtWithDetails[]> {
    const query = db
      .select()
      .from(courts)
      .leftJoin(users, eq(courts.vendorId, users.id))
      .leftJoin(equipment, eq(courts.id, equipment.courtId));

    const results = await query.orderBy(desc(courts.createdAt));

    // Group results by court
    const courtMap = new Map<string, CourtWithDetails>();
    
    for (const row of results) {
      if (!row.courts) continue;
      
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users!,
          equipment: [],
        });
      }
      
      if (row.equipment) {
        courtMap.get(courtId)!.equipment.push(row.equipment);
      }
    }

    return Array.from(courtMap.values());
  }

  // Admin: Set commission rate for a specific court
  async setCourtCommission(id: string, commissionRate: number): Promise<Court | undefined> {
    console.log("Setting commission for court:", id, "rate:", commissionRate);
    
    // First check if court exists
    const [existingCourt] = await db.select().from(courts).where(eq(courts.id, id));
    if (!existingCourt) {
      console.log("Court not found:", id);
      return undefined;
    }
    
    const [updatedCourt] = await db
      .update(courts)
      .set({ 
        commissionRate: commissionRate.toString(),
        updatedAt: new Date() 
      })
      .where(eq(courts.id, id))
      .returning();
      
    console.log("Commission updated successfully:", updatedCourt);
    return updatedCourt;
  }

  async getCourtAnalytics(courtId: string) {
    const client = await pool.connect();
    try {
      // Get basic court info
      const courtResult = await client.query(
        `SELECT c.*, u.first_name, u.last_name, u.email as vendor_email
         FROM courts c 
         LEFT JOIN users u ON c.vendor_id = u.id 
         WHERE c.id = $1`,
        [courtId]
      );

      if (courtResult.rows.length === 0) {
        throw new Error('Court not found');
      }

      const court = courtResult.rows[0];

      // Get booking statistics
      const bookingStats = await client.query(
        `SELECT 
           COUNT(*) as total_bookings,
           COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
           COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
           SUM(CASE WHEN status IN ('confirmed', 'completed') THEN amount ELSE 0 END) as total_revenue,
           AVG(CASE WHEN status IN ('confirmed', 'completed') THEN amount ELSE NULL END) as avg_booking_value,
           MIN(created_at) as first_booking_date,
           MAX(created_at) as last_booking_date
         FROM bookings 
         WHERE court_id = $1`,
        [courtId]
      );

      const stats = bookingStats.rows[0];

      // Calculate commission earned (15% default or court-specific rate)
      const commissionRate = parseFloat(court.commission_rate || '15') / 100;
      const totalRevenue = parseFloat(stats.total_revenue || '0');
      const commissionEarned = totalRevenue * commissionRate;

      // Get monthly booking trends (last 12 months)
      const monthlyTrends = await client.query(
        `SELECT 
           DATE_TRUNC('month', created_at) as month,
           COUNT(*) as bookings_count,
           SUM(CASE WHEN status IN ('confirmed', 'completed') THEN amount ELSE 0 END) as monthly_revenue
         FROM bookings 
         WHERE court_id = $1 
           AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month DESC`,
        [courtId]
      );

      // Get recent booking trend (compare last 30 days vs previous 30 days)
      const recentTrends = await client.query(
        `SELECT 
           CASE 
             WHEN created_at >= NOW() - INTERVAL '30 days' THEN 'current_month'
             ELSE 'previous_month'
           END as period,
           COUNT(*) as booking_count,
           SUM(CASE WHEN status IN ('confirmed', 'completed') THEN amount ELSE 0 END) as revenue
         FROM bookings 
         WHERE court_id = $1 
           AND created_at >= NOW() - INTERVAL '60 days'
         GROUP BY 
           CASE 
             WHEN created_at >= NOW() - INTERVAL '30 days' THEN 'current_month'
             ELSE 'previous_month'
           END`,
        [courtId]
      );

      // Process trend data
      const trendData = recentTrends.rows.reduce((acc: any, row: any) => {
        acc[row.period] = {
          bookings: parseInt(row.booking_count),
          revenue: parseFloat(row.revenue || '0')
        };
        return acc;
      }, { current_month: { bookings: 0, revenue: 0 }, previous_month: { bookings: 0, revenue: 0 } });

      const bookingTrend = trendData.current_month.bookings - trendData.previous_month.bookings;
      const revenueTrend = trendData.current_month.revenue - trendData.previous_month.revenue;

      return {
        court: {
          id: court.id,
          name: court.name,
          city: court.city,
          area: court.area,
          sport: court.available_sports?.[0] || 'Unknown',
          hourlyRate: parseFloat(court.hourly_rate || '0'),
          peakHourRate: parseFloat(court.peak_hour_rate || '0'),
          commissionRate: parseFloat(court.commission_rate || '15'),
          vendor: {
            name: `${court.first_name || ''} ${court.last_name || ''}`.trim() || court.vendor_email,
            email: court.vendor_email
          }
        },
        financial: {
          totalRevenue: totalRevenue,
          commissionEarned: commissionEarned,
          averageBookingValue: parseFloat(stats.avg_booking_value || '0'),
          vendorEarnings: totalRevenue - commissionEarned
        },
        bookings: {
          total: parseInt(stats.total_bookings || '0'),
          confirmed: parseInt(stats.confirmed_bookings || '0'),
          cancelled: parseInt(stats.cancelled_bookings || '0'),
          completed: parseInt(stats.completed_bookings || '0'),
          firstBookingDate: stats.first_booking_date,
          lastBookingDate: stats.last_booking_date
        },
        trends: {
          monthlyData: monthlyTrends.rows.map((row: any) => ({
            month: row.month,
            bookings: parseInt(row.bookings_count),
            revenue: parseFloat(row.monthly_revenue || '0')
          })),
          recentBookingTrend: bookingTrend,
          recentRevenueTrend: revenueTrend,
          trendDirection: bookingTrend > 0 ? 'growing' : bookingTrend < 0 ? 'declining' : 'stable'
        }
      };
    } catch (error) {
      console.error('Error fetching court analytics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllCourtsAnalyticsOverview() {
    const client = await pool.connect();
    try {
      // Get overview stats for all courts
      const overviewResult = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.city,
          c.area,
          c.available_sports,
          c.hourly_rate,
          c.commission_rate,
          c.approval_status,
          u.first_name,
          u.last_name,
          u.email as vendor_email,
          COUNT(b.id) as total_bookings,
          COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.amount END), 0) as avg_booking_value,
          COUNT(CASE WHEN b.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_bookings,
          COUNT(CASE WHEN b.created_at >= NOW() - INTERVAL '60 days' AND b.created_at < NOW() - INTERVAL '30 days' THEN 1 END) as previous_bookings
        FROM courts c
        LEFT JOIN users u ON c.vendor_id = u.id
        LEFT JOIN bookings b ON c.id = b.court_id
        WHERE c.approval_status = 'approved'
        GROUP BY c.id, c.name, c.city, c.area, c.available_sports, c.hourly_rate, 
                 c.commission_rate, c.approval_status, u.first_name, u.last_name, u.email
        ORDER BY total_revenue DESC
      `);

      return overviewResult.rows.map((row: any) => {
        const totalRevenue = parseFloat(row.total_revenue || '0');
        const commissionRate = parseFloat(row.commission_rate || '15') / 100;
        const commissionEarned = totalRevenue * commissionRate;
        const bookingTrend = parseInt(row.recent_bookings || '0') - parseInt(row.previous_bookings || '0');

        return {
          id: row.id,
          name: row.name,
          location: `${row.city}, ${row.area}`,
          sport: row.available_sports?.[0] || 'Unknown',
          vendor: {
            name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.vendor_email,
            email: row.vendor_email
          },
          financial: {
            totalRevenue: totalRevenue,
            commissionEarned: commissionEarned,
            vendorEarnings: totalRevenue - commissionEarned,
            hourlyRate: parseFloat(row.hourly_rate || '0'),
            commissionRate: parseFloat(row.commission_rate || '15')
          },
          performance: {
            totalBookings: parseInt(row.total_bookings || '0'),
            averageBookingValue: parseFloat(row.avg_booking_value || '0'),
            recentBookings: parseInt(row.recent_bookings || '0'),
            previousBookings: parseInt(row.previous_bookings || '0'),
            bookingTrend: bookingTrend,
            trendDirection: bookingTrend > 0 ? 'growing' : bookingTrend < 0 ? 'declining' : 'stable'
          }
        };
      });
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async getUserNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Notification preferences operations
  async getUserNotificationPreferences(userId: string): Promise<UserNotificationPreferences | undefined> {
    const [prefs] = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId));
    return prefs;
  }

  async createUserNotificationPreferences(preferencesData: InsertUserNotificationPreferences): Promise<UserNotificationPreferences> {
    const [prefs] = await db
      .insert(userNotificationPreferences)
      .values(preferencesData)
      .returning();
    return prefs;
  }

  async updateUserNotificationPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    await db
      .update(userNotificationPreferences)
      .set(preferences)
      .where(eq(userNotificationPreferences.userId, userId));
  }

  // Court reviews operations
  async getCourtReviews(courtId: string): Promise<ReviewWithDetails[]> {
    const results = await db
      .select()
      .from(reviews)
      .innerJoin(users, eq(reviews.customerId, users.id))
      .where(and(
        eq(reviews.courtId, courtId),
        eq(reviews.isVisible, true)
      ))
      .orderBy(desc(reviews.createdAt));

    return results.map(result => ({
      ...result.reviews,
      customer: result.users
    }));
  }

  // ===========================================
  // FIREFLIES EVENT OPERATIONS IMPLEMENTATIONS
  // ===========================================

  // Venue operations
  async getVenues(filters?: {
    city?: string;
    search?: string;
    userLatitude?: number;
    userLongitude?: number;
    maxDistance?: number;
    sortByDistance?: boolean;
  }): Promise<VenueWithDetails[]> {
    let whereConditions = [eq(venues.isActive, true), eq(venues.approvalStatus, "approved")];

    if (filters?.city) {
      whereConditions.push(eq(venues.city, filters.city));
    }

    if (filters?.search) {
      whereConditions.push(sql`(
        ${venues.name} ILIKE ${`%${filters.search}%`} OR
        ${venues.area} ILIKE ${`%${filters.search}%`} OR
        ${venues.address} ILIKE ${`%${filters.search}%`}
      )`);
    }

    const results = await db
      .select()
      .from(venues)
      .leftJoin(users, eq(venues.vendorId, users.id))
      .leftJoin(events, eq(events.venueId, venues.id))
      .where(and(...whereConditions));

    // Group results by venue
    const venuesMap = new Map<string, VenueWithDetails>();
    
    for (const row of results) {
      if (!row.venues) continue;
      
      let venue = venuesMap.get(row.venues.id);
      if (!venue) {
        venue = {
          ...row.venues,
          vendor: row.users!,
          events: [],
        };
        venuesMap.set(row.venues.id, venue);
      }
      
      if (row.events) {
        venue.events.push(row.events);
      }
    }

    return Array.from(venuesMap.values());
  }

  async getVenueById(id: string): Promise<VenueWithDetails | undefined> {
    const results = await db
      .select()
      .from(venues)
      .leftJoin(users, eq(venues.vendorId, users.id))
      .leftJoin(events, eq(events.venueId, venues.id))
      .where(eq(venues.id, id));

    if (results.length === 0 || !results[0].venues) return undefined;

    const venue: VenueWithDetails = {
      ...results[0].venues,
      vendor: results[0].users!,
      events: results.filter(r => r.events).map(r => r.events!),
    };

    return venue;
  }

  async getVenuesByVendor(vendorId: string): Promise<VenueWithDetails[]> {
    const results = await db
      .select()
      .from(venues)
      .leftJoin(users, eq(venues.vendorId, users.id))
      .leftJoin(events, eq(events.venueId, venues.id))
      .where(eq(venues.vendorId, vendorId));

    const venuesMap = new Map<string, VenueWithDetails>();
    
    for (const row of results) {
      if (!row.venues) continue;
      
      let venue = venuesMap.get(row.venues.id);
      if (!venue) {
        venue = {
          ...row.venues,
          vendor: row.users!,
          events: [],
        };
        venuesMap.set(row.venues.id, venue);
      }
      
      if (row.events) {
        venue.events.push(row.events);
      }
    }

    return Array.from(venuesMap.values());
  }

  async createVenue(vendorId: string, venueData: InsertVenue): Promise<Venue> {
    const [venue] = await db
      .insert(venues)
      .values({ ...venueData, vendorId })
      .returning();
    return venue;
  }

  async updateVenue(id: string, vendorId: string, venueData: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [venue] = await db
      .update(venues)
      .set({ ...venueData, updatedAt: new Date() })
      .where(and(eq(venues.id, id), eq(venues.vendorId, vendorId)))
      .returning();
    return venue;
  }

  async deleteVenue(id: string, vendorId: string): Promise<boolean> {
    const result = await db
      .delete(venues)
      .where(and(eq(venues.id, id), eq(venues.vendorId, vendorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Event operations
  async getEvents(filters?: {
    city?: string;
    category?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    userLatitude?: number;
    userLongitude?: number;
    maxDistance?: number;
    sortByDistance?: boolean;
  }): Promise<EventWithDetails[]> {
    let whereConditions = [eq(events.isActive, true), eq(events.approvalStatus, "approved")];

    if (filters?.city) {
      whereConditions.push(sql`${venues.city} = ${filters.city}`);
    }

    if (filters?.category && filters.category !== "All Categories") {
      whereConditions.push(eq(events.category, filters.category));
    }

    if (filters?.search) {
      whereConditions.push(sql`(
        ${events.name} ILIKE ${`%${filters.search}%`} OR
        ${events.description} ILIKE ${`%${filters.search}%`}
      )`);
    }

    if (filters?.dateFrom) {
      whereConditions.push(gte(events.eventDate, filters.dateFrom));
    }

    if (filters?.dateTo) {
      whereConditions.push(lte(events.eventDate, filters.dateTo));
    }

    const results = await db
      .select()
      .from(events)
      .leftJoin(users, eq(events.vendorId, users.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id))
      .where(and(...whereConditions))
      .orderBy(events.eventDate);

    // Group results by event
    const eventsMap = new Map<string, EventWithDetails>();
    
    for (const row of results) {
      if (!row.events) continue;
      
      let event = eventsMap.get(row.events.id);
      if (!event) {
        event = {
          ...row.events,
          vendor: row.users!,
          venue: row.venues!,
          ticketTiers: [],
        };
        eventsMap.set(row.events.id, event);
      }
      
      if (row.ticket_tiers) {
        event.ticketTiers.push(row.ticket_tiers);
      }
    }

    return Array.from(eventsMap.values());
  }

  async getEventById(id: string): Promise<EventWithDetails | undefined> {
    const results = await db
      .select()
      .from(events)
      .leftJoin(users, eq(events.vendorId, users.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id))
      .where(eq(events.id, id));

    if (results.length === 0 || !results[0].events) return undefined;

    const event: EventWithDetails = {
      ...results[0].events,
      vendor: results[0].users!,
      venue: results[0].venues!,
      ticketTiers: results.filter(r => r.ticket_tiers).map(r => r.ticket_tiers!),
    };

    return event;
  }

  async getEventsByVendor(vendorId: string): Promise<EventWithDetails[]> {
    const results = await db
      .select()
      .from(events)
      .leftJoin(users, eq(events.vendorId, users.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id))
      .where(eq(events.vendorId, vendorId))
      .orderBy(desc(events.eventDate));

    const eventsMap = new Map<string, EventWithDetails>();
    
    for (const row of results) {
      if (!row.events) continue;
      
      let event = eventsMap.get(row.events.id);
      if (!event) {
        event = {
          ...row.events,
          vendor: row.users!,
          venue: row.venues!,
          ticketTiers: [],
        };
        eventsMap.set(row.events.id, event);
      }
      
      if (row.ticket_tiers) {
        event.ticketTiers.push(row.ticket_tiers);
      }
    }

    return Array.from(eventsMap.values());
  }

  async createEvent(vendorId: string, eventData: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({ 
        ...eventData, 
        vendorId,
        availableSeats: eventData.totalSeats,
      })
      .returning();
    return event;
  }

  async updateEvent(id: string, vendorId: string, eventData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({ ...eventData, updatedAt: new Date() })
      .where(and(eq(events.id, id), eq(events.vendorId, vendorId)))
      .returning();
    return event;
  }

  async deleteEvent(id: string, vendorId: string): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.vendorId, vendorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Ticket tier operations
  async getTicketTiersByEvent(eventId: string): Promise<TicketTier[]> {
    return await db
      .select()
      .from(ticketTiers)
      .where(eq(ticketTiers.eventId, eventId))
      .orderBy(ticketTiers.price);
  }

  async createTicketTier(ticketTierData: InsertTicketTier): Promise<TicketTier> {
    const [ticketTier] = await db
      .insert(ticketTiers)
      .values({
        ...ticketTierData,
        availableQuantity: ticketTierData.quantity,
      })
      .returning();
    return ticketTier;
  }

  async updateTicketTier(id: string, ticketTierData: Partial<InsertTicketTier>): Promise<TicketTier | undefined> {
    const [ticketTier] = await db
      .update(ticketTiers)
      .set({ ...ticketTierData, updatedAt: new Date() })
      .where(eq(ticketTiers.id, id))
      .returning();
    return ticketTier;
  }

  async deleteTicketTier(id: string): Promise<boolean> {
    const result = await db
      .delete(ticketTiers)
      .where(eq(ticketTiers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Event booking operations
  async createEventBooking(bookingData: InsertEventBooking): Promise<EventBooking> {
    const [booking] = await db
      .insert(eventBookings)
      .values(bookingData as typeof eventBookings.$inferInsert)
      .returning();

    // Update available seats
    await db
      .update(ticketTiers)
      .set({
        availableQuantity: sql`${ticketTiers.availableQuantity} - ${bookingData.quantity}`,
      })
      .where(eq(ticketTiers.id, bookingData.ticketTierId));

    await db
      .update(events)
      .set({
        availableSeats: sql`${events.availableSeats} - ${bookingData.quantity}`,
        totalBookings: sql`${events.totalBookings} + 1`,
      })
      .where(eq(events.id, bookingData.eventId));

    return booking;
  }

  async getEventBookingsByCustomer(customerId: string): Promise<EventBookingWithDetails[]> {
    const results = await db
      .select()
      .from(eventBookings)
      .leftJoin(users, eq(eventBookings.customerId, users.id))
      .leftJoin(events, eq(eventBookings.eventId, events.id))
      .leftJoin(ticketTiers, eq(eventBookings.ticketTierId, ticketTiers.id))
      .where(eq(eventBookings.customerId, customerId))
      .orderBy(desc(eventBookings.createdAt));

    return results.map(result => ({
      ...result.event_bookings,
      customer: result.users!,
      event: result.events!,
      ticketTier: result.ticket_tiers!,
    }));
  }

  async getEventBookingsByVendor(vendorId: string): Promise<EventBookingWithDetails[]> {
    const results = await db
      .select()
      .from(eventBookings)
      .leftJoin(users, eq(eventBookings.customerId, users.id))
      .leftJoin(events, eq(eventBookings.eventId, events.id))
      .leftJoin(ticketTiers, eq(eventBookings.ticketTierId, ticketTiers.id))
      .where(eq(events.vendorId, vendorId))
      .orderBy(desc(eventBookings.createdAt));

    return results.map(result => ({
      ...result.event_bookings,
      customer: result.users!,
      event: result.events!,
      ticketTier: result.ticket_tiers!,
    }));
  }

  async getEventBookingById(id: string): Promise<EventBookingWithDetails | undefined> {
    const results = await db
      .select()
      .from(eventBookings)
      .leftJoin(users, eq(eventBookings.customerId, users.id))
      .leftJoin(events, eq(eventBookings.eventId, events.id))
      .leftJoin(ticketTiers, eq(eventBookings.ticketTierId, ticketTiers.id))
      .where(eq(eventBookings.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.event_bookings,
      customer: result.users!,
      event: result.events!,
      ticketTier: result.ticket_tiers!,
    };
  }

  async updateEventBookingStatus(id: string, status: string): Promise<EventBooking | undefined> {
    const [booking] = await db
      .update(eventBookings)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(eventBookings.id, id))
      .returning();
    return booking;
  }

  // Event admin operations
  async getPendingVenues(): Promise<VenueWithDetails[]> {
    const results = await db
      .select()
      .from(venues)
      .leftJoin(users, eq(venues.vendorId, users.id))
      .leftJoin(events, eq(events.venueId, venues.id))
      .where(eq(venues.approvalStatus, "pending"))
      .orderBy(desc(venues.createdAt));

    const venuesMap = new Map<string, VenueWithDetails>();
    
    for (const row of results) {
      if (!row.venues) continue;
      
      let venue = venuesMap.get(row.venues.id);
      if (!venue) {
        venue = {
          ...row.venues,
          vendor: row.users!,
          events: [],
        };
        venuesMap.set(row.venues.id, venue);
      }
      
      if (row.events) {
        venue.events.push(row.events);
      }
    }

    return Array.from(venuesMap.values());
  }

  async getPendingEvents(): Promise<EventWithDetails[]> {
    const results = await db
      .select()
      .from(events)
      .leftJoin(users, eq(events.vendorId, users.id))
      .leftJoin(venues, eq(events.venueId, venues.id))
      .leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id))
      .where(eq(events.approvalStatus, "pending"))
      .orderBy(desc(events.createdAt));

    const eventsMap = new Map<string, EventWithDetails>();
    
    for (const row of results) {
      if (!row.events) continue;
      
      let event = eventsMap.get(row.events.id);
      if (!event) {
        event = {
          ...row.events,
          vendor: row.users!,
          venue: row.venues!,
          ticketTiers: [],
        };
        eventsMap.set(row.events.id, event);
      }
      
      if (row.ticket_tiers) {
        event.ticketTiers.push(row.ticket_tiers);
      }
    }

    return Array.from(eventsMap.values());
  }

  async approveVenue(venueId: string, adminNotes?: string): Promise<Venue | undefined> {
    const [venue] = await db
      .update(venues)
      .set({
        approvalStatus: "approved",
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, venueId))
      .returning();
    return venue;
  }

  async rejectVenue(venueId: string, adminNotes?: string): Promise<Venue | undefined> {
    const [venue] = await db
      .update(venues)
      .set({
        approvalStatus: "rejected",
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, venueId))
      .returning();
    return venue;
  }

  async approveEvent(eventId: string, adminNotes?: string): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        approvalStatus: "approved",
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  }

  async rejectEvent(eventId: string, adminNotes?: string): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        approvalStatus: "rejected",
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventId))
      .returning();
    return event;
  }
}

export const storage = new DatabaseStorage();
