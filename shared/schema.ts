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
  availableSports: text("available_sports").array().notNull(), // Array of sports available at this location
  city: varchar("city").notNull(),
  area: varchar("area").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
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
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"), // Admin commission percentage per booking
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
  selectedSport: varchar("selected_sport").default("General"), // The specific sport chosen for this booking
  bookingDate: timestamp("booking_date").notNull(),
  startTime: varchar("start_time").notNull(), // e.g., "14:00"
  endTime: varchar("end_time").notNull(), // e.g., "16:00"
  duration: integer("duration").default(1), // hours
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  equipmentIds: text("equipment_ids").array(),
  customerPhone: varchar("customer_phone"),
  customerEmail: varchar("customer_email"),
  paymentMethod: varchar("payment_method", { enum: ["mpesa", "card"] }).default("mpesa"),
  paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  status: varchar("status", { enum: ["confirmed", "completed", "cancelled"] }).default("confirmed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courtId: varchar("court_id").notNull().references(() => courts.id, { onDelete: "cascade" }),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 100 }),
  comment: text("comment"),
  courtCleanliness: integer("court_cleanliness"), // 1-5 rating for cleanliness
  facilitiesQuality: integer("facilities_quality"), // 1-5 rating for facilities
  staffService: integer("staff_service"), // 1-5 rating for staff service
  valueForMoney: integer("value_for_money"), // 1-5 rating for value
  wouldRecommend: boolean("would_recommend").default(true),
  isVerifiedBooking: boolean("is_verified_booking").default(false), // true if reviewer actually booked the court
  helpfulVotes: integer("helpful_votes").default(0),
  reportCount: integer("report_count").default(0),
  isVisible: boolean("is_visible").default(true), // for moderation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  courts: many(courts),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const courtRelations = relations(courts, ({ one, many }) => ({
  vendor: one(users, {
    fields: [courts.vendorId],
    references: [users.id],
  }),
  equipment: many(equipment),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const equipmentRelations = relations(equipment, ({ one }) => ({
  court: one(courts, {
    fields: [equipment.courtId],
    references: [courts.id],
  }),
}));

export const bookingRelations = relations(bookings, ({ one, many }) => ({
  customer: one(users, {
    fields: [bookings.customerId],
    references: [users.id],
  }),
  court: one(courts, {
    fields: [bookings.courtId],
    references: [courts.id],
  }),
  reviews: many(reviews),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  court: one(courts, {
    fields: [reviews.courtId],
    references: [courts.id],
  }),
  customer: one(users, {
    fields: [reviews.customerId],
    references: [users.id],
  }),
  booking: one(bookings, {
    fields: [reviews.bookingId],
    references: [bookings.id],
  }),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // booking_confirmation, booking_reminder, booking_cancellation, booking_update
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // Additional data like booking details
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User notification preferences
export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  bookingConfirmations: boolean("booking_confirmations").notNull().default(true),
  bookingReminders: boolean("booking_reminders").notNull().default(true),
  bookingCancellations: boolean("booking_cancellations").notNull().default(true),
  vendorBookingAlerts: boolean("vendor_booking_alerts").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification relations
export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationPreferences.userId],
    references: [users.id],
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

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  helpfulVotes: true,
  reportCount: true,
  isVisible: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
  id: true,
  createdAt: true,
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
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertUserNotificationPreferences = z.infer<typeof insertUserNotificationPreferencesSchema>;
export type UserNotificationPreferences = typeof userNotificationPreferences.$inferSelect;

// Extended types with relations
export type CourtWithDetails = Court & {
  vendor: User;
  equipment: Equipment[];
  distance?: number; // Distance in km when location-based filtering is applied
};

export type BookingWithDetails = Booking & {
  court: Court;
  customer: User;
};

export type ReviewWithDetails = Review & {
  customer: User;
  court?: Court;
  booking?: Booking;
};
