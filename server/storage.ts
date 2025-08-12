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
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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

  // Admin operations
  getPendingCourts(): Promise<CourtWithDetails[]>;
  approveCourt(courtId: string, adminNotes?: string): Promise<Court | undefined>;
  rejectCourt(courtId: string, adminNotes?: string): Promise<Court | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
      .values({ ...court, vendorId })
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
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
}

export const storage = new DatabaseStorage();
