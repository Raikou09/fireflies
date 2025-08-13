import {
  users,
  courts,
  equipment,
  bookings,
  type User,
  type UpsertUser,
  type Court,
  type InsertCourt,
  type Equipment,
  type InsertEquipment,
  type Booking,
  type InsertBooking,
  type CourtWithDetails,
  type BookingWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserType(id: string, userType: 'customer' | 'vendor' | 'admin'): Promise<User>;

  // Court operations
  getCourts(filters?: {
    city?: string;
    sport?: string;
    search?: string;
  }): Promise<CourtWithDetails[]>;
  getCourtById(id: string): Promise<CourtWithDetails | undefined>;
  getCourtsByVendor(vendorId: string): Promise<CourtWithDetails[]>;
  createCourt(vendorId: string, court: InsertCourt): Promise<Court>;
  updateCourt(id: string, vendorId: string, court: Partial<InsertCourt>): Promise<Court | undefined>;
  deleteCourt(id: string, vendorId: string): Promise<boolean>;

  // Equipment operations
  getEquipmentByCourt(courtId: string): Promise<Equipment[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, equipment: Partial<InsertEquipment>): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;

  // Booking operations
  createBooking(customerId: string, booking: InsertBooking): Promise<Booking>;
  getBookingsByCustomer(customerId: string): Promise<BookingWithDetails[]>;
  getBookingsByVendor(vendorId: string): Promise<BookingWithDetails[]>;
  getBookingById(id: string): Promise<BookingWithDetails | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;

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
  getAllCourtsWithDetails(): Promise<CourtWithDetails[]>;
  setCourtCommission(id: string, commissionRate: number): Promise<Court | undefined>;
  approveCourt(courtId: string, adminNotes?: string): Promise<Court | undefined>;
  rejectCourt(courtId: string, adminNotes?: string): Promise<Court | undefined>;
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

  async updateUserType(id: string, userType: 'customer' | 'vendor' | 'admin'): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ userType, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Court operations
  async getCourts(filters?: {
    city?: string;
    sport?: string;
    search?: string;
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

    return Array.from(courtMap.values());
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
      .where(eq(equipment.courtId, courtId));
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [newEquipment] = await db
      .insert(equipment)
      .values(equipmentData)
      .returning();
    return newEquipment;
  }

  async updateEquipment(id: string, equipmentData: Partial<InsertEquipment>): Promise<Equipment | undefined> {
    const [updatedEquipment] = await db
      .update(equipment)
      .set(equipmentData)
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

  // Booking operations
  async createBooking(customerId: string, booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db
      .insert(bookings)
      .values({ ...booking, customerId })
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

  async updateBookingStatus(id: string, status: "active" | "completed" | "cancelled"): Promise<Booking | undefined> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
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
          eq(bookings.status, "active"),
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
          sport: s.sport,
          bookings: Number(s.bookings) || 0
        })),
        recentBookings: recentBookings.map(b => ({
          date: b.date,
          sport: b.sport,
          revenue: Number(b.revenue) || 0,
          customerPhone: b.customerPhone
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
          sport: s.sport,
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

}

export const storage = new DatabaseStorage();
