import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ["customer", "vendor", "admin"] }).notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const courts = pgTable("courts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  sport: varchar("sport").notNull(),
  city: varchar("city").notNull(),
  area: varchar("area").notNull(),
  description: text("description"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  peakHourRate: decimal("peak_hour_rate", { precision: 10, scale: 2 }),
  openingTime: varchar("opening_time").notNull(),
  closingTime: varchar("closing_time").notNull(),
  availableDays: text("available_days").array().notNull().default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  imageUrl: varchar("image_url"),
  rules: text("rules"),
  isActive: boolean("is_active").default(true),
  approvalStatus: varchar("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  adminNotes: text("admin_notes"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalBookings: integer("total_bookings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").notNull().references(() => courts.id),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").default(true),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  courtId: varchar("court_id").notNull().references(() => courts.id),
  bookingDate: varchar("booking_date").notNull(),
  timeSlot: varchar("time_slot").notNull(),
  duration: integer("duration").default(1), // hours
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  equipmentIds: text("equipment_ids").array(),
  customerPhone: varchar("customer_phone").notNull(),
  customerEmail: varchar("customer_email").notNull(),
  paymentMethod: varchar("payment_method", { enum: ["mpesa", "card"] }).notNull(),
  paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  status: varchar("status", { enum: ["active", "completed", "cancelled"] }).default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  courts: many(courts),
  bookings: many(bookings),
}));

export const courtRelations = relations(courts, ({ one, many }) => ({
  vendor: one(users, {
    fields: [courts.vendorId],
    references: [users.id],
  }),
  equipment: many(equipment),
  bookings: many(bookings),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  court: one(courts, {
    fields: [equipment.courtId],
    references: [courts.id],
  }),
}));

export const bookingRelations = relations(bookings, ({ one }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  court: one(courts, {
    fields: [bookings.courtId],
    references: [courts.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourtSchema = createInsertSchema(courts).omit({
  id: true,
  vendorId: true,
  rating: true,
  totalBookings: true,
  approvalStatus: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courts.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Extended types with relations
export type CourtWithDetails = Court & {
  vendor: User;
  equipment: Equipment[];
};

export type BookingWithDetails = Booking & {
  court: Court;
  customer: User;
};
