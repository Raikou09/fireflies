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
  
  // Vendor-specific fields
  phoneNumber: varchar("phone_number"),
  businessName: varchar("business_name"),
  businessAddress: text("business_address"),
  kraPin: varchar("kra_pin"), // Kenya Revenue Authority PIN
  nationalId: varchar("national_id"), // Government ID
  bankName: varchar("bank_name"),
  bankAccountNumber: varchar("bank_account_number"),
  bankAccountName: varchar("bank_account_name"),
  mpesaNumber: varchar("mpesa_number"), // Alternative payment method
  paymentPreference: varchar("payment_preference", { enum: ["bank", "mpesa", "both"] }),
  vendorVerificationStatus: varchar("vendor_verification_status", { enum: ["pending", "verified", "rejected"] }).default("pending"),
  vendorDocuments: text("vendor_documents").array(), // Array of document URLs
  
  // Individual document fields for verification
  nationalIdDocument: varchar("national_id_document"), // National ID document URL
  bankStatement: varchar("bank_statement"), // Bank statement document URL
  businessLicense: varchar("business_license"), // Business license document URL
  
  // Additional verification fields
  businessRegistrationNumber: varchar("business_registration_number"), // Company registration number
  taxCertificate: varchar("tax_certificate"), // Tax compliance certificate
  alternatePhoneNumber: varchar("alternate_phone_number"), // Secondary contact number
  yearsInBusiness: integer("years_in_business"), // How long in business
  businessType: varchar("business_type"), // Individual/Partnership/Company/LLC
  
  // Verification notes and admin comments
  adminVerificationNotes: text("admin_verification_notes"), // Admin's verification notes
  rejectionReason: text("rejection_reason"), // Reason for rejection if applicable
  verificationDate: timestamp("verification_date"), // Date when verified/rejected
  
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
  description: text("description"),
  category: varchar("category").notNull(), // e.g., "balls", "rackets", "protective_gear", "accessories"
  pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }).notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }),
  quantityAvailable: integer("quantity_available").notNull().default(1),
  isAvailable: boolean("is_available").default(true),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  courtAmount: decimal("court_amount", { precision: 10, scale: 2 }).notNull(),
  equipmentAmount: decimal("equipment_amount", { precision: 10, scale: 2 }).default("0.00"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  equipmentRentals: jsonb("equipment_rentals"), // Array of {equipmentId, quantity, duration, price}
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

// FIREFLIES EVENT BOOKING SYSTEM

// Venues table - for events
export const venues = pgTable("venues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  city: varchar("city").notNull(),
  area: varchar("area").notNull(),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  description: text("description"),
  capacity: integer("capacity").notNull(),
  imageUrl: varchar("image_url"),
  amenities: text("amenities").array(), // ["parking", "wifi", "food", "accessibility"]
  hasSeatMap: boolean("has_seat_map").default(false),
  seatMapConfig: jsonb("seat_map_config"), // Stores visual layout configuration
  templateId: varchar("template_id"), // ID of the template used (cricket-stadium, football-stadium, etc.) - null if custom design
  isActive: boolean("is_active").default(true),
  approvalStatus: varchar("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Seat sections for venue pricing zones (VIP, General, Balcony, etc.)
export const seatSections = pgTable("seat_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  venueId: varchar("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // "VIP Section", "Balcony", "General Admission"
  color: varchar("color").notNull(), // Hex color for visual display
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(), // Default price for this section
  description: text("description"),
  seatCount: integer("seat_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual seats in venue
export const seats = pgTable("seats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionId: varchar("section_id").notNull().references(() => seatSections.id, { onDelete: "cascade" }),
  venueId: varchar("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  row: varchar("row").notNull(), // "A", "B", "C", etc.
  number: integer("number").notNull(), // 1, 2, 3, etc.
  seatLabel: varchar("seat_label").notNull(), // "A1", "B12", etc.
  priceOverride: decimal("price_override", { precision: 10, scale: 2 }), // Optional custom price for specific seat
  x: integer("x").notNull(), // X position in grid for visual display
  y: integer("y").notNull(), // Y position in grid for visual display
  isAccessible: boolean("is_accessible").default(false), // Wheelchair accessible
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event-specific seat reservations
export const eventSeatReservations = pgTable("event_seat_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  seatId: varchar("seat_id").notNull().references(() => seats.id, { onDelete: "cascade" }),
  eventBookingId: varchar("event_booking_id").references(() => eventBookings.id, { onDelete: "set null" }),
  status: varchar("status", { enum: ["available", "reserved", "booked"] }).default("available"),
  reservedUntil: timestamp("reserved_until"), // Temporary hold for checkout process
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id").notNull().references(() => users.id),
  venueId: varchar("venue_id").notNull().references(() => venues.id),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // "music", "sports", "theater", "comedy", "conference"
  eventDate: timestamp("event_date").notNull(),
  eventTime: varchar("event_time").notNull(), // "19:00"
  duration: integer("duration").default(120), // minutes
  posterImageUrl: varchar("poster_image_url"),
  seatMap: jsonb("seat_map"), // JSON structure for seat layout
  hasSeatMap: boolean("has_seat_map").default(false),
  totalSeats: integer("total_seats").notNull(),
  availableSeats: integer("available_seats").notNull(),
  isActive: boolean("is_active").default(true),
  approvalStatus: varchar("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  adminNotes: text("admin_notes"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalBookings: integer("total_bookings").default(0),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ticket tiers for events
export const ticketTiers = pgTable("ticket_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(), // "VIP", "General", "Student", "Early Bird"
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  seatNumbers: text("seat_numbers").array(), // Optional specific seat assignments
  benefits: text("benefits").array(), // ["backstage access", "free drink", "priority entry"]
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event bookings
export const eventBookings = pgTable("event_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id),
  eventId: varchar("event_id").notNull().references(() => events.id),
  ticketTierId: varchar("ticket_tier_id").notNull().references(() => ticketTiers.id),
  quantity: integer("quantity").notNull(),
  seatNumbers: text("seat_numbers").array(), // Actual seats booked
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  customerPhone: varchar("customer_phone"),
  customerEmail: varchar("customer_email"),
  paymentMethod: varchar("payment_method", { enum: ["mpesa", "card"] }).default("mpesa"),
  paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
  status: varchar("status", { enum: ["confirmed", "cancelled"] }).default("confirmed"),
  bookingCode: varchar("booking_code").notNull(), // Unique code for ticket verification
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

// Fireflies relations
export const venueRelations = relations(venues, ({ one, many }) => ({
  vendor: one(users, {
    fields: [venues.vendorId],
    references: [users.id],
  }),
  events: many(events),
  seatSections: many(seatSections),
  seats: many(seats),
}));

export const seatSectionRelations = relations(seatSections, ({ one, many }) => ({
  venue: one(venues, {
    fields: [seatSections.venueId],
    references: [venues.id],
  }),
  seats: many(seats),
}));

export const seatRelations = relations(seats, ({ one, many }) => ({
  section: one(seatSections, {
    fields: [seats.sectionId],
    references: [seatSections.id],
  }),
  venue: one(venues, {
    fields: [seats.venueId],
    references: [venues.id],
  }),
  reservations: many(eventSeatReservations),
}));

export const eventSeatReservationRelations = relations(eventSeatReservations, ({ one }) => ({
  event: one(events, {
    fields: [eventSeatReservations.eventId],
    references: [events.id],
  }),
  seat: one(seats, {
    fields: [eventSeatReservations.seatId],
    references: [seats.id],
  }),
  eventBooking: one(eventBookings, {
    fields: [eventSeatReservations.eventBookingId],
    references: [eventBookings.id],
  }),
}));

export const eventRelations = relations(events, ({ one, many }) => ({
  vendor: one(users, {
    fields: [events.vendorId],
    references: [users.id],
  }),
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  ticketTiers: many(ticketTiers),
  eventBookings: many(eventBookings),
}));

export const ticketTierRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
  }),
  bookings: many(eventBookings),
}));

export const eventBookingRelations = relations(eventBookings, ({ one }) => ({
  customer: one(users, {
    fields: [eventBookings.customerId],
    references: [users.id],
  }),
  event: one(events, {
    fields: [eventBookings.eventId],
    references: [events.id],
  }),
  ticketTier: one(ticketTiers, {
    fields: [eventBookings.ticketTierId],
    references: [ticketTiers.id],
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
  createdAt: true,
  updatedAt: true,
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

// Fireflies insert schemas
export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  vendorId: true,
  approvalStatus: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  vendorId: true,
  rating: true,
  totalBookings: true,
  approvalStatus: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  eventDate: z.coerce.date(),
});

export const insertTicketTierSchema = createInsertSchema(ticketTiers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  price: z.coerce.string(),
});

export const insertEventBookingSchema = createInsertSchema(eventBookings).omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeatSectionSchema = createInsertSchema(seatSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeatSchema = createInsertSchema(seats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSeatReservationSchema = createInsertSchema(eventSeatReservations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Vendor onboarding schema
export const vendorOnboardingSchema = z.object({
  // Personal Information (Required)
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  alternatePhoneNumber: z.string().optional(),
  nationalId: z.string().min(1, "National ID is required"),
  
  // Business Information (Required)
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessAddress: z.string().min(10, "Business address must be at least 10 characters"),
  businessType: z.enum(["Individual", "Partnership", "Company", "LLC"], {
    errorMap: () => ({ message: "Please select a business type" })
  }),
  businessRegistrationNumber: z.string().optional(),
  yearsInBusiness: z.number().min(0, "Years in business must be 0 or more").max(100, "Years in business seems too high"),
  
  // Government Compliance (Optional)
  kraPin: z.string().optional(),
  
  
  // Banking Information
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  mpesaNumber: z.string().optional(),
  paymentPreference: z.enum(["bank", "mpesa", "both"]),
  
  // Optional Documents for verification
  nationalIdDocument: z.string().optional(),
  businessLicense: z.string().optional(),
  taxCertificate: z.string().optional(),
  bankStatement: z.string().optional(),
}).refine(
  (data) => {
    if (data.paymentPreference === "bank" || data.paymentPreference === "both") {
      return data.bankName && data.bankAccountNumber && data.bankAccountName;
    }
    return true;
  },
  {
    message: "Bank details are required when bank payment is selected",
    path: ["bankName"],
  }
).refine(
  (data) => {
    if (data.paymentPreference === "mpesa" || data.paymentPreference === "both") {
      return data.mpesaNumber && data.mpesaNumber.length >= 10;
    }
    return true;
  },
  {
    message: "M-Pesa number is required when M-Pesa payment is selected",
    path: ["mpesaNumber"],
  }
);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type VendorOnboarding = z.infer<typeof vendorOnboardingSchema>;
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

// Fireflies types
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertTicketTier = z.infer<typeof insertTicketTierSchema>;
export type TicketTier = typeof ticketTiers.$inferSelect;
export type InsertEventBooking = z.infer<typeof insertEventBookingSchema>;
export type EventBooking = typeof eventBookings.$inferSelect;
export type InsertSeatSection = z.infer<typeof insertSeatSectionSchema>;
export type SeatSection = typeof seatSections.$inferSelect;
export type InsertSeat = z.infer<typeof insertSeatSchema>;
export type Seat = typeof seats.$inferSelect;
export type InsertEventSeatReservation = z.infer<typeof insertEventSeatReservationSchema>;
export type EventSeatReservation = typeof eventSeatReservations.$inferSelect;

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

// Fireflies extended types with relations
export type VenueWithDetails = Venue & {
  vendor: User;
  events: Event[];
};

export type EventWithDetails = Event & {
  vendor: User;
  venue: Venue;
  ticketTiers: TicketTier[];
  distance?: number; // Distance in km when location-based filtering is applied
};

export type EventBookingWithDetails = EventBooking & {
  customer: User;
  event: Event;
  ticketTier: TicketTier;
};
