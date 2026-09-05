var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminUsers: () => adminUsers,
  bookingRelations: () => bookingRelations,
  bookings: () => bookings,
  communities: () => communities,
  communityMembers: () => communityMembers,
  communityMessages: () => communityMessages,
  courtRelations: () => courtRelations,
  courts: () => courts,
  equipment: () => equipment,
  equipmentRelations: () => equipmentRelations,
  eventBookingRelations: () => eventBookingRelations,
  eventBookings: () => eventBookings,
  eventRelations: () => eventRelations,
  eventSeatReservationRelations: () => eventSeatReservationRelations,
  eventSeatReservations: () => eventSeatReservations,
  events: () => events,
  insertBookingSchema: () => insertBookingSchema,
  insertCourtSchema: () => insertCourtSchema,
  insertEquipmentSchema: () => insertEquipmentSchema,
  insertEventBookingSchema: () => insertEventBookingSchema,
  insertEventSchema: () => insertEventSchema,
  insertEventSeatReservationSchema: () => insertEventSeatReservationSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertSeatSchema: () => insertSeatSchema,
  insertSeatSectionSchema: () => insertSeatSectionSchema,
  insertTicketTierSchema: () => insertTicketTierSchema,
  insertUserNotificationPreferencesSchema: () => insertUserNotificationPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertVenueSchema: () => insertVenueSchema,
  matchParticipants: () => matchParticipants,
  matches: () => matches,
  notificationRelations: () => notificationRelations,
  notifications: () => notifications,
  refunds: () => refunds2,
  reviewRelations: () => reviewRelations,
  reviews: () => reviews,
  seatRelations: () => seatRelations,
  seatSectionRelations: () => seatSectionRelations,
  seatSections: () => seatSections,
  seats: () => seats,
  sessions: () => sessions,
  ticketTierRelations: () => ticketTierRelations,
  ticketTiers: () => ticketTiers,
  userNotificationPreferences: () => userNotificationPreferences,
  userNotificationPreferencesRelations: () => userNotificationPreferencesRelations,
  userRelations: () => userRelations,
  users: () => users,
  vendorOnboardingSchema: () => vendorOnboardingSchema,
  venueRelations: () => venueRelations,
  venues: () => venues
});
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
  boolean
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions, adminUsers, users, courts, equipment, bookings, reviews, userRelations, courtRelations, equipmentRelations, bookingRelations, reviewRelations, notifications, userNotificationPreferences, venues, seatSections, seats, eventSeatReservations, events, ticketTiers, eventBookings, notificationRelations, userNotificationPreferencesRelations, venueRelations, seatSectionRelations, seatRelations, eventSeatReservationRelations, eventRelations, ticketTierRelations, eventBookingRelations, insertUserSchema, insertCourtSchema, insertEquipmentSchema, insertBookingSchema, insertReviewSchema, insertNotificationSchema, insertUserNotificationPreferencesSchema, insertVenueSchema, insertEventSchema, insertTicketTierSchema, insertEventBookingSchema, insertSeatSectionSchema, insertSeatSchema, insertEventSeatReservationSchema, vendorOnboardingSchema, matches, matchParticipants, communities, communityMembers, communityMessages, refunds2;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    adminUsers = pgTable("admin_users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").notNull().unique(),
      role: varchar("role", { enum: ["owner", "admin"] }).notNull().default("admin"),
      addedBy: varchar("added_by"),
      createdAt: timestamp("created_at").defaultNow()
    });
    users = pgTable("users", {
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
      kraPin: varchar("kra_pin"),
      // Kenya Revenue Authority PIN
      nationalId: varchar("national_id"),
      // Government ID
      bankName: varchar("bank_name"),
      bankAccountNumber: varchar("bank_account_number"),
      bankAccountName: varchar("bank_account_name"),
      mpesaNumber: varchar("mpesa_number"),
      // Alternative payment method
      paymentPreference: varchar("payment_preference", { enum: ["bank", "mpesa", "both"] }),
      vendorVerificationStatus: varchar("vendor_verification_status", { enum: ["pending", "verified", "rejected"] }).default("pending"),
      vendorDocuments: text("vendor_documents").array(),
      // Array of document URLs
      // Individual document fields for verification
      nationalIdDocument: varchar("national_id_document"),
      // National ID document URL
      bankStatement: varchar("bank_statement"),
      // Bank statement document URL
      businessLicense: varchar("business_license"),
      // Business license document URL
      // Additional verification fields
      businessRegistrationNumber: varchar("business_registration_number"),
      // Company registration number
      taxCertificate: varchar("tax_certificate"),
      // Tax compliance certificate
      alternatePhoneNumber: varchar("alternate_phone_number"),
      // Secondary contact number
      yearsInBusiness: integer("years_in_business"),
      // How long in business
      businessType: varchar("business_type"),
      // Individual/Partnership/Company/LLC
      // Verification notes and admin comments
      adminVerificationNotes: text("admin_verification_notes"),
      // Admin's verification notes
      rejectionReason: text("rejection_reason"),
      // Reason for rejection if applicable
      verificationDate: timestamp("verification_date"),
      // Date when verified/rejected
      // First booking discount tracking
      hasUsedFirstDiscount: boolean("has_used_first_discount").default(false),
      // Track if user has used their 10% signup discount
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    courts = pgTable("courts", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      vendorId: varchar("vendor_id").notNull().references(() => users.id),
      name: text("name").notNull(),
      availableSports: text("available_sports").array().notNull(),
      // Array of sports available at this location
      facilityType: varchar("facility_type", { enum: ["separate_areas", "shared_area"] }).default("shared_area"),
      // Whether different sports have separate areas or share one space
      sportCapacities: jsonb("sport_capacities").default({}),
      // Maps sport name → number of concurrent courts, e.g. {"Tennis": 2, "Football": 1}
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
      images: text("images").array().default([]),
      rules: text("rules"),
      isActive: boolean("is_active").default(true),
      approvalStatus: varchar("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
      adminNotes: text("admin_notes"),
      rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
      totalBookings: integer("total_bookings").default(0),
      commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).default("10.00"),
      // Admin commission percentage per booking
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    equipment = pgTable("equipment", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      courtId: varchar("court_id").notNull().references(() => courts.id),
      name: varchar("name").notNull(),
      description: text("description"),
      category: varchar("category").notNull(),
      // e.g., "balls", "rackets", "protective_gear", "accessories"
      pricePerHour: decimal("price_per_hour", { precision: 10, scale: 2 }).notNull(),
      pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }),
      quantityAvailable: integer("quantity_available").notNull().default(1),
      isAvailable: boolean("is_available").default(true),
      imageUrl: varchar("image_url"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    bookings = pgTable("bookings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      customerId: varchar("customer_id").references(() => users.id),
      // Nullable for guest bookings
      courtId: varchar("court_id").notNull().references(() => courts.id),
      selectedSport: varchar("selected_sport").default("General"),
      // The primary sport for display/backwards compatibility
      sportSegments: jsonb("sport_segments"),
      // Array of {sport, hour} for multi-sport bookings - e.g., [{sport: "Cricket", hour: 14}, {sport: "Basketball", hour: 15}]
      bookingDate: varchar("booking_date").notNull(),
      timeSlot: varchar("time_slot").notNull(),
      // e.g., "14:00" - required by database
      startTime: varchar("start_time"),
      // e.g., "14:00"
      endTime: varchar("end_time"),
      // e.g., "16:00"
      duration: integer("duration").default(1),
      // hours
      courtsBooked: integer("courts_booked").default(1),
      // Number of concurrent courts booked (for large groups)
      courtAmount: decimal("court_amount", { precision: 10, scale: 2 }).notNull(),
      equipmentAmount: decimal("equipment_amount", { precision: 10, scale: 2 }).default("0.00"),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      equipmentRentals: jsonb("equipment_rentals"),
      // Array of {equipmentId, quantity, duration, price}
      customerPhone: varchar("customer_phone"),
      customerEmail: varchar("customer_email"),
      // Guest booking fields
      isGuestBooking: boolean("is_guest_booking").default(false),
      guestName: varchar("guest_name"),
      guestEmail: varchar("guest_email"),
      guestPhone: varchar("guest_phone"),
      // Discount fields
      discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
      // Amount discounted
      discountType: varchar("discount_type"),
      // "first_booking" or null
      originalAmount: decimal("original_amount", { precision: 10, scale: 2 }),
      // Amount before discount
      paymentMethod: varchar("payment_method", { enum: ["mpesa", "card"] }).default("mpesa"),
      paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed", "refunded"] }).default("pending"),
      mpesaReceiptNumber: varchar("mpesa_receipt_number"),
      mpesaPhoneNumber: varchar("mpesa_phone_number"),
      mpesaCheckoutRequestId: varchar("mpesa_checkout_request_id"),
      mpesaMerchantRequestId: varchar("mpesa_merchant_request_id"),
      mpesaTransactionDate: varchar("mpesa_transaction_date"),
      status: varchar("status", { enum: ["confirmed", "completed", "cancelled"] }).default("confirmed"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    reviews = pgTable("reviews", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      courtId: varchar("court_id").notNull().references(() => courts.id, { onDelete: "cascade" }),
      customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      bookingId: varchar("booking_id").references(() => bookings.id, { onDelete: "set null" }),
      rating: integer("rating").notNull(),
      // 1-5 stars
      title: varchar("title", { length: 100 }),
      comment: text("comment"),
      courtCleanliness: integer("court_cleanliness"),
      // 1-5 rating for cleanliness
      facilitiesQuality: integer("facilities_quality"),
      // 1-5 rating for facilities
      staffService: integer("staff_service"),
      // 1-5 rating for staff service
      valueForMoney: integer("value_for_money"),
      // 1-5 rating for value
      wouldRecommend: boolean("would_recommend").default(true),
      isVerifiedBooking: boolean("is_verified_booking").default(false),
      // true if reviewer actually booked the court
      helpfulVotes: integer("helpful_votes").default(0),
      reportCount: integer("report_count").default(0),
      isVisible: boolean("is_visible").default(true),
      // for moderation
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userRelations = relations(users, ({ many }) => ({
      courts: many(courts),
      bookings: many(bookings),
      reviews: many(reviews)
    }));
    courtRelations = relations(courts, ({ one, many }) => ({
      vendor: one(users, {
        fields: [courts.vendorId],
        references: [users.id]
      }),
      equipment: many(equipment),
      bookings: many(bookings),
      reviews: many(reviews)
    }));
    equipmentRelations = relations(equipment, ({ one }) => ({
      court: one(courts, {
        fields: [equipment.courtId],
        references: [courts.id]
      })
    }));
    bookingRelations = relations(bookings, ({ one, many }) => ({
      customer: one(users, {
        fields: [bookings.customerId],
        references: [users.id]
      }),
      court: one(courts, {
        fields: [bookings.courtId],
        references: [courts.id]
      }),
      reviews: many(reviews)
    }));
    reviewRelations = relations(reviews, ({ one }) => ({
      court: one(courts, {
        fields: [reviews.courtId],
        references: [courts.id]
      }),
      customer: one(users, {
        fields: [reviews.customerId],
        references: [users.id]
      }),
      booking: one(bookings, {
        fields: [reviews.bookingId],
        references: [bookings.id]
      })
    }));
    notifications = pgTable("notifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id),
      type: varchar("type").notNull(),
      // booking_confirmation, booking_reminder, booking_cancellation, booking_update
      title: varchar("title").notNull(),
      message: text("message").notNull(),
      data: jsonb("data"),
      // Additional data like booking details
      isRead: boolean("is_read").notNull().default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    userNotificationPreferences = pgTable("user_notification_preferences", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
      bookingConfirmations: boolean("booking_confirmations").notNull().default(true),
      bookingReminders: boolean("booking_reminders").notNull().default(true),
      bookingCancellations: boolean("booking_cancellations").notNull().default(true),
      vendorBookingAlerts: boolean("vendor_booking_alerts").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    venues = pgTable("venues", {
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
      amenities: text("amenities").array(),
      // ["parking", "wifi", "food", "accessibility"]
      hasSeatMap: boolean("has_seat_map").default(false),
      seatMapConfig: jsonb("seat_map_config"),
      // Stores visual layout configuration
      templateId: varchar("template_id"),
      // ID of the template used (cricket-stadium, football-stadium, etc.) - null if custom design
      isActive: boolean("is_active").default(true),
      approvalStatus: varchar("approval_status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
      adminNotes: text("admin_notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    seatSections = pgTable("seat_sections", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      venueId: varchar("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
      name: varchar("name").notNull(),
      // "VIP Section", "Balcony", "General Admission"
      color: varchar("color").notNull(),
      // Hex color for visual display
      basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
      // Default price for this section
      description: text("description"),
      seatCount: integer("seat_count").default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    seats = pgTable("seats", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      sectionId: varchar("section_id").notNull().references(() => seatSections.id, { onDelete: "cascade" }),
      venueId: varchar("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
      row: varchar("row").notNull(),
      // "A", "B", "C", etc.
      number: integer("number").notNull(),
      // 1, 2, 3, etc.
      seatLabel: varchar("seat_label").notNull(),
      // "A1", "B12", etc.
      priceOverride: decimal("price_override", { precision: 10, scale: 2 }),
      // Optional custom price for specific seat
      x: integer("x").notNull(),
      // X position in grid for visual display
      y: integer("y").notNull(),
      // Y position in grid for visual display
      isAccessible: boolean("is_accessible").default(false),
      // Wheelchair accessible
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    eventSeatReservations = pgTable("event_seat_reservations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      seatId: varchar("seat_id").notNull().references(() => seats.id, { onDelete: "cascade" }),
      eventBookingId: varchar("event_booking_id").references(() => eventBookings.id, { onDelete: "set null" }),
      status: varchar("status", { enum: ["available", "reserved", "booked"] }).default("available"),
      reservedUntil: timestamp("reserved_until"),
      // Temporary hold for checkout process
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    events = pgTable("events", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      vendorId: varchar("vendor_id").notNull().references(() => users.id),
      venueId: varchar("venue_id").notNull().references(() => venues.id),
      name: varchar("name").notNull(),
      description: text("description"),
      category: varchar("category").notNull(),
      // "music", "sports", "theater", "comedy", "conference"
      eventDate: timestamp("event_date").notNull(),
      eventTime: varchar("event_time").notNull(),
      // "19:00"
      duration: integer("duration").default(120),
      // minutes
      posterImageUrl: varchar("poster_image_url"),
      seatMap: jsonb("seat_map"),
      // JSON structure for seat layout
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
      updatedAt: timestamp("updated_at").defaultNow()
    });
    ticketTiers = pgTable("ticket_tiers", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      eventId: varchar("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
      name: varchar("name").notNull(),
      // "VIP", "General", "Student", "Early Bird"
      description: text("description"),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      quantity: integer("quantity").notNull(),
      availableQuantity: integer("available_quantity").notNull(),
      seatNumbers: text("seat_numbers").array(),
      // Optional specific seat assignments
      benefits: text("benefits").array(),
      // ["backstage access", "free drink", "priority entry"]
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    eventBookings = pgTable("event_bookings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      customerId: varchar("customer_id").notNull().references(() => users.id),
      eventId: varchar("event_id").notNull().references(() => events.id),
      ticketTierId: varchar("ticket_tier_id").notNull().references(() => ticketTiers.id),
      quantity: integer("quantity").notNull(),
      seatNumbers: text("seat_numbers").array(),
      // Actual seats booked
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      customerPhone: varchar("customer_phone"),
      customerEmail: varchar("customer_email"),
      paymentMethod: varchar("payment_method", { enum: ["mpesa", "card"] }).default("mpesa"),
      paymentStatus: varchar("payment_status", { enum: ["pending", "completed", "failed"] }).default("pending"),
      mpesaReceiptNumber: varchar("mpesa_receipt_number"),
      mpesaPhoneNumber: varchar("mpesa_phone_number"),
      mpesaCheckoutRequestId: varchar("mpesa_checkout_request_id"),
      mpesaMerchantRequestId: varchar("mpesa_merchant_request_id"),
      mpesaTransactionDate: varchar("mpesa_transaction_date"),
      status: varchar("status", { enum: ["confirmed", "cancelled"] }).default("confirmed"),
      bookingCode: varchar("booking_code").notNull(),
      // Unique code for ticket verification
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    notificationRelations = relations(notifications, ({ one }) => ({
      user: one(users, {
        fields: [notifications.userId],
        references: [users.id]
      })
    }));
    userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
      user: one(users, {
        fields: [userNotificationPreferences.userId],
        references: [users.id]
      })
    }));
    venueRelations = relations(venues, ({ one, many }) => ({
      vendor: one(users, {
        fields: [venues.vendorId],
        references: [users.id]
      }),
      events: many(events),
      seatSections: many(seatSections),
      seats: many(seats)
    }));
    seatSectionRelations = relations(seatSections, ({ one, many }) => ({
      venue: one(venues, {
        fields: [seatSections.venueId],
        references: [venues.id]
      }),
      seats: many(seats)
    }));
    seatRelations = relations(seats, ({ one, many }) => ({
      section: one(seatSections, {
        fields: [seats.sectionId],
        references: [seatSections.id]
      }),
      venue: one(venues, {
        fields: [seats.venueId],
        references: [venues.id]
      }),
      reservations: many(eventSeatReservations)
    }));
    eventSeatReservationRelations = relations(eventSeatReservations, ({ one }) => ({
      event: one(events, {
        fields: [eventSeatReservations.eventId],
        references: [events.id]
      }),
      seat: one(seats, {
        fields: [eventSeatReservations.seatId],
        references: [seats.id]
      }),
      eventBooking: one(eventBookings, {
        fields: [eventSeatReservations.eventBookingId],
        references: [eventBookings.id]
      })
    }));
    eventRelations = relations(events, ({ one, many }) => ({
      vendor: one(users, {
        fields: [events.vendorId],
        references: [users.id]
      }),
      venue: one(venues, {
        fields: [events.venueId],
        references: [venues.id]
      }),
      ticketTiers: many(ticketTiers),
      eventBookings: many(eventBookings)
    }));
    ticketTierRelations = relations(ticketTiers, ({ one, many }) => ({
      event: one(events, {
        fields: [ticketTiers.eventId],
        references: [events.id]
      }),
      bookings: many(eventBookings)
    }));
    eventBookingRelations = relations(eventBookings, ({ one }) => ({
      customer: one(users, {
        fields: [eventBookings.customerId],
        references: [users.id]
      }),
      event: one(events, {
        fields: [eventBookings.eventId],
        references: [events.id]
      }),
      ticketTier: one(ticketTiers, {
        fields: [eventBookings.ticketTierId],
        references: [ticketTiers.id]
      })
    }));
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertCourtSchema = createInsertSchema(courts).omit({
      id: true,
      vendorId: true,
      rating: true,
      totalBookings: true,
      approvalStatus: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true
    });
    insertEquipmentSchema = createInsertSchema(equipment).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertBookingSchema = createInsertSchema(bookings).omit({
      id: true,
      customerId: true,
      createdAt: true,
      updatedAt: true
    });
    insertReviewSchema = createInsertSchema(reviews).omit({
      id: true,
      helpfulVotes: true,
      reportCount: true,
      isVisible: true,
      createdAt: true,
      updatedAt: true
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true
    });
    insertUserNotificationPreferencesSchema = createInsertSchema(userNotificationPreferences).omit({
      id: true,
      createdAt: true
    });
    insertVenueSchema = createInsertSchema(venues).omit({
      id: true,
      vendorId: true,
      approvalStatus: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true
    });
    insertEventSchema = createInsertSchema(events).omit({
      id: true,
      vendorId: true,
      rating: true,
      totalBookings: true,
      approvalStatus: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      eventDate: z.coerce.date()
    });
    insertTicketTierSchema = createInsertSchema(ticketTiers).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    }).extend({
      price: z.coerce.string()
    });
    insertEventBookingSchema = createInsertSchema(eventBookings).omit({
      id: true,
      customerId: true,
      createdAt: true,
      updatedAt: true
    });
    insertSeatSectionSchema = createInsertSchema(seatSections).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSeatSchema = createInsertSchema(seats).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertEventSeatReservationSchema = createInsertSchema(eventSeatReservations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    vendorOnboardingSchema = z.object({
      // Personal Information (Required)
      phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
      alternatePhoneNumber: z.string().optional(),
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
      businessLicense: z.string().optional(),
      taxCertificate: z.string().optional()
    }).refine(
      (data) => {
        if (data.paymentPreference === "bank" || data.paymentPreference === "both") {
          return data.bankName && data.bankAccountNumber && data.bankAccountName;
        }
        return true;
      },
      {
        message: "Bank details are required when bank payment is selected",
        path: ["bankName"]
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
        path: ["mpesaNumber"]
      }
    );
    matches = pgTable("matches", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").notNull(),
      courtId: varchar("court_id").notNull(),
      sport: varchar("sport").notNull(),
      matchDate: varchar("match_date").notNull(),
      startTime: varchar("start_time").notNull(),
      duration: integer("duration").notNull().default(1),
      totalSpots: integer("total_spots").notNull(),
      totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
      pricePerSpot: decimal("price_per_spot", { precision: 10, scale: 2 }).notNull(),
      notes: text("notes"),
      status: varchar("status", { enum: ["open", "full", "confirming", "confirmed", "cancelled"] }).notNull().default("open"),
      communityId: varchar("community_id"),
      bookingId: varchar("booking_id"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    matchParticipants = pgTable("match_participants", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      matchId: varchar("match_id").notNull(),
      userId: varchar("user_id").notNull(),
      paymentStatus: varchar("payment_status", { enum: ["unpaid", "paid"] }).notNull().default("unpaid"),
      confirmStatus: varchar("confirm_status", { enum: ["none", "confirmed", "dropped"] }).notNull().default("none"),
      mpesaCheckoutRequestId: varchar("mpesa_checkout_request_id"),
      mpesaReceiptNumber: varchar("mpesa_receipt_number"),
      joinedAt: timestamp("joined_at").defaultNow()
    });
    communities = pgTable("communities", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      creatorId: varchar("creator_id").notNull(),
      name: varchar("name").notNull(),
      description: text("description"),
      imageUrl: varchar("image_url"),
      sports: text("sports").array().default([]),
      skillLevel: varchar("skill_level", { enum: ["beginner", "casual", "competitive", "all"] }).notNull().default("all"),
      city: varchar("city"),
      area: varchar("area"),
      joinPolicy: varchar("join_policy", { enum: ["open", "request"] }).notNull().default("open"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    communityMembers = pgTable("community_members", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      communityId: varchar("community_id").notNull(),
      userId: varchar("user_id").notNull(),
      role: varchar("role", { enum: ["creator", "member"] }).notNull().default("member"),
      status: varchar("status", { enum: ["pending", "approved"] }).notNull().default("approved"),
      joinedAt: timestamp("joined_at").defaultNow()
    });
    communityMessages = pgTable("community_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      communityId: varchar("community_id").notNull(),
      userId: varchar("user_id").notNull(),
      message: text("message").notNull(),
      createdAt: timestamp("created_at").defaultNow()
    });
    refunds2 = pgTable("refunds", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      bookingId: varchar("booking_id").notNull().unique(),
      customerPhone: varchar("customer_phone").notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      originalReceipt: varchar("original_receipt"),
      reason: varchar("reason"),
      status: varchar("status", { enum: ["pending", "processing", "sent", "failed"] }).notNull().default("pending"),
      mpesaConversationId: varchar("mpesa_conversation_id"),
      failureReason: text("failure_reason"),
      requestedAt: timestamp("requested_at").defaultNow(),
      sentAt: timestamp("sent_at"),
      processedBy: varchar("processed_by")
    });
  }
});

// server/objectAcl.ts
function isPermissionAllowed(requested, granted) {
  if (requested === "read" /* READ */) {
    return ["read" /* READ */, "write" /* WRITE */].includes(granted);
  }
  return granted === "write" /* WRITE */;
}
function createObjectAccessGroup(group) {
  switch (group.type) {
    // Implement the case for each type of access group to instantiate.
    //
    // For example:
    // case "USER_LIST":
    //   return new UserListAccessGroup(group.id);
    // case "EMAIL_DOMAIN":
    //   return new EmailDomainAccessGroup(group.id);
    // case "GROUP_MEMBER":
    //   return new GroupMemberAccessGroup(group.id);
    // case "SUBSCRIBER":
    //   return new SubscriberAccessGroup(group.id);
    default:
      throw new Error(`Unknown access group type: ${group.type}`);
  }
}
async function setObjectAclPolicy(objectFile, aclPolicy) {
  const [exists] = await objectFile.exists();
  if (!exists) {
    throw new Error(`Object not found: ${objectFile.name}`);
  }
  await objectFile.setMetadata({
    metadata: {
      [ACL_POLICY_METADATA_KEY]: JSON.stringify(aclPolicy)
    }
  });
}
async function getObjectAclPolicy(objectFile) {
  const [metadata] = await objectFile.getMetadata();
  const aclPolicy = metadata?.metadata?.[ACL_POLICY_METADATA_KEY];
  if (!aclPolicy) {
    return null;
  }
  return JSON.parse(aclPolicy);
}
async function canAccessObject({
  userId,
  objectFile,
  requestedPermission
}) {
  const aclPolicy = await getObjectAclPolicy(objectFile);
  if (!aclPolicy) {
    return false;
  }
  if (aclPolicy.visibility === "public" && requestedPermission === "read" /* READ */) {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (aclPolicy.owner === userId) {
    return true;
  }
  for (const rule of aclPolicy.aclRules || []) {
    const accessGroup = createObjectAccessGroup(rule.group);
    if (await accessGroup.hasMember(userId) && isPermissionAllowed(requestedPermission, rule.permission)) {
      return true;
    }
  }
  return false;
}
var ACL_POLICY_METADATA_KEY;
var init_objectAcl = __esm({
  "server/objectAcl.ts"() {
    "use strict";
    ACL_POLICY_METADATA_KEY = "custom:aclPolicy";
  }
});

// server/objectStorage.ts
var objectStorage_exports = {};
__export(objectStorage_exports, {
  ObjectNotFoundError: () => ObjectNotFoundError,
  ObjectStorageService: () => ObjectStorageService,
  objectStorageClient: () => objectStorageClient
});
import { Storage } from "@google-cloud/storage";
import { randomUUID } from "crypto";
function parseObjectPath(path3) {
  if (!path3.startsWith("/")) {
    path3 = `/${path3}`;
  }
  const pathParts = path3.split("/");
  if (pathParts.length < 3) {
    throw new Error("Invalid path: must contain at least a bucket name");
  }
  const bucketName = pathParts[1];
  const objectName = pathParts.slice(2).join("/");
  return {
    bucketName,
    objectName
  };
}
async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec
}) {
  const request = {
    bucket_name: bucketName,
    object_name: objectName,
    method,
    expires_at: new Date(Date.now() + ttlSec * 1e3).toISOString()
  };
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
    );
  }
  const { signed_url: signedURL } = await response.json();
  return signedURL;
}
var REPLIT_SIDECAR_ENDPOINT, objectStorageClient, ObjectNotFoundError, ObjectStorageService;
var init_objectStorage = __esm({
  "server/objectStorage.ts"() {
    "use strict";
    init_objectAcl();
    REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
    objectStorageClient = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token"
          }
        },
        universe_domain: "googleapis.com"
      },
      projectId: ""
    });
    ObjectNotFoundError = class _ObjectNotFoundError extends Error {
      constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
      }
    };
    ObjectStorageService = class {
      constructor() {
      }
      // Gets the public object search paths.
      getPublicObjectSearchPaths() {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
          new Set(
            pathsStr.split(",").map((path3) => path3.trim()).filter((path3) => path3.length > 0)
          )
        );
        if (paths.length === 0) {
          throw new Error(
            "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths)."
          );
        }
        return paths;
      }
      // Gets the private object directory.
      getPrivateObjectDir() {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        return dir;
      }
      // Search for a public object from the search paths.
      async searchPublicObject(filePath) {
        for (const searchPath of this.getPublicObjectSearchPaths()) {
          const fullPath = `${searchPath}/${filePath}`;
          const { bucketName, objectName } = parseObjectPath(fullPath);
          const bucket = objectStorageClient.bucket(bucketName);
          const file = bucket.file(objectName);
          const [exists] = await file.exists();
          if (exists) {
            return file;
          }
        }
        return null;
      }
      // Downloads an object to the response.
      async downloadObject(file, res, cacheTtlSec = 3600) {
        try {
          const [metadata] = await file.getMetadata();
          const aclPolicy = await getObjectAclPolicy(file);
          const isPublic = aclPolicy?.visibility === "public";
          res.set({
            "Content-Type": metadata.contentType || "application/octet-stream",
            "Content-Length": metadata.size,
            "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`
          });
          const stream = file.createReadStream();
          stream.on("error", (err) => {
            console.error("Stream error:", err);
            if (!res.headersSent) {
              res.status(500).json({ error: "Error streaming file" });
            }
          });
          stream.pipe(res);
        } catch (error) {
          console.error("Error downloading file:", error);
          if (!res.headersSent) {
            res.status(500).json({ error: "Error downloading file" });
          }
        }
      }
      // Gets the upload URL for an object entity.
      async getObjectEntityUploadURL() {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
          throw new Error(
            "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' tool and set PRIVATE_OBJECT_DIR env var."
          );
        }
        const objectId = randomUUID();
        const fullPath = `${privateObjectDir}/uploads/${objectId}`;
        const { bucketName, objectName } = parseObjectPath(fullPath);
        return signObjectURL({
          bucketName,
          objectName,
          method: "PUT",
          ttlSec: 900
        });
      }
      // Gets the object entity file from the object path.
      async getObjectEntityFile(objectPath) {
        if (!objectPath.startsWith("/objects/")) {
          throw new ObjectNotFoundError();
        }
        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
          throw new ObjectNotFoundError();
        }
        const entityId = parts.slice(1).join("/");
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
          entityDir = `${entityDir}/`;
        }
        const objectEntityPath = `${entityDir}${entityId}`;
        const { bucketName, objectName } = parseObjectPath(objectEntityPath);
        const bucket = objectStorageClient.bucket(bucketName);
        const objectFile = bucket.file(objectName);
        const [exists] = await objectFile.exists();
        if (!exists) {
          throw new ObjectNotFoundError();
        }
        return objectFile;
      }
      normalizeObjectEntityPath(rawPath) {
        if (!rawPath.startsWith("https://storage.googleapis.com/")) {
          return rawPath;
        }
        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;
        let objectEntityDir = this.getPrivateObjectDir();
        if (!objectEntityDir.endsWith("/")) {
          objectEntityDir = `${objectEntityDir}/`;
        }
        if (!rawObjectPath.startsWith(objectEntityDir)) {
          return rawObjectPath;
        }
        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
      }
      // Tries to set the ACL policy for the object entity and return the normalized path.
      async trySetObjectEntityAclPolicy(rawPath, aclPolicy) {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) {
          return normalizedPath;
        }
        const objectFile = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(objectFile, aclPolicy);
        return normalizedPath;
      }
      // Checks if the user can access the object entity.
      async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission
      }) {
        return canAccessObject({
          userId,
          objectFile,
          requestedPermission: requestedPermission ?? "read" /* READ */
        });
      }
    };
  }
});

// server/cloudinaryStorage.ts
var cloudinaryStorage_exports = {};
__export(cloudinaryStorage_exports, {
  getCloudinaryUrl: () => getCloudinaryUrl,
  uploadToCloudinary: () => uploadToCloudinary
});
import { v2 as cloudinary } from "cloudinary";
import { randomUUID as randomUUID3 } from "crypto";
async function uploadToCloudinary(buffer, mimeType, folder = "uploads") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        public_id: randomUUID3()
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}
async function getCloudinaryUrl(publicId) {
  return cloudinary.url(publicId, { secure: true });
}
var init_cloudinaryStorage = __esm({
  "server/cloudinaryStorage.ts"() {
    "use strict";
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
});

// shared/venueTemplates.ts
var venueTemplates_exports = {};
__export(venueTemplates_exports, {
  VENUE_TEMPLATES: () => VENUE_TEMPLATES,
  getTemplateById: () => getTemplateById,
  getTemplatesByCategory: () => getTemplatesByCategory
});
function generateCricketStadiumSeats() {
  const seats2 = [];
  let y = 0;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats2.push({
        seatLabel: `P${row}-${seat}`,
        row: `P${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: "Pavilion"
      });
    }
  }
  y += 40;
  for (let row = 1; row <= 50; row++) {
    for (let seat = 1; seat <= 80; seat++) {
      seats2.push({
        seatLabel: `G${row}-${seat}`,
        row: `G${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 45,
        sectionName: "Grandstand"
      });
    }
  }
  y += 50;
  for (let row = 1; row <= 60; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats2.push({
        seatLabel: `GS${row}-${seat}`,
        row: `GS${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 55,
        sectionName: "General Stand"
      });
    }
  }
  y += 60;
  for (let row = 1; row <= 30; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats2.push({
        seatLabel: `B${row}-${seat}`,
        row: `B${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 25,
        sectionName: "Boundary Seating"
      });
    }
  }
  return seats2;
}
function generateFootballStadiumSeats() {
  const seats2 = [];
  let y = 0;
  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats2.push({
        seatLabel: `VIP${row}-${seat}`,
        row: `VIP${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 8,
        sectionName: "VIP Box"
      });
    }
  }
  y += 10;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 150; seat++) {
      seats2.push({
        seatLabel: `LS${row}-${seat}`,
        row: `LS${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: "Lower Sideline"
      });
    }
  }
  y += 40;
  for (let row = 1; row <= 50; row++) {
    for (let seat = 1; seat <= 160; seat++) {
      seats2.push({
        seatLabel: `US${row}-${seat}`,
        row: `US${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 45,
        sectionName: "Upper Sideline"
      });
    }
  }
  y += 50;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats2.push({
        seatLabel: `EZ${row}-${seat}`,
        row: `EZ${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: "End Zone"
      });
    }
  }
  y += 40;
  for (let row = 1; row <= 30; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats2.push({
        seatLabel: `C${row}-${seat}`,
        row: `C${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 25,
        sectionName: "Corner Sections"
      });
    }
  }
  return seats2;
}
function generateBasketballArenaSeats() {
  const seats2 = [];
  let y = 0;
  for (let row = 1; row <= 4; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats2.push({
        seatLabel: `CS${row}-${seat}`,
        row: `CS${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: true,
        sectionName: "Courtside"
      });
    }
  }
  y += 4;
  for (let row = 1; row <= 30; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats2.push({
        seatLabel: `LB${row}-${seat}`,
        row: `LB${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 25,
        sectionName: "Lower Bowl"
      });
    }
  }
  y += 30;
  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 80; seat++) {
      seats2.push({
        seatLabel: `CL${row}-${seat}`,
        row: `CL${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 8,
        sectionName: "Club Seats"
      });
    }
  }
  y += 10;
  for (let row = 1; row <= 40; row++) {
    for (let seat = 1; seat <= 100; seat++) {
      seats2.push({
        seatLabel: `UB${row}-${seat}`,
        row: `UB${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 35,
        sectionName: "Upper Bowl"
      });
    }
  }
  return seats2;
}
function generateMovieTheatreSeats() {
  const seats2 = [];
  for (let row = 1; row <= 5; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      seats2.push({
        seatLabel: `${String.fromCharCode(64 + row)}${seat}`,
        row: String.fromCharCode(64 + row),
        number: seat,
        x: seat,
        y: row,
        priceOverride: null,
        isAccessible: row === 5,
        sectionName: "Premium Seats"
      });
    }
  }
  for (let row = 6; row <= 25; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      seats2.push({
        seatLabel: `${String.fromCharCode(64 + row)}${seat}`,
        row: String.fromCharCode(64 + row),
        number: seat,
        x: seat,
        y: row,
        priceOverride: null,
        isAccessible: row === 15 || row === 25,
        sectionName: "Standard Seats"
      });
    }
  }
  for (let row = 26; row <= 30; row++) {
    for (let seat = 1; seat <= 10; seat++) {
      seats2.push({
        seatLabel: `${String.fromCharCode(64 + row)}${seat}`,
        row: String.fromCharCode(64 + row),
        number: seat,
        x: seat,
        y: row,
        priceOverride: null,
        isAccessible: row === 30,
        sectionName: "Back Row"
      });
    }
  }
  return seats2;
}
function generateConcertHallSeats() {
  const seats2 = [];
  let y = 0;
  for (let row = 1; row <= 5; row++) {
    for (let seat = 1; seat <= 20; seat++) {
      seats2.push({
        seatLabel: `VIP${row}-${seat}`,
        row: `VIP${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: true,
        sectionName: "VIP Lounge"
      });
    }
  }
  y += 5;
  for (let row = 1; row <= 10; row++) {
    for (let seat = 1; seat <= 50; seat++) {
      seats2.push({
        seatLabel: `PIT${row}-${seat}`,
        row: `PIT${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 8,
        sectionName: "Front Pit"
      });
    }
  }
  y += 10;
  for (let row = 1; row <= 20; row++) {
    for (let seat = 1; seat <= 75; seat++) {
      seats2.push({
        seatLabel: `FL${row}-${seat}`,
        row: `FL${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 18,
        sectionName: "Floor Seating"
      });
    }
  }
  y += 20;
  for (let row = 1; row <= 15; row++) {
    for (let seat = 1; seat <= 80; seat++) {
      seats2.push({
        seatLabel: `BAL${row}-${seat}`,
        row: `BAL${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 13,
        sectionName: "Balcony"
      });
    }
  }
  y += 15;
  for (let row = 1; row <= 20; row++) {
    for (let seat = 1; seat <= 85; seat++) {
      seats2.push({
        seatLabel: `GA${row}-${seat}`,
        row: `GA${row}`,
        number: seat,
        x: seat,
        y: y + row,
        priceOverride: null,
        isAccessible: row >= 18,
        sectionName: "General Admission"
      });
    }
  }
  return seats2;
}
function getTemplateById(templateId) {
  return VENUE_TEMPLATES.find((t) => t.id === templateId);
}
function getTemplatesByCategory(category) {
  return VENUE_TEMPLATES.filter((t) => t.category === category);
}
var VENUE_TEMPLATES;
var init_venueTemplates = __esm({
  "shared/venueTemplates.ts"() {
    "use strict";
    VENUE_TEMPLATES = [
      {
        id: "cricket-stadium",
        name: "Cricket Stadium",
        description: "Oval-shaped stadium with pavilion, grandstand, and general seating sections",
        category: "cricket",
        capacity: 15e3,
        sections: [
          { name: "Pavilion", color: "#FFD700", basePrice: "5000" },
          { name: "Grandstand", color: "#FF6B6B", basePrice: "3000" },
          { name: "General Stand", color: "#4ECDC4", basePrice: "1500" },
          { name: "Boundary Seating", color: "#95E1D3", basePrice: "2500" }
        ],
        seats: generateCricketStadiumSeats()
      },
      {
        id: "football-stadium",
        name: "Football Stadium",
        description: "Rectangular stadium with sideline, endzone, and VIP sections",
        category: "football",
        capacity: 2e4,
        sections: [
          { name: "VIP Box", color: "#FFD700", basePrice: "6000" },
          { name: "Lower Sideline", color: "#FF6B6B", basePrice: "4000" },
          { name: "Upper Sideline", color: "#4ECDC4", basePrice: "2500" },
          { name: "End Zone", color: "#95E1D3", basePrice: "1800" },
          { name: "Corner Sections", color: "#A8DADC", basePrice: "2000" }
        ],
        seats: generateFootballStadiumSeats()
      },
      {
        id: "basketball-arena",
        name: "Basketball Arena",
        description: "Indoor arena with courtside, lower bowl, and upper bowl sections",
        category: "basketball",
        capacity: 8e3,
        sections: [
          { name: "Courtside", color: "#FFD700", basePrice: "8000" },
          { name: "Lower Bowl", color: "#FF6B6B", basePrice: "4500" },
          { name: "Club Seats", color: "#FFA500", basePrice: "5500" },
          { name: "Upper Bowl", color: "#4ECDC4", basePrice: "2000" }
        ],
        seats: generateBasketballArenaSeats()
      },
      {
        id: "movie-theatre",
        name: "Movie Theatre",
        description: "Traditional cinema with standard, premium, and back row sections",
        category: "theatre",
        capacity: 300,
        sections: [
          { name: "Premium Seats", color: "#FFD700", basePrice: "800" },
          { name: "Standard Seats", color: "#4ECDC4", basePrice: "500" },
          { name: "Back Row", color: "#95E1D3", basePrice: "400" }
        ],
        seats: generateMovieTheatreSeats()
      },
      {
        id: "concert-hall",
        name: "Concert Hall",
        description: "Concert venue with pit, floor, balcony, and VIP sections",
        category: "concert",
        capacity: 5e3,
        sections: [
          { name: "VIP Lounge", color: "#FFD700", basePrice: "10000" },
          { name: "Front Pit", color: "#FF6B6B", basePrice: "7000" },
          { name: "Floor Seating", color: "#FFA500", basePrice: "4500" },
          { name: "Balcony", color: "#4ECDC4", basePrice: "3000" },
          { name: "General Admission", color: "#95E1D3", basePrice: "2000" }
        ],
        seats: generateConcertHallSeats()
      }
    ];
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";

// server/storage.ts
init_schema();

// server/db.ts
init_schema();
import pkg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pkg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, desc, sql as sql2, gte, lte } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserProfile(id, updates) {
    const [updatedUser] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  async updateUser(id, updates) {
    const [updatedUser] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return updatedUser;
  }
  // Court operations
  async getCourts(filters) {
    let whereConditions = [eq(courts.isActive, true), eq(courts.approvalStatus, "approved")];
    if (filters?.city) {
      whereConditions.push(eq(courts.city, filters.city));
    }
    if (filters?.sport && filters.sport !== "All Sports") {
      whereConditions.push(sql2`${courts.availableSports} @> ARRAY[${filters.sport}]`);
    }
    const query = db.select().from(courts).leftJoin(users, eq(courts.vendorId, users.id)).leftJoin(equipment, eq(courts.id, equipment.courtId)).where(and(...whereConditions));
    const results = await query.orderBy(desc(courts.createdAt));
    const courtMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.courts) continue;
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users,
          equipment: []
        });
      }
      if (row.equipment) {
        courtMap.get(courtId).equipment.push(row.equipment);
      }
    }
    let courtsArray = Array.from(courtMap.values());
    if (filters?.userLatitude && filters?.userLongitude) {
      courtsArray = courtsArray.map((court) => ({
        ...court,
        distance: court.latitude && court.longitude ? this.calculateDistance(
          filters.userLatitude,
          filters.userLongitude,
          parseFloat(court.latitude),
          parseFloat(court.longitude)
        ) : void 0
      }));
      if (filters.maxDistance) {
        courtsArray = courtsArray.filter(
          (court) => court.distance === void 0 || court.distance <= filters.maxDistance
        );
      }
      if (filters.sortByDistance) {
        courtsArray.sort((a, b) => {
          if (a.distance === void 0 && b.distance === void 0) return 0;
          if (a.distance === void 0) return 1;
          if (b.distance === void 0) return -1;
          return a.distance - b.distance;
        });
      }
    }
    return courtsArray;
  }
  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.degToRad(lat2 - lat1);
    const dLon = this.degToRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  }
  degToRad(deg) {
    return deg * (Math.PI / 180);
  }
  async getCourtById(id) {
    const results = await db.select().from(courts).leftJoin(users, eq(courts.vendorId, users.id)).leftJoin(equipment, eq(courts.id, equipment.courtId)).where(eq(courts.id, id));
    if (results.length === 0) return void 0;
    const court = results[0].courts;
    const vendor = results[0].users;
    const equipmentList = results.filter((row) => row.equipment).map((row) => row.equipment);
    return {
      ...court,
      vendor,
      equipment: equipmentList
    };
  }
  async getCourtsByVendor(vendorId) {
    const results = await db.select().from(courts).leftJoin(users, eq(courts.vendorId, users.id)).leftJoin(equipment, eq(courts.id, equipment.courtId)).where(eq(courts.vendorId, vendorId)).orderBy(desc(courts.createdAt));
    const courtMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.courts) continue;
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users,
          equipment: []
        });
      }
      if (row.equipment) {
        courtMap.get(courtId).equipment.push(row.equipment);
      }
    }
    return Array.from(courtMap.values());
  }
  async createCourt(vendorId, court) {
    const [newCourt] = await db.insert(courts).values({
      ...court,
      vendorId,
      approvalStatus: "pending",
      // Courts need admin approval
      isActive: false,
      // Inactive until approved
      commissionRate: "15.00"
      // Set default commission rate
    }).returning();
    return newCourt;
  }
  async updateCourt(id, vendorId, court) {
    const [updatedCourt] = await db.update(courts).set({ ...court, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(courts.id, id), eq(courts.vendorId, vendorId))).returning();
    return updatedCourt;
  }
  async updateCourtDetails(id, vendorId, updates) {
    const [updatedCourt] = await db.update(courts).set({
      ...updates,
      approvalStatus: "pending",
      adminNotes: "Court details updated by vendor - pending re-approval",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(and(eq(courts.id, id), eq(courts.vendorId, vendorId))).returning();
    return updatedCourt;
  }
  async deleteCourt(id, vendorId) {
    const result = await db.delete(courts).where(and(eq(courts.id, id), eq(courts.vendorId, vendorId)));
    return (result.rowCount || 0) > 0;
  }
  async migrateVendorId(oldId, newId) {
    await db.update(courts).set({ vendorId: newId }).where(eq(courts.vendorId, oldId));
  }
  // Equipment operations
  async getEquipmentByCourt(courtId) {
    return await db.select().from(equipment).where(eq(equipment.courtId, courtId)).orderBy(equipment.category, equipment.name);
  }
  async getAvailableEquipmentByCourt(courtId) {
    return await db.select().from(equipment).where(and(eq(equipment.courtId, courtId), eq(equipment.isAvailable, true))).orderBy(equipment.category, equipment.name);
  }
  async createEquipment(equipmentData) {
    const [newEquipment] = await db.insert(equipment).values({
      ...equipmentData,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }).returning();
    return newEquipment;
  }
  async updateEquipment(id, equipmentData) {
    const [updatedEquipment] = await db.update(equipment).set({ ...equipmentData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(equipment.id, id)).returning();
    return updatedEquipment;
  }
  async deleteEquipment(id) {
    const result = await db.delete(equipment).where(eq(equipment.id, id));
    return (result.rowCount || 0) > 0;
  }
  async checkEquipmentAvailability(equipmentId, quantity, startTime, endTime) {
    const [equipmentInfo] = await db.select().from(equipment).where(eq(equipment.id, equipmentId));
    if (!equipmentInfo || !equipmentInfo.isAvailable) {
      return false;
    }
    if (quantity > (equipmentInfo.quantityAvailable || 1)) {
      return false;
    }
    return true;
  }
  // Booking operations
  async createBooking(booking) {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }
  async getBookingsByCustomer(customerId) {
    const results = await db.select().from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).leftJoin(users, eq(bookings.customerId, users.id)).where(eq(bookings.customerId, customerId)).orderBy(desc(bookings.createdAt));
    return results.map((row) => ({
      ...row.bookings,
      court: row.courts,
      customer: row.users
    }));
  }
  async getBookingsByVendor(vendorId) {
    const results = await db.select().from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).leftJoin(users, eq(bookings.customerId, users.id)).where(eq(courts.vendorId, vendorId)).orderBy(desc(bookings.createdAt));
    return results.map((row) => ({
      ...row.bookings,
      court: row.courts,
      customer: row.users
    }));
  }
  async getBookingsByCourtAndDate(courtId, date) {
    const bookingDate = new Date(date);
    const nextDay = new Date(bookingDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return await db.select().from(bookings).where(
      and(
        eq(bookings.courtId, courtId),
        gte(bookings.bookingDate, bookingDate),
        lte(bookings.bookingDate, nextDay)
      )
    );
  }
  async getBookingById(id) {
    const [result] = await db.select().from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).leftJoin(users, eq(bookings.customerId, users.id)).where(eq(bookings.id, id));
    if (!result) return void 0;
    return {
      ...result.bookings,
      court: result.courts,
      customer: result.users
    };
  }
  async updateBookingStatus(id, status) {
    const [updatedBooking] = await db.update(bookings).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id)).returning();
    return updatedBooking;
  }
  async getBooking(id) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }
  async updateBookingPayment(id, data) {
    const [updatedBooking] = await db.update(bookings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(bookings.id, id)).returning();
    return updatedBooking;
  }
  async getBookingByCheckoutRequestId(checkoutRequestId) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.mpesaCheckoutRequestId, checkoutRequestId));
    return booking;
  }
  // Review operations
  async createReview(reviewData) {
    const [newReview] = await db.insert(reviews).values(reviewData).returning();
    await this.updateCourtRating(reviewData.courtId);
    return newReview;
  }
  async getReviewsByCourt(courtId) {
    const results = await db.select().from(reviews).leftJoin(users, eq(reviews.customerId, users.id)).leftJoin(bookings, eq(reviews.bookingId, bookings.id)).where(and(eq(reviews.courtId, courtId), eq(reviews.isVisible, true))).orderBy(desc(reviews.createdAt));
    return results.map((row) => ({
      ...row.reviews,
      customer: row.users,
      booking: row.bookings || void 0
    }));
  }
  async getReviewsByCustomer(customerId) {
    const results = await db.select().from(reviews).leftJoin(users, eq(reviews.customerId, users.id)).leftJoin(courts, eq(reviews.courtId, courts.id)).leftJoin(bookings, eq(reviews.bookingId, bookings.id)).where(eq(reviews.customerId, customerId)).orderBy(desc(reviews.createdAt));
    return results.map((row) => ({
      ...row.reviews,
      customer: row.users,
      court: row.courts || void 0,
      booking: row.bookings || void 0
    }));
  }
  async updateReviewHelpfulness(reviewId, increment) {
    const [updatedReview] = await db.update(reviews).set({
      helpfulVotes: increment ? sql2`${reviews.helpfulVotes} + 1` : sql2`${reviews.helpfulVotes} - 1`
    }).where(eq(reviews.id, reviewId)).returning();
    return updatedReview;
  }
  async reportReview(reviewId) {
    const [updatedReview] = await db.update(reviews).set({
      reportCount: sql2`${reviews.reportCount} + 1`,
      // Hide review if it gets 5+ reports
      isVisible: sql2`CASE WHEN ${reviews.reportCount} >= 4 THEN false ELSE ${reviews.isVisible} END`
    }).where(eq(reviews.id, reviewId)).returning();
    return updatedReview;
  }
  // Helper method to update court rating based on reviews
  async updateCourtRating(courtId) {
    const [{ avg: averageRating, count: totalReviews }] = await db.select({
      avg: sql2`coalesce(avg(${reviews.rating}), 0)`,
      count: sql2`count(*)`
    }).from(reviews).where(and(eq(reviews.courtId, courtId), eq(reviews.isVisible, true)));
    await db.update(courts).set({
      rating: averageRating.toFixed(2),
      totalBookings: Number(totalReviews)
      // Using this field to store review count for now
    }).where(eq(courts.id, courtId));
  }
  // Analytics
  async getVendorStats(vendorId) {
    const [{ count: totalCourts }] = await db.select({ count: sql2`count(*)` }).from(courts).where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)));
    const startOfMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1);
    const endOfMonth = new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth() + 1, 0);
    const [{ count: activeBookings }] = await db.select({ count: sql2`count(*)` }).from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).where(
      and(
        eq(courts.vendorId, vendorId),
        eq(bookings.status, "confirmed"),
        sql2`${bookings.createdAt} >= ${startOfMonth}`,
        sql2`${bookings.createdAt} <= ${endOfMonth}`
      )
    );
    const [{ sum: monthlyRevenue }] = await db.select({ sum: sql2`coalesce(sum(${bookings.totalAmount}), 0)` }).from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).where(
      and(
        eq(courts.vendorId, vendorId),
        eq(bookings.paymentStatus, "completed"),
        sql2`${bookings.createdAt} >= ${startOfMonth}`,
        sql2`${bookings.createdAt} <= ${endOfMonth}`
      )
    );
    const [{ avg: averageRating }] = await db.select({ avg: sql2`coalesce(avg(${courts.rating}), 0)` }).from(courts).where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)));
    return {
      totalCourts: Number(totalCourts) || 0,
      activeBookings: Number(activeBookings) || 0,
      monthlyRevenue: Number(monthlyRevenue) || 0,
      averageRating: Number(averageRating) || 0
    };
  }
  // Vendor Court Analytics
  async getVendorCourtAnalytics(vendorId) {
    const vendorCourts = await db.select().from(courts).where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true)));
    const analytics = [];
    for (const court of vendorCourts) {
      const [{ count: totalBookings }] = await db.select({ count: sql2`count(*)` }).from(bookings).where(eq(bookings.courtId, court.id));
      const [{ sum: revenue }] = await db.select({ sum: sql2`coalesce(sum(${bookings.totalAmount}), 0)` }).from(bookings).where(and(
        eq(bookings.courtId, court.id),
        eq(bookings.paymentStatus, "completed")
      ));
      const popularSports = await db.select({
        sport: bookings.selectedSport,
        bookings: sql2`count(*)`
      }).from(bookings).where(eq(bookings.courtId, court.id)).groupBy(bookings.selectedSport).orderBy(sql2`count(*) desc`).limit(5);
      const recentBookings = await db.select({
        date: bookings.bookingDate,
        sport: bookings.selectedSport,
        revenue: bookings.totalAmount,
        customerPhone: bookings.customerPhone
      }).from(bookings).where(eq(bookings.courtId, court.id)).orderBy(desc(bookings.createdAt)).limit(10);
      analytics.push({
        courtId: court.id,
        courtName: court.name,
        city: court.city,
        totalBookings: Number(totalBookings) || 0,
        revenue: Number(revenue) || 0,
        averageRating: Number(court.rating) || 0,
        popularSports: popularSports.map((s) => ({
          sport: s.sport || "General",
          bookings: Number(s.bookings) || 0
        })),
        recentBookings: recentBookings.map((b) => ({
          date: b.date?.toISOString() || (/* @__PURE__ */ new Date()).toISOString(),
          sport: b.sport || "General",
          revenue: Number(b.revenue) || 0,
          customerPhone: b.customerPhone || ""
        }))
      });
    }
    return analytics;
  }
  // Vendor City Analytics
  async getVendorCityAnalytics(vendorId) {
    const cities = await db.select({
      city: courts.city,
      count: sql2`count(*)`
    }).from(courts).where(and(eq(courts.vendorId, vendorId), eq(courts.isActive, true))).groupBy(courts.city);
    const analytics = [];
    for (const cityInfo of cities) {
      const city = cityInfo.city;
      const [{ count: totalBookings }] = await db.select({ count: sql2`count(*)` }).from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).where(and(
        eq(courts.vendorId, vendorId),
        eq(courts.city, city)
      ));
      const [{ sum: revenue }] = await db.select({ sum: sql2`coalesce(sum(${bookings.totalAmount}), 0)` }).from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).where(and(
        eq(courts.vendorId, vendorId),
        eq(courts.city, city),
        eq(bookings.paymentStatus, "completed")
      ));
      const popularSports = await db.select({
        sport: bookings.selectedSport,
        bookings: sql2`count(*)`
      }).from(bookings).leftJoin(courts, eq(bookings.courtId, courts.id)).where(and(
        eq(courts.vendorId, vendorId),
        eq(courts.city, city)
      )).groupBy(bookings.selectedSport).orderBy(sql2`count(*) desc`).limit(5);
      analytics.push({
        city,
        totalCourts: Number(cityInfo.count) || 0,
        totalBookings: Number(totalBookings) || 0,
        revenue: Number(revenue) || 0,
        popularSports: popularSports.map((s) => ({
          sport: s.sport || "General",
          bookings: Number(s.bookings) || 0
        }))
      });
    }
    return analytics;
  }
  // Admin operations
  async getPendingCourts() {
    const results = await db.select().from(courts).leftJoin(users, eq(courts.vendorId, users.id)).leftJoin(equipment, eq(courts.id, equipment.courtId)).where(eq(courts.approvalStatus, "pending")).orderBy(desc(courts.createdAt));
    const courtMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.courts) continue;
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users,
          equipment: []
        });
      }
      if (row.equipment) {
        courtMap.get(courtId).equipment.push(row.equipment);
      }
    }
    return Array.from(courtMap.values());
  }
  async getPendingVendors() {
    const results = await db.select().from(users).where(and(
      eq(users.userType, "vendor"),
      eq(users.vendorVerificationStatus, "pending")
    )).orderBy(desc(users.createdAt));
    return results;
  }
  async updateVendorStatus(vendorId, status) {
    const results = await db.update(users).set({
      vendorVerificationStatus: status,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, vendorId)).returning();
    return results[0] || null;
  }
  async approveCourt(courtId, adminNotes) {
    const [updatedCourt] = await db.update(courts).set({
      approvalStatus: "approved",
      isActive: true,
      // Make court active when approved
      adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(courts.id, courtId)).returning();
    return updatedCourt;
  }
  async rejectCourt(courtId, adminNotes) {
    const [updatedCourt] = await db.update(courts).set({
      approvalStatus: "rejected",
      adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(courts.id, courtId)).returning();
    return updatedCourt;
  }
  async adminDeleteCourt(courtId) {
    try {
      await db.delete(bookings).where(eq(bookings.courtId, courtId));
      await db.delete(equipment).where(eq(equipment.courtId, courtId));
      const result = await db.delete(courts).where(eq(courts.id, courtId));
      return true;
    } catch (error) {
      console.error("Error deleting court:", error);
      return false;
    }
  }
  // Admin: Get all courts with full details (including pending/rejected)
  async getAllCourtsWithDetails() {
    const query = db.select().from(courts).leftJoin(users, eq(courts.vendorId, users.id)).leftJoin(equipment, eq(courts.id, equipment.courtId));
    const results = await query.orderBy(desc(courts.createdAt));
    const courtMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.courts) continue;
      const courtId = row.courts.id;
      if (!courtMap.has(courtId)) {
        courtMap.set(courtId, {
          ...row.courts,
          vendor: row.users,
          equipment: []
        });
      }
      if (row.equipment) {
        courtMap.get(courtId).equipment.push(row.equipment);
      }
    }
    return Array.from(courtMap.values());
  }
  // Admin: Set commission rate for a specific court
  async setCourtCommission(id, commissionRate) {
    console.log("Setting commission for court:", id, "rate:", commissionRate);
    const [existingCourt] = await db.select().from(courts).where(eq(courts.id, id));
    if (!existingCourt) {
      console.log("Court not found:", id);
      return void 0;
    }
    const [updatedCourt] = await db.update(courts).set({
      commissionRate: commissionRate.toString(),
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(courts.id, id)).returning();
    console.log("Commission updated successfully:", updatedCourt);
    return updatedCourt;
  }
  async getCourtAnalytics(courtId) {
    const client = await pool.connect();
    try {
      const courtResult = await client.query(
        `SELECT c.*, u.first_name, u.last_name, u.email as vendor_email
         FROM courts c 
         LEFT JOIN users u ON c.vendor_id = u.id 
         WHERE c.id = $1`,
        [courtId]
      );
      if (courtResult.rows.length === 0) {
        throw new Error("Court not found");
      }
      const court = courtResult.rows[0];
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
      const commissionRate = parseFloat(court.commission_rate || "15") / 100;
      const totalRevenue = parseFloat(stats.total_revenue || "0");
      const commissionEarned = totalRevenue * commissionRate;
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
      const trendData = recentTrends.rows.reduce((acc, row) => {
        acc[row.period] = {
          bookings: parseInt(row.booking_count),
          revenue: parseFloat(row.revenue || "0")
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
          sport: court.available_sports?.[0] || "Unknown",
          hourlyRate: parseFloat(court.hourly_rate || "0"),
          peakHourRate: parseFloat(court.peak_hour_rate || "0"),
          commissionRate: parseFloat(court.commission_rate || "15"),
          vendor: {
            name: `${court.first_name || ""} ${court.last_name || ""}`.trim() || court.vendor_email,
            email: court.vendor_email
          }
        },
        financial: {
          totalRevenue,
          commissionEarned,
          averageBookingValue: parseFloat(stats.avg_booking_value || "0"),
          vendorEarnings: totalRevenue - commissionEarned
        },
        bookings: {
          total: parseInt(stats.total_bookings || "0"),
          confirmed: parseInt(stats.confirmed_bookings || "0"),
          cancelled: parseInt(stats.cancelled_bookings || "0"),
          completed: parseInt(stats.completed_bookings || "0"),
          firstBookingDate: stats.first_booking_date,
          lastBookingDate: stats.last_booking_date
        },
        trends: {
          monthlyData: monthlyTrends.rows.map((row) => ({
            month: row.month,
            bookings: parseInt(row.bookings_count),
            revenue: parseFloat(row.monthly_revenue || "0")
          })),
          recentBookingTrend: bookingTrend,
          recentRevenueTrend: revenueTrend,
          trendDirection: bookingTrend > 0 ? "growing" : bookingTrend < 0 ? "declining" : "stable"
        }
      };
    } catch (error) {
      console.error("Error fetching court analytics:", error);
      throw error;
    } finally {
      client.release();
    }
  }
  async getAllCourtsAnalyticsOverview() {
    const client = await pool.connect();
    try {
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
      return overviewResult.rows.map((row) => {
        const totalRevenue = parseFloat(row.total_revenue || "0");
        const commissionRate = parseFloat(row.commission_rate || "15") / 100;
        const commissionEarned = totalRevenue * commissionRate;
        const bookingTrend = parseInt(row.recent_bookings || "0") - parseInt(row.previous_bookings || "0");
        return {
          id: row.id,
          name: row.name,
          location: `${row.city}, ${row.area}`,
          sport: row.available_sports?.[0] || "Unknown",
          vendor: {
            name: `${row.first_name || ""} ${row.last_name || ""}`.trim() || row.vendor_email,
            email: row.vendor_email
          },
          financial: {
            totalRevenue,
            commissionEarned,
            vendorEarnings: totalRevenue - commissionEarned,
            hourlyRate: parseFloat(row.hourly_rate || "0"),
            commissionRate: parseFloat(row.commission_rate || "15")
          },
          performance: {
            totalBookings: parseInt(row.total_bookings || "0"),
            averageBookingValue: parseFloat(row.avg_booking_value || "0"),
            recentBookings: parseInt(row.recent_bookings || "0"),
            previousBookings: parseInt(row.previous_bookings || "0"),
            bookingTrend,
            trendDirection: bookingTrend > 0 ? "growing" : bookingTrend < 0 ? "declining" : "stable"
          }
        };
      });
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      throw error;
    } finally {
      client.release();
    }
  }
  // Notification operations
  async createNotification(notificationData) {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }
  async getUserNotifications(userId, limit = 20, offset = 0) {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
  }
  async markNotificationAsRead(notificationId, userId) {
    await db.update(notifications).set({ isRead: true }).where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
  }
  async markAllNotificationsAsRead(userId) {
    await db.update(notifications).set({ isRead: true }).where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
  }
  async getUnreadNotificationCount(userId) {
    const result = await db.select().from(notifications).where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ));
    return result.length;
  }
  async deleteNotification(notificationId, userId) {
    await db.delete(notifications).where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));
  }
  // Notification preferences operations
  async getUserNotificationPreferences(userId) {
    const [prefs] = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
    return prefs;
  }
  async createUserNotificationPreferences(preferencesData) {
    const [prefs] = await db.insert(userNotificationPreferences).values(preferencesData).returning();
    return prefs;
  }
  async updateUserNotificationPreferences(userId, preferences) {
    await db.update(userNotificationPreferences).set(preferences).where(eq(userNotificationPreferences.userId, userId));
  }
  // Court reviews operations
  async getCourtReviews(courtId) {
    const results = await db.select().from(reviews).innerJoin(users, eq(reviews.customerId, users.id)).where(and(
      eq(reviews.courtId, courtId),
      eq(reviews.isVisible, true)
    )).orderBy(desc(reviews.createdAt));
    return results.map((result) => ({
      ...result.reviews,
      customer: result.users
    }));
  }
  // ===========================================
  // FIREFLIES EVENT OPERATIONS IMPLEMENTATIONS
  // ===========================================
  // Venue operations
  async getVenues(filters) {
    let whereConditions = [eq(venues.isActive, true), eq(venues.approvalStatus, "approved")];
    if (filters?.city) {
      whereConditions.push(eq(venues.city, filters.city));
    }
    if (filters?.search) {
      whereConditions.push(sql2`(
        ${venues.name} ILIKE ${`%${filters.search}%`} OR
        ${venues.area} ILIKE ${`%${filters.search}%`} OR
        ${venues.address} ILIKE ${`%${filters.search}%`}
      )`);
    }
    const results = await db.select().from(venues).leftJoin(users, eq(venues.vendorId, users.id)).leftJoin(events, eq(events.venueId, venues.id)).where(and(...whereConditions));
    const venuesMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.venues) continue;
      let venue = venuesMap.get(row.venues.id);
      if (!venue) {
        venue = {
          ...row.venues,
          vendor: row.users,
          events: []
        };
        venuesMap.set(row.venues.id, venue);
      }
      if (row.events) {
        venue.events.push(row.events);
      }
    }
    return Array.from(venuesMap.values());
  }
  async getVenueById(id) {
    const results = await db.select().from(venues).leftJoin(users, eq(venues.vendorId, users.id)).leftJoin(events, eq(events.venueId, venues.id)).where(eq(venues.id, id));
    if (results.length === 0 || !results[0].venues) return void 0;
    const venue = {
      ...results[0].venues,
      vendor: results[0].users,
      events: results.filter((r) => r.events).map((r) => r.events)
    };
    return venue;
  }
  async getVenuesByVendor(vendorId) {
    const results = await db.select().from(venues).leftJoin(users, eq(venues.vendorId, users.id)).leftJoin(events, eq(events.venueId, venues.id)).where(eq(venues.vendorId, vendorId));
    const venuesMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.venues) continue;
      let venue = venuesMap.get(row.venues.id);
      if (!venue) {
        venue = {
          ...row.venues,
          vendor: row.users,
          events: []
        };
        venuesMap.set(row.venues.id, venue);
      }
      if (row.events) {
        venue.events.push(row.events);
      }
    }
    return Array.from(venuesMap.values());
  }
  async createVenue(vendorId, venueData) {
    const [venue] = await db.insert(venues).values({ ...venueData, vendorId }).returning();
    return venue;
  }
  async updateVenue(id, vendorId, venueData) {
    const [venue] = await db.update(venues).set({ ...venueData, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(venues.id, id), eq(venues.vendorId, vendorId))).returning();
    return venue;
  }
  async deleteVenue(id, vendorId) {
    const result = await db.delete(venues).where(and(eq(venues.id, id), eq(venues.vendorId, vendorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Event operations
  async getEvents(filters) {
    let whereConditions = [eq(events.isActive, true), eq(events.approvalStatus, "approved")];
    if (filters?.city) {
      whereConditions.push(sql2`${venues.city} = ${filters.city}`);
    }
    if (filters?.category && filters.category !== "All Categories") {
      whereConditions.push(eq(events.category, filters.category));
    }
    if (filters?.search) {
      whereConditions.push(sql2`(
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
    const results = await db.select().from(events).leftJoin(users, eq(events.vendorId, users.id)).leftJoin(venues, eq(events.venueId, venues.id)).leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id)).where(and(...whereConditions)).orderBy(events.eventDate);
    const eventsMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.events) continue;
      let event = eventsMap.get(row.events.id);
      if (!event) {
        event = {
          ...row.events,
          vendor: row.users,
          venue: row.venues,
          ticketTiers: []
        };
        eventsMap.set(row.events.id, event);
      }
      if (row.ticket_tiers) {
        event.ticketTiers.push(row.ticket_tiers);
      }
    }
    return Array.from(eventsMap.values());
  }
  async getEventById(id) {
    const results = await db.select().from(events).leftJoin(users, eq(events.vendorId, users.id)).leftJoin(venues, eq(events.venueId, venues.id)).leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id)).where(eq(events.id, id));
    if (results.length === 0 || !results[0].events) return void 0;
    const event = {
      ...results[0].events,
      vendor: results[0].users,
      venue: results[0].venues,
      ticketTiers: results.filter((r) => r.ticket_tiers).map((r) => r.ticket_tiers)
    };
    return event;
  }
  async getEventsByVendor(vendorId) {
    const results = await db.select().from(events).leftJoin(users, eq(events.vendorId, users.id)).leftJoin(venues, eq(events.venueId, venues.id)).leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id)).where(eq(events.vendorId, vendorId)).orderBy(desc(events.eventDate));
    const eventsMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.events) continue;
      let event = eventsMap.get(row.events.id);
      if (!event) {
        event = {
          ...row.events,
          vendor: row.users,
          venue: row.venues,
          ticketTiers: []
        };
        eventsMap.set(row.events.id, event);
      }
      if (row.ticket_tiers) {
        event.ticketTiers.push(row.ticket_tiers);
      }
    }
    return Array.from(eventsMap.values());
  }
  async createEvent(vendorId, eventData) {
    const [event] = await db.insert(events).values({
      ...eventData,
      vendorId,
      availableSeats: eventData.totalSeats
    }).returning();
    return event;
  }
  async updateEvent(id, vendorId, eventData) {
    const [event] = await db.update(events).set({ ...eventData, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(events.id, id), eq(events.vendorId, vendorId))).returning();
    return event;
  }
  async deleteEvent(id, vendorId) {
    const result = await db.delete(events).where(and(eq(events.id, id), eq(events.vendorId, vendorId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Ticket tier operations
  async getTicketTiersByEvent(eventId) {
    return await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId)).orderBy(ticketTiers.price);
  }
  async createTicketTier(ticketTierData) {
    const [ticketTier] = await db.insert(ticketTiers).values({
      ...ticketTierData,
      availableQuantity: ticketTierData.quantity
    }).returning();
    return ticketTier;
  }
  async updateTicketTier(id, ticketTierData) {
    const [ticketTier] = await db.update(ticketTiers).set({ ...ticketTierData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(ticketTiers.id, id)).returning();
    return ticketTier;
  }
  async deleteTicketTier(id) {
    const result = await db.delete(ticketTiers).where(eq(ticketTiers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  // Event booking operations
  async createEventBooking(bookingData) {
    const [booking] = await db.insert(eventBookings).values(bookingData).returning();
    await db.update(ticketTiers).set({
      availableQuantity: sql2`${ticketTiers.availableQuantity} - ${bookingData.quantity}`
    }).where(eq(ticketTiers.id, bookingData.ticketTierId));
    await db.update(events).set({
      availableSeats: sql2`${events.availableSeats} - ${bookingData.quantity}`,
      totalBookings: sql2`${events.totalBookings} + 1`
    }).where(eq(events.id, bookingData.eventId));
    return booking;
  }
  async getEventBookingsByCustomer(customerId) {
    const results = await db.select().from(eventBookings).leftJoin(users, eq(eventBookings.customerId, users.id)).leftJoin(events, eq(eventBookings.eventId, events.id)).leftJoin(ticketTiers, eq(eventBookings.ticketTierId, ticketTiers.id)).where(eq(eventBookings.customerId, customerId)).orderBy(desc(eventBookings.createdAt));
    return results.map((result) => ({
      ...result.event_bookings,
      customer: result.users,
      event: result.events,
      ticketTier: result.ticket_tiers
    }));
  }
  async getEventBookingsByVendor(vendorId) {
    const results = await db.select().from(eventBookings).leftJoin(users, eq(eventBookings.customerId, users.id)).leftJoin(events, eq(eventBookings.eventId, events.id)).leftJoin(ticketTiers, eq(eventBookings.ticketTierId, ticketTiers.id)).where(eq(events.vendorId, vendorId)).orderBy(desc(eventBookings.createdAt));
    return results.map((result) => ({
      ...result.event_bookings,
      customer: result.users,
      event: result.events,
      ticketTier: result.ticket_tiers
    }));
  }
  async getEventBookingById(id) {
    const results = await db.select().from(eventBookings).leftJoin(users, eq(eventBookings.customerId, users.id)).leftJoin(events, eq(eventBookings.eventId, events.id)).leftJoin(ticketTiers, eq(eventBookings.ticketTierId, ticketTiers.id)).where(eq(eventBookings.id, id));
    if (results.length === 0) return void 0;
    const result = results[0];
    return {
      ...result.event_bookings,
      customer: result.users,
      event: result.events,
      ticketTier: result.ticket_tiers
    };
  }
  async updateEventBookingStatus(id, status) {
    const [booking] = await db.update(eventBookings).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(eventBookings.id, id)).returning();
    return booking;
  }
  async getEventBooking(id) {
    const [booking] = await db.select().from(eventBookings).where(eq(eventBookings.id, id));
    return booking;
  }
  async updateEventBookingPayment(id, data) {
    const [updatedBooking] = await db.update(eventBookings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(eventBookings.id, id)).returning();
    return updatedBooking;
  }
  async getEventBookingByCheckoutRequestId(checkoutRequestId) {
    const [booking] = await db.select().from(eventBookings).where(eq(eventBookings.mpesaCheckoutRequestId, checkoutRequestId));
    return booking;
  }
  // Event admin operations
  async getPendingVenues() {
    const results = await db.select().from(venues).leftJoin(users, eq(venues.vendorId, users.id)).leftJoin(events, eq(events.venueId, venues.id)).where(eq(venues.approvalStatus, "pending")).orderBy(desc(venues.createdAt));
    const venuesMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.venues) continue;
      let venue = venuesMap.get(row.venues.id);
      if (!venue) {
        venue = {
          ...row.venues,
          vendor: row.users,
          events: []
        };
        venuesMap.set(row.venues.id, venue);
      }
      if (row.events) {
        venue.events.push(row.events);
      }
    }
    return Array.from(venuesMap.values());
  }
  async getPendingEvents() {
    const results = await db.select().from(events).leftJoin(users, eq(events.vendorId, users.id)).leftJoin(venues, eq(events.venueId, venues.id)).leftJoin(ticketTiers, eq(ticketTiers.eventId, events.id)).where(eq(events.approvalStatus, "pending")).orderBy(desc(events.createdAt));
    const eventsMap = /* @__PURE__ */ new Map();
    for (const row of results) {
      if (!row.events) continue;
      let event = eventsMap.get(row.events.id);
      if (!event) {
        event = {
          ...row.events,
          vendor: row.users,
          venue: row.venues,
          ticketTiers: []
        };
        eventsMap.set(row.events.id, event);
      }
      if (row.ticket_tiers) {
        event.ticketTiers.push(row.ticket_tiers);
      }
    }
    return Array.from(eventsMap.values());
  }
  async approveVenue(venueId, adminNotes) {
    const [venue] = await db.update(venues).set({
      approvalStatus: "approved",
      adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(venues.id, venueId)).returning();
    return venue;
  }
  async rejectVenue(venueId, adminNotes) {
    const [venue] = await db.update(venues).set({
      approvalStatus: "rejected",
      adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(venues.id, venueId)).returning();
    return venue;
  }
  async approveEvent(eventId, adminNotes) {
    const [event] = await db.update(events).set({
      approvalStatus: "approved",
      adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(events.id, eventId)).returning();
    return event;
  }
  async rejectEvent(eventId, adminNotes) {
    const [event] = await db.update(events).set({
      approvalStatus: "rejected",
      adminNotes,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(events.id, eventId)).returning();
    return event;
  }
  // Seat map operations
  async createSeatSection(seatSection) {
    const [section] = await db.insert(seatSections).values(seatSection).returning();
    return section;
  }
  async getSeatSectionsByVenue(venueId) {
    return await db.select().from(seatSections).where(eq(seatSections.venueId, venueId));
  }
  async updateSeatSection(id, seatSection) {
    const [section] = await db.update(seatSections).set({ ...seatSection, updatedAt: /* @__PURE__ */ new Date() }).where(eq(seatSections.id, id)).returning();
    return section;
  }
  async deleteSeatSection(id) {
    const result = await db.delete(seatSections).where(eq(seatSections.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async createSeat(seat) {
    const [newSeat] = await db.insert(seats).values(seat).returning();
    await db.execute(sql2`
      UPDATE seat_sections 
      SET seat_count = (SELECT COUNT(*) FROM seats WHERE section_id = ${seat.sectionId})
      WHERE id = ${seat.sectionId}
    `);
    return newSeat;
  }
  async getSeatsByVenue(venueId) {
    const result = await db.select().from(seats).leftJoin(seatSections, eq(seats.sectionId, seatSections.id)).where(eq(seats.venueId, venueId));
    return result.map((row) => ({
      ...row.seats,
      section: row.seat_sections
    }));
  }
  async getSeatsBySection(sectionId) {
    return await db.select().from(seats).where(eq(seats.sectionId, sectionId));
  }
  async updateSeat(id, seat) {
    const [updatedSeat] = await db.update(seats).set({ ...seat, updatedAt: /* @__PURE__ */ new Date() }).where(eq(seats.id, id)).returning();
    return updatedSeat;
  }
  async deleteSeat(id) {
    const [seat] = await db.select().from(seats).where(eq(seats.id, id));
    if (!seat) return false;
    const result = await db.delete(seats).where(eq(seats.id, id));
    await db.execute(sql2`
      UPDATE seat_sections 
      SET seat_count = (SELECT COUNT(*) FROM seats WHERE section_id = ${seat.sectionId})
      WHERE id = ${seat.sectionId}
    `);
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async bulkCreateSeats(seatsList) {
    if (seatsList.length === 0) return [];
    const createdSeats = await db.insert(seats).values(seatsList).returning();
    const sectionIds = Array.from(new Set(seatsList.map((s) => s.sectionId)));
    for (const sectionId of sectionIds) {
      await db.execute(sql2`
        UPDATE seat_sections 
        SET seat_count = (SELECT COUNT(*) FROM seats WHERE section_id = ${sectionId})
        WHERE id = ${sectionId}
      `);
    }
    return createdSeats;
  }
  async getEventSeatAvailability(eventId) {
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    if (!event) return [];
    const seatsWithSections = await db.select().from(seats).leftJoin(seatSections, eq(seats.sectionId, seatSections.id)).where(eq(seats.venueId, event.venueId));
    const reservations = await db.select().from(eventSeatReservations).where(eq(eventSeatReservations.eventId, eventId));
    const reservationMap = new Map(reservations.map((r) => [r.seatId, r]));
    return seatsWithSections.map((row) => {
      const reservation = reservationMap.get(row.seats.id);
      const section = row.seat_sections;
      const seat = row.seats;
      const price = seat.priceOverride ? parseFloat(seat.priceOverride) : parseFloat(section.basePrice);
      return {
        seat,
        section,
        status: reservation?.status || "available",
        reservedUntil: reservation?.reservedUntil || void 0,
        price
      };
    });
  }
  async reserveEventSeats(eventId, seatIds, bookingId) {
    const reservedUntil = new Date(Date.now() + 15 * 60 * 1e3);
    const reservations = seatIds.map((seatId) => ({
      eventId,
      seatId,
      eventBookingId: bookingId || null,
      status: "reserved",
      reservedUntil
    }));
    return await db.insert(eventSeatReservations).values(reservations).returning();
  }
  async releaseExpiredReservations(eventId) {
    await db.delete(eventSeatReservations).where(
      and(
        eq(eventSeatReservations.eventId, eventId),
        eq(eventSeatReservations.status, "reserved"),
        lte(eventSeatReservations.reservedUntil, /* @__PURE__ */ new Date())
      )
    );
  }
  async markSeatsAsBooked(eventId, seatIds, bookingId) {
    for (const seatId of seatIds) {
      await db.update(eventSeatReservations).set({
        status: "booked",
        eventBookingId: bookingId,
        reservedUntil: null
      }).where(
        and(
          eq(eventSeatReservations.eventId, eventId),
          eq(eventSeatReservations.seatId, seatId)
        )
      );
    }
  }
};
var storage = new DatabaseStorage();

// server/googleAuth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPg from "connect-pg-simple";
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "none"
    }
  });
}
function setupGoogleAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not provided.");
    return;
  }
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "https://fireflies-production-ba72.up.railway.app/api/auth/google/callback";
  console.log("Google OAuth callback URL:", callbackURL);
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || "";
        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profileImageUrl = profile.photos?.[0]?.value || "";
        let user = await storage.getUserByEmail(email);
        if (!user) {
          user = await storage.upsertUser({
            id: profile.id,
            email,
            firstName,
            lastName,
            profileImageUrl,
            userType: "customer"
          });
        } else {
          user = await storage.upsertUser({
            ...user,
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            profileImageUrl: profileImageUrl || user.profileImageUrl
          });
        }
        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, void 0);
      }
    }
  ));
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get(
    "/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );
  app2.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
    (req, res) => {
      res.redirect("/");
    }
  );
  app2.get("/api/login", (req, res) => {
    res.redirect("/api/auth/google");
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  if (req.session?.adminAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

// server/routes.ts
init_objectStorage();
init_objectAcl();
init_schema();

// server/enhancedNotificationService.ts
init_schema();

// server/emailService.ts
import { Resend } from "resend";
async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  return {
    client: new Resend(apiKey),
    fromEmail: process.env.RESEND_FROM_EMAIL || "hello@sportsbox.in"
  };
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || "hello@sportsbox.in"
  };
}
var EmailService = class {
  static fromName = "SportsBox Kenya";
  static async sendEmail(template) {
    try {
      const { client, fromEmail: fromEmail2 } = await getResendClient();
      const { data, error } = await client.emails.send({
        from: `${this.fromName} <${fromEmail2}>`,
        to: template.to,
        subject: template.subject,
        html: template.html,
        text: template.text || this.stripHtml(template.html)
      });
      if (error) {
        console.error("Email sending failed:", error);
        return false;
      }
      console.log("Email sent successfully to:", template.to, "ID:", data?.id);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }
  static async sendBookingConfirmation(params) {
    const template = {
      to: params.customerEmail,
      subject: `Booking Confirmed - ${params.courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Booking Confirmed!</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>Your court booking has been confirmed! Here are your booking details:</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">Booking Details</h4>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Total Amount:</strong> KES ${params.totalAmount}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            
            <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #0277bd; margin-top: 0;">Important Reminders</h4>
              <ul>
                <li>Please arrive 15 minutes before your booking time</li>
                <li>Bring valid ID for verification</li>
                <li>Cancellations must be made at least 2 hours before your booking time</li>
                <li>Contact the venue directly for any special requirements</li>
              </ul>
            </div>
            
            <p>Thank you for choosing SportsBox Kenya! Enjoy your game!</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View My Bookings</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Your Premier Sports Court Booking Platform</p>
            <p>Email: info@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendVendorCourtApproval(params) {
    const isApproved = params.approvalStatus === "approved";
    const template = {
      to: params.vendorEmail,
      subject: `Court ${isApproved ? "Approved" : "Update Required"} - ${params.courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${isApproved ? "#16a34a" : "#dc2626"}; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Court ${isApproved ? "Approved" : "Update Required"}</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            
            ${isApproved ? `
              <p>Great news! Your court "${params.courtName}" has been approved and is now live on SportsBox Kenya.</p>
              
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #16a34a; margin-top: 0;">Your Court is Now Live!</h4>
                <p>Customers can now discover and book your court. You can:</p>
                <ul>
                  <li>Monitor bookings through your vendor dashboard</li>
                  <li>Update court details and pricing</li>
                  <li>Manage equipment rentals</li>
                  <li>Track revenue and analytics</li>
                </ul>
              </div>
            ` : `
              <p>Your court "${params.courtName}" requires some updates before it can be approved.</p>
              
              <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #dc2626; margin-top: 0;">Required Updates</h4>
                <p><strong>Reason:</strong> ${params.rejectionReason || "Please review court details and ensure all required information is provided."}</p>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #d97706; margin-top: 0;">Next Steps</h4>
                <ul>
                  <li>Log into your vendor dashboard</li>
                  <li>Update your court information</li>
                  <li>Resubmit for approval</li>
                  <li>Our team will review within 24 hours</li>
                </ul>
              </div>
            `}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke/vendor" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Vendor Dashboard</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Empowering Sports Venue Owners</p>
            <p>Email: vendor@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendBookingReminder(params) {
    const template = {
      to: params.customerEmail,
      subject: `Booking Reminder - Tomorrow at ${params.startTime}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Booking Reminder</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>This is a friendly reminder about your upcoming court booking!</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2563eb; margin-top: 0;">Tomorrow's Booking</h4>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #d97706; margin-top: 0;">Don't Forget!</h4>
              <ul>
                <li>Arrive 15 minutes early</li>
                <li>Bring your ID and booking confirmation</li>
                <li>Check weather conditions for outdoor courts</li>
                <li>Contact venue for any questions</li>
              </ul>
            </div>
            
            <p>Looking forward to your game! Have a great time at ${params.courtName}.</p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Your Game, Our Courts</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendPaymentConfirmation(params) {
    const template = {
      to: params.customerEmail,
      subject: `Payment Confirmed - KES ${params.amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Payment Confirmed</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>Your payment has been successfully processed!</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">Payment Details</h4>
              <p><strong>Amount:</strong> KES ${params.amount}</p>
              <p><strong>Transaction ID:</strong> ${params.transactionId}</p>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Payment Method:</strong> M-Pesa</p>
            </div>
            
            <p>Your booking is now confirmed. You'll receive a separate booking confirmation email shortly.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Receipt</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Secure Payments, Great Games</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendNewVendorAlertToAdmin(params) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("ADMIN_EMAIL not set, skipping admin notification");
      return false;
    }
    const template = {
      to: adminEmail,
      subject: `New Vendor Application - ${params.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>New Vendor Application</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello Admin,</h3>
            <p>A new vendor has submitted an onboarding application and is waiting for your approval.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2563eb; margin-top: 0;">Vendor Details</h4>
              <p><strong>Name:</strong> ${params.vendorName}</p>
              <p><strong>Business Name:</strong> ${params.businessName}</p>
              <p><strong>Email:</strong> ${params.vendorEmail}</p>
            </div>
            
            <p>Please review this application in the admin dashboard at your earliest convenience.</p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke/admin" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Admin Dashboard</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Admin Notification</p>
            <p>Email: admin@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendVendorApplicationReceived(params) {
    const template = {
      to: params.vendorEmail,
      subject: `Application Received - ${params.businessName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Application Received</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>Thank you for submitting your vendor application for <strong>${params.businessName}</strong>!</p>
            
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">What Happens Next?</h4>
              <ul>
                <li>Our team will review your application</li>
                <li>You will receive an email once a decision has been made</li>
                <li>Review typically takes 1-2 business days</li>
              </ul>
            </div>
            
            <p>If you have any questions in the meantime, feel free to reach out to our support team.</p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Empowering Sports Venue Owners</p>
            <p>Email: vendor@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendVendorApproved(params) {
    const template = {
      to: params.vendorEmail,
      subject: `Account Approved - Welcome to SportsBox Kenya!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #16a34a; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Account Approved!</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>Great news! Your vendor account has been approved. You can now list your venues on SportsBox Kenya.</p>
            
            <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #16a34a; margin-top: 0;">Get Started</h4>
              <ul>
                <li>Log into your vendor dashboard</li>
                <li>Add your courts and venues</li>
                <li>Set pricing and availability</li>
                <li>Start receiving bookings</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke/vendor" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Vendor Dashboard</a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Empowering Sports Venue Owners</p>
            <p>Email: vendor@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendVendorRejected(params) {
    const template = {
      to: params.vendorEmail,
      subject: `Vendor Application Update - SportsBox Kenya`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Application Not Approved</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>We regret to inform you that your vendor application has not been approved at this time.</p>
            
            ${params.reason ? `
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin-top: 0;">Reason</h4>
              <p>${params.reason}</p>
            </div>
            ` : ""}
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #d97706; margin-top: 0;">What You Can Do</h4>
              <ul>
                <li>Review the feedback provided above</li>
                <li>Update your application details</li>
                <li>Contact our support team for more information</li>
                <li>Reapply once the issues have been addressed</li>
              </ul>
            </div>
            
            <p>If you believe this decision was made in error or have questions, please contact our support team.</p>
          </div>
          
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Empowering Sports Venue Owners</p>
            <p>Email: vendor@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendBookingCancellationCustomer(params) {
    const template = {
      to: params.customerEmail,
      subject: `Booking Cancelled - ${params.courtName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Booking Cancelled</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.customerName},</h3>
            <p>Your booking has been successfully cancelled. Here are the details of the cancelled booking:</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin-top: 0;">Cancelled Booking</h4>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Amount Paid:</strong> KES ${params.totalAmount}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #92400e; margin-top: 0;">Refund Information</h4>
              <p>Refunds are processed manually within <strong>3\u20135 business days</strong> via M-Pesa reversal to the number used during payment. If you have not received your refund after 5 business days, please contact us at <strong>info@sportsbox.co.ke</strong>.</p>
            </div>
            <p>We hope to see you back on the court soon!</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://sportsbox.co.ke" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Browse Courts</a>
            </div>
          </div>
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Your Premier Sports Court Booking Platform</p>
            <p>Email: info@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static async sendBookingCancellationVendor(params) {
    const template = {
      to: params.vendorEmail,
      subject: `Booking Cancelled - ${params.courtName} on ${params.bookingDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>\u{1F3C0} SportsBox Kenya</h1>
            <h2>Booking Cancelled by Customer</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h3>Hello ${params.vendorName},</h3>
            <p>A customer has cancelled their booking for <strong>${params.courtName}</strong>. The time slot is now available again.</p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #dc2626; margin-top: 0;">Cancelled Booking Details</h4>
              <p><strong>Customer:</strong> ${params.customerName}</p>
              <p><strong>Court:</strong> ${params.courtName}</p>
              <p><strong>Date:</strong> ${params.bookingDate}</p>
              <p><strong>Time:</strong> ${params.startTime} - ${params.endTime}</p>
              <p><strong>Amount:</strong> KES ${params.totalAmount}</p>
              <p><strong>Booking ID:</strong> ${params.bookingId}</p>
            </div>
            <p>Please log in to your vendor dashboard to view your updated bookings.</p>
          </div>
          <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 14px;">
            <p>SportsBox Kenya - Empowering Sports Venue Owners</p>
            <p>Email: vendor@sportsbox.co.ke | Phone: +254 700 000 000</p>
          </div>
        </div>
      `
    };
    return this.sendEmail(template);
  }
  static stripHtml(html) {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
};

// server/smsService.ts
var SMSService = class {
  static apiKey = process.env.SMS_API_KEY;
  static username = process.env.SMS_USERNAME || "SportsBox";
  static shortCode = process.env.SMS_SHORTCODE || "SPORTSBOX";
  static async sendSMS(params) {
    try {
      console.log("=== SMS NOTIFICATION ===");
      console.log("To:", params.to);
      console.log("Message:", params.message);
      console.log("========================");
      return true;
    } catch (error) {
      console.error("SMS sending failed:", error);
      return false;
    }
  }
  static async sendBookingConfirmationSMS(params) {
    const message = `Hi ${params.customerName}! Your ${params.courtName} booking is confirmed for ${params.bookingDate} at ${params.startTime}. Booking ID: ${params.bookingId}. Arrive 15min early. - SportsBox Kenya`;
    return this.sendSMS({
      to: params.customerPhone,
      message
    });
  }
  static async sendBookingReminderSMS(params) {
    const message = `Reminder: ${params.customerName}, your ${params.courtName} booking is tomorrow ${params.bookingDate} at ${params.startTime}. Don't forget your ID! - SportsBox Kenya`;
    return this.sendSMS({
      to: params.customerPhone,
      message
    });
  }
  static async sendPaymentConfirmationSMS(params) {
    const message = `Payment confirmed! KES ${params.amount} received. Transaction: ${params.transactionId}. Your booking is now active. - SportsBox Kenya`;
    return this.sendSMS({
      to: params.customerPhone,
      message
    });
  }
  static async sendCourtApprovalSMS(params) {
    const message = params.approved ? `Great news ${params.vendorName}! Your court "${params.courtName}" is now live on SportsBox. Start receiving bookings today! - SportsBox Kenya` : `Hi ${params.vendorName}, your court "${params.courtName}" needs updates. Check your vendor dashboard for details. - SportsBox Kenya`;
    return this.sendSMS({
      to: params.vendorPhone,
      message
    });
  }
  static formatKenyanPhone(phone) {
    let formatted = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    if (formatted.startsWith("0")) {
      formatted = "+254" + formatted.substring(1);
    } else if (formatted.startsWith("254")) {
      formatted = "+" + formatted;
    } else if (!formatted.startsWith("+254")) {
      formatted = "+254" + formatted;
    }
    return formatted;
  }
  static isValidKenyanPhone(phone) {
    const formatted = this.formatKenyanPhone(phone);
    return /^\+254[17]\d{8}$/.test(formatted);
  }
};

// server/enhancedNotificationService.ts
import { eq as eq2, desc as desc2, and as and2, count } from "drizzle-orm";
var EnhancedNotificationService = class {
  // Create in-app notification
  static async createInAppNotification(data) {
    try {
      const [notification] = await db.insert(notifications).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.metadata || {},
        isRead: false,
        createdAt: /* @__PURE__ */ new Date()
      }).returning();
      return notification;
    } catch (error) {
      console.error("Error creating in-app notification:", error);
      throw error;
    }
  }
  // Send complete booking confirmation (in-app + email + SMS)
  static async sendBookingConfirmation(params) {
    try {
      console.log("\u{1F514} Sending comprehensive booking confirmation for:", params.bookingId);
      await this.createInAppNotification({
        userId: params.customerId,
        type: "booking_confirmed",
        title: "\u{1F3BE} Booking Confirmed!",
        message: `Your booking for ${params.courtName} on ${params.bookingDate} at ${params.startTime} has been confirmed.`,
        metadata: {
          bookingId: params.bookingId,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime,
          endTime: params.endTime,
          totalAmount: params.totalAmount,
          equipmentRented: params.equipmentRented
        }
      });
      const emailSent = await EmailService.sendBookingConfirmation({
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        courtName: params.courtName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        endTime: params.endTime,
        totalAmount: params.totalAmount,
        bookingId: params.bookingId
      });
      let smsSent = true;
      if (params.customerPhone && SMSService.isValidKenyanPhone(params.customerPhone)) {
        smsSent = await SMSService.sendBookingConfirmationSMS({
          customerPhone: SMSService.formatKenyanPhone(params.customerPhone),
          customerName: params.customerName,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime,
          bookingId: params.bookingId
        });
      }
      console.log("\u2705 Booking confirmation sent - Email:", emailSent, "SMS:", smsSent);
      return {
        inAppCreated: true,
        emailSent,
        smsSent,
        totalChannels: 1 + (emailSent ? 1 : 0) + (smsSent ? 1 : 0)
      };
    } catch (error) {
      console.error("\u274C Error sending booking confirmation:", error);
      throw error;
    }
  }
  // Send payment confirmation across all channels
  static async sendPaymentConfirmation(params) {
    try {
      console.log("\u{1F4B0} Sending payment confirmation for transaction:", params.transactionId);
      await this.createInAppNotification({
        userId: params.customerId,
        type: "payment_received",
        title: "\u{1F4B0} Payment Confirmed",
        message: `Your payment of KES ${params.amount} has been confirmed. Transaction ID: ${params.transactionId}`,
        metadata: {
          amount: params.amount,
          transactionId: params.transactionId,
          paymentMethod: params.paymentMethod,
          courtName: params.courtName,
          bookingDate: params.bookingDate
        }
      });
      const emailSent = await EmailService.sendPaymentConfirmation({
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        amount: params.amount,
        transactionId: params.transactionId,
        courtName: params.courtName,
        bookingDate: params.bookingDate
      });
      let smsSent = true;
      if (params.customerPhone && SMSService.isValidKenyanPhone(params.customerPhone)) {
        smsSent = await SMSService.sendPaymentConfirmationSMS({
          customerPhone: SMSService.formatKenyanPhone(params.customerPhone),
          amount: params.amount,
          transactionId: params.transactionId
        });
      }
      console.log("\u2705 Payment confirmation sent - Email:", emailSent, "SMS:", smsSent);
      return { inAppCreated: true, emailSent, smsSent };
    } catch (error) {
      console.error("\u274C Error sending payment confirmation:", error);
      throw error;
    }
  }
  // Send court approval/rejection notification
  static async sendCourtApprovalNotification(params) {
    try {
      console.log("\u{1F3E2} Sending court approval notification for:", params.courtName);
      await this.createInAppNotification({
        userId: params.vendorId,
        type: params.approved ? "court_approved" : "court_rejected",
        title: params.approved ? "\u{1F389} Court Approved!" : "\u26A0\uFE0F Court Update Required",
        message: params.approved ? `Your court "${params.courtName}" has been approved and is now live!` : `Your court "${params.courtName}" requires updates. ${params.rejectionReason || "Please review the details."}`,
        metadata: {
          courtName: params.courtName,
          approved: params.approved,
          rejectionReason: params.rejectionReason
        }
      });
      const emailSent = await EmailService.sendVendorCourtApproval({
        vendorEmail: params.vendorEmail,
        vendorName: params.vendorName,
        courtName: params.courtName,
        approvalStatus: params.approved ? "approved" : "rejected",
        rejectionReason: params.rejectionReason
      });
      let smsSent = true;
      if (params.vendorPhone && SMSService.isValidKenyanPhone(params.vendorPhone)) {
        smsSent = await SMSService.sendCourtApprovalSMS({
          vendorPhone: SMSService.formatKenyanPhone(params.vendorPhone),
          vendorName: params.vendorName,
          courtName: params.courtName,
          approved: params.approved
        });
      }
      console.log("\u2705 Court approval notification sent - Email:", emailSent, "SMS:", smsSent);
      return { inAppCreated: true, emailSent, smsSent };
    } catch (error) {
      console.error("\u274C Error sending court approval notification:", error);
      throw error;
    }
  }
  // Send booking reminder
  static async sendBookingReminder(params) {
    try {
      console.log("\u23F0 Sending booking reminder for booking:", params.bookingId);
      await this.createInAppNotification({
        userId: params.customerId,
        type: "booking_reminder",
        title: "\u23F0 Booking Reminder",
        message: `Don't forget! Your booking at ${params.courtName} is tomorrow at ${params.startTime}.`,
        metadata: {
          bookingId: params.bookingId,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime
        }
      });
      const emailSent = await EmailService.sendBookingReminder({
        customerEmail: params.customerEmail,
        customerName: params.customerName,
        courtName: params.courtName,
        bookingDate: params.bookingDate,
        startTime: params.startTime,
        endTime: params.endTime,
        bookingId: params.bookingId
      });
      let smsSent = true;
      if (params.customerPhone && SMSService.isValidKenyanPhone(params.customerPhone)) {
        smsSent = await SMSService.sendBookingReminderSMS({
          customerPhone: SMSService.formatKenyanPhone(params.customerPhone),
          customerName: params.customerName,
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          startTime: params.startTime
        });
      }
      console.log("\u2705 Booking reminder sent - Email:", emailSent, "SMS:", smsSent);
      return { inAppCreated: true, emailSent, smsSent };
    } catch (error) {
      console.error("\u274C Error sending booking reminder:", error);
      throw error;
    }
  }
  // Send vendor earnings notification
  static async sendVendorEarningsNotification(params) {
    try {
      console.log("\u{1F4B8} Sending vendor earnings notification");
      await this.createInAppNotification({
        userId: params.vendorId,
        type: "vendor_earnings",
        title: "\u{1F4B8} New Booking Revenue",
        message: `You earned KES ${params.earnings} from ${params.customerName}'s booking at ${params.courtName}`,
        metadata: {
          courtName: params.courtName,
          bookingDate: params.bookingDate,
          customerName: params.customerName,
          earnings: params.earnings,
          commission: params.commission,
          bookingId: params.bookingId
        }
      });
      console.log("\u2705 Vendor earnings notification sent");
      return { inAppCreated: true };
    } catch (error) {
      console.error("\u274C Error sending vendor earnings notification:", error);
      throw error;
    }
  }
  // Get notifications for user
  static async getNotifications(userId) {
    try {
      return await db.select().from(notifications).where(eq2(notifications.userId, userId)).orderBy(desc2(notifications.createdAt)).limit(50);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }
  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      await db.update(notifications).set({ isRead: true }).where(eq2(notifications.id, notificationId));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }
  // Get unread notification count
  static async getUnreadCount(userId) {
    try {
      const result = await db.select({ count: count() }).from(notifications).where(and2(eq2(notifications.userId, userId), eq2(notifications.isRead, false)));
      return result[0]?.count || 0;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }
  // Test notification system
  static async testNotificationSystem(testParams) {
    console.log("\u{1F9EA} Testing notification system...");
    try {
      const emailTest = await EmailService.sendEmail({
        to: testParams.customerEmail,
        subject: "SportsBox Notification Test",
        html: "<h2>Email notifications are working!</h2><p>This is a test from SportsBox Kenya notification system.</p>"
      });
      let smsTest = true;
      if (testParams.customerPhone) {
        smsTest = await SMSService.sendSMS({
          to: SMSService.formatKenyanPhone(testParams.customerPhone),
          message: "Test SMS from SportsBox Kenya. Notifications are working!"
        });
      }
      console.log("\u{1F9EA} Notification test results - Email:", emailTest, "SMS:", smsTest);
      return { emailTest, smsTest };
    } catch (error) {
      console.error("\u274C Notification test failed:", error);
      throw error;
    }
  }
};

// server/mpesaService.ts
import axios from "axios";
import { randomUUID as randomUUID2 } from "crypto";
var SANDBOX_BASE_URL = "https://sandbox.safaricom.co.ke";
var PRODUCTION_BASE_URL = "https://api.safaricom.co.ke";
var isSimulationMode = () => {
  return process.env.MPESA_SIMULATION_MODE === "true";
};
var simulatedPayments = /* @__PURE__ */ new Map();
var getBaseUrl = () => {
  return process.env.MPESA_ENVIRONMENT === "production" ? PRODUCTION_BASE_URL : SANDBOX_BASE_URL;
};
var getTimestamp = () => {
  const date = /* @__PURE__ */ new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};
var generatePassword = (timestamp2) => {
  const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
  const passKey = process.env.MPESA_PASS_KEY;
  const str = `${shortCode}${passKey}${timestamp2}`;
  return Buffer.from(str).toString("base64");
};
var generateSimulatedReceipt = () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const prefix = Array.from({ length: 3 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  const numbers = Math.floor(Math.random() * 1e7).toString().padStart(7, "0");
  const suffix = Array.from({ length: 2 }, () => letters[Math.floor(Math.random() * letters.length)]).join("");
  return `${prefix}${numbers}${suffix}`;
};
var getAccessToken = async () => {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) {
      throw new Error("M-Pesa credentials not configured");
    }
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    console.log("Requesting M-Pesa access token from:", `${getBaseUrl()}/oauth/v1/generate`);
    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    console.log("M-Pesa access token obtained successfully");
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting M-Pesa access token:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`Failed to get M-Pesa access token: ${error.response?.data?.error_description || error.message}`);
  }
};
var formatPhoneNumber = (phone) => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
};
var initiateSTKPush = async (request) => {
  const formattedPhone = formatPhoneNumber(request.phone);
  if (isSimulationMode()) {
    console.log("[SIMULATION] Initiating simulated M-Pesa STK Push:", {
      phone: formattedPhone,
      amount: request.amount
    });
    const checkoutRequestId = `SIM_${randomUUID2().replace(/-/g, "").substring(0, 20)}`;
    const merchantRequestId = `SIM_MR_${randomUUID2().replace(/-/g, "").substring(0, 15)}`;
    simulatedPayments.set(checkoutRequestId, {
      status: "pending",
      amount: request.amount,
      phone: formattedPhone,
      createdAt: /* @__PURE__ */ new Date()
    });
    setTimeout(() => {
      const payment = simulatedPayments.get(checkoutRequestId);
      if (payment && payment.status === "pending") {
        payment.status = "completed";
        console.log("[SIMULATION] Payment auto-completed:", checkoutRequestId);
      }
    }, 3e3);
    return {
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "[SIMULATION] Payment prompt sent to your phone. Enter PIN to confirm."
    };
  }
  try {
    const accessToken = await getAccessToken();
    const timestamp2 = getTimestamp();
    const password = generatePassword(timestamp2);
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    const deployedDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
    const callbackUrl = process.env.MPESA_CALLBACK_URL || (deployedDomain ? `https://${deployedDomain}/api/mpesa/callback` : null);
    if (!shortCode || !callbackUrl) {
      throw new Error("M-Pesa configuration incomplete: Missing shortCode or callbackUrl");
    }
    console.log("M-Pesa callback URL resolved to:", callbackUrl);
    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp2,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(request.amount),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: request.accountReference.slice(0, 12),
      TransactionDesc: request.transactionDesc.slice(0, 13)
    };
    console.log("Initiating M-Pesa STK Push:", {
      phone: formattedPhone,
      amount: request.amount,
      shortCode,
      callbackUrl: callbackUrl.substring(0, 50) + "..."
    });
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("M-Pesa STK Push response:", response.data);
    return response.data;
  } catch (error) {
    console.error("M-Pesa STK Push Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    const errorMessage = error.response?.data?.errorMessage || error.response?.data?.error_description || error.message || "Failed to initiate M-Pesa payment";
    throw new Error(errorMessage);
  }
};
var querySTKPushStatus = async (checkoutRequestId) => {
  if (isSimulationMode() || checkoutRequestId.startsWith("SIM_")) {
    console.log("[SIMULATION] Querying simulated payment status:", checkoutRequestId);
    const payment = simulatedPayments.get(checkoutRequestId);
    if (!payment) {
      return {
        ResponseCode: "0",
        ResponseDescription: "The service request has been accepted successfully",
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: "0",
        ResultDesc: "[SIMULATION] The service request is processed successfully."
      };
    }
    if (payment.status === "completed") {
      return {
        ResponseCode: "0",
        ResponseDescription: "The service request has been accepted successfully",
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: "0",
        ResultDesc: "[SIMULATION] The service request is processed successfully."
      };
    } else if (payment.status === "failed") {
      return {
        ResponseCode: "0",
        ResponseDescription: "The service request has been accepted successfully",
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: "1032",
        ResultDesc: "[SIMULATION] Request cancelled by user"
      };
    } else {
      return {
        ResponseCode: "0",
        ResponseDescription: "The service request has been accepted successfully",
        MerchantRequestID: `SIM_MR_${Date.now()}`,
        CheckoutRequestID: checkoutRequestId,
        ResultCode: "1",
        ResultDesc: "[SIMULATION] The transaction is being processed"
      };
    }
  }
  try {
    const accessToken = await getAccessToken();
    const timestamp2 = getTimestamp();
    const password = generatePassword(timestamp2);
    const shortCode = process.env.MPESA_BUSINESS_SHORT_CODE;
    console.log("Querying M-Pesa STK Push status:", { checkoutRequestId });
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp2,
        CheckoutRequestID: checkoutRequestId
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("M-Pesa STK Query response:", response.data);
    return response.data;
  } catch (error) {
    console.error("M-Pesa STK Query Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`Failed to query M-Pesa payment status: ${error.message}`);
  }
};
var getSimulatedReceiptNumber = (checkoutRequestId) => {
  if (checkoutRequestId.startsWith("SIM_")) {
    const payment = simulatedPayments.get(checkoutRequestId);
    if (payment && payment.status === "completed") {
      return generateSimulatedReceipt();
    }
  }
  return null;
};
var parseCallbackData = (data) => {
  const callback = data.Body.stkCallback;
  const isSuccess = callback.ResultCode === 0;
  let amount;
  let mpesaReceiptNumber;
  let transactionDate;
  let phoneNumber;
  if (isSuccess && callback.CallbackMetadata) {
    for (const item of callback.CallbackMetadata.Item) {
      switch (item.Name) {
        case "Amount":
          amount = Number(item.Value);
          break;
        case "MpesaReceiptNumber":
          mpesaReceiptNumber = String(item.Value);
          break;
        case "TransactionDate":
          transactionDate = String(item.Value);
          break;
        case "PhoneNumber":
          phoneNumber = String(item.Value);
          break;
      }
    }
  }
  return {
    success: isSuccess,
    merchantRequestId: callback.MerchantRequestID,
    checkoutRequestId: callback.CheckoutRequestID,
    resultCode: callback.ResultCode,
    resultDesc: callback.ResultDesc,
    amount,
    mpesaReceiptNumber,
    transactionDate,
    phoneNumber
  };
};

// server/pitchDocument.ts
import PDFDocument from "pdfkit";
var BRAND_GREEN = "#16a34a";
var BRAND_DARK = "#0f172a";
var BRAND_ORANGE = "#f97316";
var BRAND_LIGHT_GREEN = "#dcfce7";
var GRAY = "#64748b";
var LIGHT_GRAY = "#f8fafc";
var WHITE = "#ffffff";
var TEXT_DARK = "#1e293b";
function addPage(doc) {
  doc.addPage({ size: "A4", margins: { top: 60, bottom: 60, left: 60, right: 60 } });
}
function sectionHeader(doc, title, color = BRAND_GREEN) {
  doc.rect(60, doc.y, 475, 36).fill(color);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(15).text(title.toUpperCase(), 72, doc.y - 28, { characterSpacing: 1.2 });
  doc.moveDown(1.2);
  doc.fillColor(TEXT_DARK);
}
function statBox(doc, x, y, value, label, color = BRAND_GREEN) {
  doc.rect(x, y, 130, 72).fillAndStroke(LIGHT_GRAY, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(22).text(value, x, y + 12, { width: 130, align: "center" });
  doc.fillColor(GRAY).font("Helvetica").fontSize(9).text(label, x, y + 44, { width: 130, align: "center" });
}
function bulletPoint(doc, text2, indent = 72) {
  const y = doc.y;
  doc.fillColor(BRAND_GREEN).fontSize(10).text("\u2022", indent, y);
  doc.fillColor(TEXT_DARK).fontSize(10).text(text2, indent + 14, y, { width: 461 - indent });
  doc.moveDown(0.3);
}
function featureCard(doc, x, y, title, desc5, color = BRAND_GREEN) {
  doc.rect(x, y, 215, 80).fillAndStroke(LIGHT_GRAY, color);
  doc.fillColor(color).font("Helvetica-Bold").fontSize(11).text(title, x + 10, y + 10, { width: 195 });
  doc.fillColor(GRAY).font("Helvetica").fontSize(9).text(desc5, x + 10, y + 28, { width: 195 });
}
function generatePitchPDF(res) {
  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: "SportsBox + Fireflies \u2013 Investor Pitch",
      Author: "SportsBox & Fireflies",
      Subject: "Investment Opportunity \u2013 Kenya Dual Booking Platform"
    }
  });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="SportsBox-Fireflies-Pitch.pdf"');
  doc.pipe(res);
  doc.rect(0, 0, 595, 842).fill(BRAND_DARK);
  doc.rect(0, 260, 595, 6).fill(BRAND_GREEN);
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(44).text("SportsBox", 60, 150, { align: "center" });
  doc.fillColor(WHITE).fontSize(18).font("Helvetica").text("&", 60, 205, { align: "center" });
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(44).text("Fireflies", 60, 225, { align: "center" });
  doc.fillColor(WHITE).font("Helvetica").fontSize(16).text("Kenya's Premier Dual Booking Platform", 60, 285, { align: "center" });
  doc.fillColor(GRAY).font("Helvetica").fontSize(12).text("Sports Court Reservations  \xB7  Event Ticketing  \xB7  M-Pesa Payments", 60, 316, { align: "center" });
  doc.rect(200, 360, 195, 1).fill(BRAND_GREEN);
  doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(13).text("INVESTOR PITCH DOCUMENT", 60, 380, { align: "center", characterSpacing: 2 });
  doc.fillColor(GRAY).font("Helvetica").fontSize(11).text("Connecting Kenya through Sport & Entertainment", 60, 408, { align: "center" });
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(10).text("NAIROBI  \xB7  MOMBASA  \xB7  KISUMU  \xB7  NAKURU  \xB7  ELDORET", 60, 760, { align: "center", characterSpacing: 1.5 });
  doc.fillColor(GRAY).font("Helvetica").fontSize(9).text("Confidential \u2013 For Investor Use Only", 60, 780, { align: "center" });
  addPage(doc);
  sectionHeader(doc, "01  Executive Summary");
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(11).text(
    "SportsBox + Fireflies is a unified digital platform built for the Kenyan market that transforms how sports facilities and entertainment events are discovered, booked, and paid for. We connect court owners, event organisers, and thousands of sports-loving Kenyans through a seamless mobile-optimised experience \u2014 powered by M-Pesa, Kenya's dominant payment method.",
    { lineGap: 4 }
  );
  doc.moveDown(1);
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(12).text("Two Platforms. One Ecosystem.");
  doc.moveDown(0.5);
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(11).text(
    "SportsBox allows customers to search, book, and pay for sports courts \u2014 football pitches, tennis courts, basketball courts and more \u2014 across Kenyan cities, with real-time availability, equipment rentals, and GPS-based discovery.",
    { lineGap: 4 }
  );
  doc.moveDown(0.6);
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(11).text(
    "Fireflies is the companion event ticketing platform for concerts, sports events, theatre shows, and conferences \u2014 featuring interactive seat maps, tiered tickets (VIP, General, Early Bird), digital verification, and real-time sales analytics for organisers.",
    { lineGap: 4 }
  );
  doc.moveDown(1.2);
  const statsY = doc.y;
  statBox(doc, 60, statsY, "KSh 180B+", "Kenya Sports Industry\n(Annual Value)", BRAND_GREEN);
  statBox(doc, 205, statsY, "15M+", "Active Sports\nParticipants in Kenya", BRAND_GREEN);
  statBox(doc, 350, statsY, "65%", "Kenyans Under 35\n(Primary Users)", BRAND_ORANGE);
  doc.y = statsY + 90;
  doc.moveDown(1);
  const stats2Y = doc.y;
  statBox(doc, 60, stats2Y, "5 Cities", "Live Coverage:\nNairobi to Kisumu", BRAND_DARK);
  statBox(doc, 205, stats2Y, "M-Pesa", "Native Payment\nIntegration", BRAND_GREEN);
  statBox(doc, 350, stats2Y, "15+ Sports", "Supported Across\nAll Platforms", BRAND_ORANGE);
  doc.y = stats2Y + 90;
  doc.moveDown(1.5);
  doc.rect(60, doc.y, 475, 52).fill(BRAND_LIGHT_GREEN);
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(11).text(
    '"We are building the infrastructure layer for sports and entertainment in East Africa \u2014 starting with Kenya."',
    72,
    doc.y - 42,
    { width: 451, align: "center", lineGap: 3 }
  );
  doc.moveDown(1.5);
  addPage(doc);
  sectionHeader(doc, "02  The Problem");
  const problems = [
    "Court owners manage bookings manually via WhatsApp and phone calls \u2014 leading to double bookings, missed revenue, and no data.",
    "Customers have no reliable way to discover available courts near them, check real-time availability, or pay digitally.",
    "Event organisers rely on cash ticket sales, paper tickets, and third-party agents \u2014 with no visibility into sales data.",
    "There is no unified platform in Kenya serving both sports facility management AND event ticketing under one ecosystem.",
    "Existing global solutions (e.g. Mindbody, Eventbrite) are not localised for Kenyan payment infrastructure (M-Pesa) or the informal sporting market."
  ];
  problems.forEach((p) => bulletPoint(doc, p));
  doc.moveDown(1);
  sectionHeader(doc, "03  Our Solution", BRAND_ORANGE);
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(11).text("SportsBox + Fireflies solves these problems with a purpose-built, Kenya-first platform:", { lineGap: 4 });
  doc.moveDown(0.5);
  const solutions = [
    ["Digital Court Management", "Vendors list courts, set pricing (standard & peak hours), manage availability, upload photos, and track revenue \u2014 all from a single dashboard."],
    ["GPS-Powered Discovery", "Customers find courts within their chosen radius using live GPS location. Distance is calculated and sorted in real-time using the Haversine formula."],
    ["M-Pesa STK Push Payments", "Payments are collected via M-Pesa directly from the customer's phone \u2014 no card required. Receipts and confirmations are sent instantly."],
    ["Event Ticketing with Seat Maps", "Fireflies provides interactive venue seat maps, tiered ticket pricing (VIP / General / Early Bird), and digital QR ticket verification for event entry."],
    ["Guest & Registered Bookings", "Customers can book courts without an account. Registered users receive a 10% first-booking discount as a signup incentive."],
    ["Automated Notifications", "Email and SMS confirmations, reminders, vendor earning alerts, and booking receipts are sent automatically on every transaction."]
  ];
  solutions.forEach(([title, desc5]) => {
    doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(10).text(`\u25B8 ${title}`, 72);
    doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(10).text(desc5, 86, doc.y, { width: 447, lineGap: 2 });
    doc.moveDown(0.5);
  });
  addPage(doc);
  sectionHeader(doc, "04  Platform Features \u2013 SportsBox");
  const sbFeatures = [
    ["Court Discovery & Search", "15+ sports, location-based radius filtering, city browsing, multi-sport search."],
    ["Real-Time Availability", "Hour-by-hour slot management with capacity enforcement per sport type."],
    ["Multi-Court Booking", "Book multiple courts simultaneously for large groups at separate-area facilities."],
    ["Equipment Rentals", "Add-on equipment rental (balls, nets, shoes) charged per hour alongside bookings."],
    ["Booking Cancellation", "2-hour cancellation window with automated refund notifications to customer & vendor."],
    ["Vendor Analytics Dashboard", "Revenue per court/city, booking trends, popular sports, customer history."]
  ];
  let fx = 60;
  let fy = doc.y;
  sbFeatures.forEach(([title, desc5], i) => {
    featureCard(doc, fx, fy, title, desc5, BRAND_GREEN);
    if (i % 2 === 1) {
      fy += 92;
      fx = 60;
    } else {
      fx = 320;
    }
  });
  doc.y = fy + 92;
  doc.moveDown(0.5);
  sectionHeader(doc, "05  Platform Features \u2013 Fireflies", BRAND_ORANGE);
  const ffFeatures = [
    ["Event Discovery", "Browse concerts, sports events, theatre & conferences by city and category."],
    ["Interactive Seat Maps", "Visual seat selection with real-time availability and section pricing."],
    ["Tiered Ticketing", "VIP, General Admission, and Early Bird tiers with dynamic pricing support."],
    ["Digital Ticket Verification", "QR-code based entry verification for event staff at venue gates."],
    ["Organiser Dashboard", "Real-time sales tracking, attendance forecasts, and revenue analytics."],
    ["M-Pesa Ticket Payments", "All ticket purchases processed via M-Pesa STK Push \u2014 no card needed."]
  ];
  fx = 60;
  fy = doc.y;
  ffFeatures.forEach(([title, desc5], i) => {
    featureCard(doc, fx, fy, title, desc5, BRAND_ORANGE);
    if (i % 2 === 1) {
      fy += 92;
      fx = 60;
    } else {
      fx = 320;
    }
  });
  doc.y = fy + 92;
  addPage(doc);
  sectionHeader(doc, "06  Target Users & Benefits");
  const userGroups = [
    {
      title: "Sports Enthusiasts (Customers)",
      color: BRAND_GREEN,
      points: [
        "Find and book courts in minutes \u2014 no calls, no WhatsApp chains",
        "GPS-powered search finds the nearest available court",
        "10% first-booking discount for new sign-ups",
        "Instant M-Pesa payment \u2014 money stays on their phone until booking confirmed",
        "Email/SMS confirmations and day-before reminders"
      ]
    },
    {
      title: "Court Owners & Venue Managers (Vendors)",
      color: BRAND_DARK,
      points: [
        "Digital storefront with photos, pricing, sports, and availability calendar",
        "Revenue dashboard showing earnings per court, sport, and city",
        "Automatic booking notifications with customer details",
        "Peak-hour pricing management to maximise revenue",
        "Multi-court capacity management for large facilities"
      ]
    },
    {
      title: "Event Organisers",
      color: BRAND_ORANGE,
      points: [
        "Create events with tiered ticket pricing and seat map configuration",
        "Real-time sales analytics and attendee tracking",
        "Digital ticket issuance \u2014 no printing costs",
        "Instant M-Pesa payment settlement",
        "QR code scanning for fast, fraud-resistant venue entry"
      ]
    }
  ];
  userGroups.forEach(({ title, color, points }) => {
    doc.rect(60, doc.y, 475, 20).fill(color);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(11).text(title, 72, doc.y - 15, { width: 451 });
    doc.moveDown(0.6);
    points.forEach((p) => bulletPoint(doc, p));
    doc.moveDown(0.4);
  });
  addPage(doc);
  sectionHeader(doc, "07  Business Model & Revenue Streams");
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(11).text(
    "SportsBox + Fireflies operates on a commission-based marketplace model, keeping the platform free for customers while generating revenue from every transaction processed.",
    { lineGap: 4 }
  );
  doc.moveDown(1);
  const revenueStreams = [
    ["Platform Commission (Primary)", "A percentage fee on every court booking and event ticket sold through the platform. Vendors receive their earnings minus the platform commission.", BRAND_GREEN],
    ["Vendor Subscription Plans", "Premium vendor tiers offering advanced analytics, priority listing, promotional features, and increased photo uploads.", BRAND_DARK],
    ["Featured Listings & Promotions", "Court owners and event organisers can pay to feature their listings at the top of search results for target cities.", BRAND_ORANGE],
    ["Equipment Rental Facilitation", "Commission on equipment rental bookings added to court reservations.", BRAND_GREEN],
    ["Corporate & Group Bookings", "Custom pricing packages for corporate sports days, school tournaments, and large group events.", BRAND_DARK],
    ["Data & Analytics Products", "Aggregated market insights (venue performance, sport trends, city-level demand) sold to venue operators and sports bodies.", BRAND_ORANGE]
  ];
  revenueStreams.forEach(([title, desc5, color]) => {
    const startY = doc.y;
    doc.rect(60, startY, 8, 44).fill(color);
    doc.fillColor(color).font("Helvetica-Bold").fontSize(11).text(title, 76, startY, { width: 457 });
    doc.fillColor(GRAY).font("Helvetica").fontSize(10).text(desc5, 76, doc.y, { width: 457, lineGap: 2 });
    doc.moveDown(0.8);
  });
  doc.moveDown(0.5);
  doc.rect(60, doc.y, 475, 56).fill(BRAND_LIGHT_GREEN);
  const boxY = doc.y;
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(12).text("Unit Economics Example", 72, boxY + 8);
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(10).text(
    "A court booked at KSh 3,000/hr for 2 hours = KSh 6,000 transaction. At 10% commission = KSh 600 platform revenue per booking. 100 bookings/day across the platform = KSh 60,000/day \u2192 KSh 1.8M/month from bookings alone.",
    72,
    doc.y - 2,
    { width: 451, lineGap: 2 }
  );
  doc.y = boxY + 68;
  addPage(doc);
  sectionHeader(doc, "08  Market Opportunity \u2013 Kenya");
  const marketPoints = [
    "Kenya has over 52 million people, with 65% under 35 \u2014 the primary demographic for sports and entertainment spending.",
    "Nairobi alone has 500+ registered sports facilities with minimal digital presence; most rely on word-of-mouth and WhatsApp bookings.",
    "M-Pesa processes over KSh 500 billion per month in transactions \u2014 digital payments are mainstream among our target users.",
    "The East African events market is growing at 12% annually, driven by music festivals, corporate events, and international sports.",
    "Football, basketball, and swimming are the fastest-growing recreational sports in Kenya, with demand outstripping supply of quality courts.",
    "No direct competitor offers a unified sports court + event ticketing platform built specifically for the Kenyan payment and mobile ecosystem."
  ];
  marketPoints.forEach((p) => bulletPoint(doc, p));
  doc.moveDown(1);
  const mboxY = doc.y;
  doc.rect(60, mboxY, 225, 70).fillAndStroke(BRAND_LIGHT_GREEN, BRAND_GREEN);
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(20).text("KSh 180B+", 60, mboxY + 10, { width: 225, align: "center" });
  doc.fillColor(GRAY).font("Helvetica").fontSize(9).text("Total Addressable Market\nKenya Sports & Leisure", 60, mboxY + 40, { width: 225, align: "center" });
  doc.rect(310, mboxY, 225, 70).fillAndStroke(BRAND_LIGHT_GREEN, BRAND_ORANGE);
  doc.fillColor(BRAND_ORANGE).font("Helvetica-Bold").fontSize(20).text("KSh 45B+", 310, mboxY + 10, { width: 225, align: "center" });
  doc.fillColor(GRAY).font("Helvetica").fontSize(9).text("Serviceable Market\nDigitisable Bookings & Tickets", 310, mboxY + 40, { width: 225, align: "center" });
  doc.y = mboxY + 82;
  doc.moveDown(1);
  sectionHeader(doc, "09  Competitive Advantage", BRAND_DARK);
  const advantages = [
    "M-Pesa native \u2014 not bolted on; built from the ground up for Kenyan mobile money infrastructure.",
    "Dual-platform synergy \u2014 court owners and event organisers share one vendor dashboard, reducing friction.",
    "GPS-first discovery \u2014 location-based search with Haversine distance calculation gives customers the most relevant results.",
    "Kenya-localised \u2014 cities, pricing in KSh, Kenyan phone number formats, local sport preferences baked in.",
    "Admin oversight \u2014 court approval workflows ensure quality control, protecting the brand and customer experience.",
    "Live & scalable \u2014 fully deployed on cloud infrastructure, production M-Pesa integration, ready to scale."
  ];
  advantages.forEach((a) => bulletPoint(doc, a));
  addPage(doc);
  sectionHeader(doc, "10  Technology Stack");
  doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(10).text(
    "The platform is built on a modern, production-grade technology stack optimised for performance, scalability, and developer velocity.",
    { lineGap: 4 }
  );
  doc.moveDown(0.8);
  const techStack = [
    ["Frontend", "React 18 + TypeScript, Vite, Tailwind CSS, Shadcn/ui, TanStack Query, Wouter routing"],
    ["Backend", "Node.js + Express.js, TypeScript, RESTful API architecture, ESBuild production bundling"],
    ["Database", "PostgreSQL (Neon serverless), Drizzle ORM with full type safety, schema migrations"],
    ["Authentication", "Replit Auth (OIDC/OpenID Connect), Passport.js, secure session management"],
    ["Payments", "M-Pesa Lipa Na M-Pesa (STK Push) \u2014 production integration with Safaricom"],
    ["File Storage", "Google Cloud Storage with presigned URLs for court images and media"],
    ["Notifications", "Resend email API for booking confirmations, reminders, and vendor alerts"],
    ["Maps & Location", "Google Maps API, Haversine distance calculations, GPS geolocation"],
    ["Deployment", "Cloud-hosted, HTTPS, auto-scaling infrastructure \u2014 live and accessible 24/7"]
  ];
  techStack.forEach(([category, desc5]) => {
    const ty = doc.y;
    doc.rect(60, ty, 110, 24).fill(BRAND_GREEN);
    doc.fillColor(WHITE).font("Helvetica-Bold").fontSize(9).text(category, 60, ty + 7, { width: 110, align: "center" });
    doc.fillColor(TEXT_DARK).font("Helvetica").fontSize(9).text(desc5, 178, ty + 7, { width: 357 });
    doc.y = ty + 28;
    doc.moveDown(0.1);
  });
  doc.moveDown(1.2);
  sectionHeader(doc, "11  Current Status & Traction", BRAND_ORANGE);
  const traction = [
    "Fully deployed and live \u2014 the platform is accessible to customers and vendors in Kenya today.",
    "Multi-city coverage \u2014 Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret supported at launch.",
    "Production M-Pesa integration \u2014 real payments processed via Safaricom's production API.",
    "End-to-end booking flow \u2014 search \u2192 book \u2192 pay \u2192 receive confirmation, fully automated.",
    "Vendor tools live \u2014 court listing, photo upload, analytics dashboard, and booking management all operational.",
    "Admin approval system \u2014 quality control workflow ensuring only verified courts are listed."
  ];
  traction.forEach((t) => bulletPoint(doc, t));
  doc.moveDown(1);
  doc.rect(60, doc.y, 475, 110).fill(BRAND_DARK);
  const ctaY = doc.y;
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(16).text("Join Us in Building Kenya's Sports & Events Future", 72, ctaY - 96, { width: 451, align: "center" });
  doc.fillColor(WHITE).font("Helvetica").fontSize(10).text(
    "We are seeking investment to accelerate vendor acquisition, expand to additional East African cities, build native iOS & Android mobile apps, and grow our sales and marketing team.",
    72,
    doc.y + 2,
    { width: 451, align: "center", lineGap: 3 }
  );
  doc.moveDown(0.8);
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(11).text("Get in touch to discuss partnership and investment opportunities:", { align: "center" });
  doc.moveDown(0.4);
  doc.fillColor(WHITE).font("Helvetica").fontSize(11).text("sportsbox.fireflies@kenya.platform", { align: "center" });
  doc.moveDown(2);
  doc.fillColor(GRAY).font("Helvetica").fontSize(8).text(
    "This document is confidential and intended solely for the named recipient. All projections are estimates based on market research. \xA9 2025 SportsBox + Fireflies. All rights reserved.",
    60,
    doc.y,
    { width: 475, align: "center", lineGap: 2 }
  );
  doc.end();
}

// server/adminAuth.ts
init_schema();
import { eq as eq3 } from "drizzle-orm";
var OWNER_EMAIL = "tavish@dreamcatchers.tv";
async function seedOwner() {
  try {
    const existing = await db.select().from(adminUsers).where(eq3(adminUsers.email, OWNER_EMAIL));
    if (existing.length === 0) {
      await db.insert(adminUsers).values({ email: OWNER_EMAIL, role: "owner", addedBy: "system" });
      console.log("Owner admin seeded:", OWNER_EMAIL);
    }
  } catch (error) {
    console.error("Error seeding owner:", error);
  }
}
async function isAdminEmail(email) {
  try {
    const results = await db.select().from(adminUsers).where(eq3(adminUsers.email, email));
    return results[0] || null;
  } catch {
    return null;
  }
}
var requireAdmin = async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "No email found" });
  const admin = await isAdminEmail(email);
  if (!admin) return res.status(403).json({ message: "Admin access required" });
  req.adminUser = admin;
  next();
};
var requireOwner = async (req, res, next) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "No email found" });
  const results = await db.select().from(adminUsers).where(eq3(adminUsers.email, email));
  const admin = results[0];
  if (!admin || admin.role !== "owner") return res.status(403).json({ message: "Owner access required" });
  req.adminUser = admin;
  next();
};

// server/matchRoutes.ts
init_schema();
import { eq as eq4, desc as desc3 } from "drizzle-orm";
async function recomputeConfirming(matchId) {
  const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
  if (!match || match.status !== "confirming") return;
  const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
  const active = parts.filter((p) => p.confirmStatus !== "dropped");
  if (active.length === 0) {
    await db.update(matches).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
    return;
  }
  const newPer = (Number(match.totalAmount) / active.length).toFixed(2);
  if (newPer !== Number(match.pricePerSpot).toFixed(2)) {
    await db.update(matches).set({ pricePerSpot: newPer, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
    for (const p of active) {
      if (p.confirmStatus === "confirmed") {
        await db.update(matchParticipants).set({ confirmStatus: "none" }).where(eq4(matchParticipants.id, p.id));
      }
    }
    return;
  }
  if (active.every((p) => p.confirmStatus === "confirmed")) {
    await db.update(matches).set({ status: "full", totalSpots: active.length, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
  }
}
async function maybeConfirmMatch(matchId) {
  const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
  if (!match || match.status === "confirmed") return;
  const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
  if (parts.length < match.totalSpots) return;
  if (!parts.every((p) => p.paymentStatus === "paid")) return;
  const startHour = parseInt(match.startTime.split(":")[0]);
  const endTime = `${startHour + match.duration}:00`;
  try {
    const booking = await storage.createBooking({
      courtId: match.courtId,
      selectedSport: match.sport,
      sportSegments: null,
      bookingDate: match.matchDate,
      timeSlot: match.startTime,
      startTime: match.startTime,
      endTime,
      duration: match.duration,
      courtAmount: match.totalAmount,
      totalAmount: match.totalAmount,
      paymentMethod: "mpesa",
      paymentStatus: "completed",
      status: "confirmed",
      customerId: match.creatorId,
      isGuestBooking: false,
      courtsBooked: 1
    });
    await db.update(matches).set({ status: "confirmed", bookingId: booking.id, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
  } catch (e) {
    console.error("Error creating booking from match:", e);
  }
}
function registerMatchRoutes(app2) {
  app2.post("/api/matches", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { courtId, sport, matchDate, startTime, duration, totalSpots, notes, communityId } = req.body;
      if (!courtId || !sport || !matchDate || !startTime || !totalSpots)
        return res.status(400).json({ message: "Missing required fields" });
      const spots = parseInt(totalSpots);
      if (isNaN(spots) || spots < 2) return res.status(400).json({ message: "Need at least 2 spots" });
      const dur = parseInt(duration) || 1;
      const [court] = await db.select().from(courts).where(eq4(courts.id, courtId));
      if (!court) return res.status(404).json({ message: "Court not found" });
      const totalAmount = (Number(court.hourlyRate) || 0) * dur;
      const [match] = await db.insert(matches).values({
        creatorId: userId,
        courtId,
        sport,
        matchDate,
        startTime,
        duration: dur,
        totalSpots: spots,
        totalAmount: totalAmount.toFixed(2),
        pricePerSpot: (totalAmount / spots).toFixed(2),
        notes: notes || null,
        status: "open",
        communityId: communityId || null
      }).returning();
      await db.insert(matchParticipants).values({ matchId: match.id, userId, paymentStatus: "unpaid" });
      res.status(201).json(match);
    } catch (e) {
      console.error("Error creating match:", e);
      res.status(500).json({ message: "Failed to create match" });
    }
  });
  app2.get("/api/matches", async (req, res) => {
    try {
      const { sport, city } = req.query;
      const rows = await db.select({ match: matches, courtName: courts.name, courtCity: courts.city, courtArea: courts.area }).from(matches).innerJoin(courts, eq4(matches.courtId, courts.id)).where(eq4(matches.status, "open")).orderBy(desc3(matches.createdAt));
      const result = [];
      for (const r of rows) {
        if (sport && r.match.sport !== sport) continue;
        if (city && r.courtCity !== city) continue;
        const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, r.match.id));
        result.push({
          ...r.match,
          courtName: r.courtName,
          courtCity: r.courtCity,
          courtArea: r.courtArea,
          filledSpots: parts.length,
          spotsRemaining: r.match.totalSpots - parts.length
        });
      }
      res.json(result);
    } catch (e) {
      console.error("Error fetching matches:", e);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });
  app2.get("/api/matches/:id", async (req, res) => {
    try {
      const [row] = await db.select({ match: matches, courtName: courts.name, courtCity: courts.city, courtArea: courts.area }).from(matches).innerJoin(courts, eq4(matches.courtId, courts.id)).where(eq4(matches.id, req.params.id));
      if (!row) return res.status(404).json({ message: "Match not found" });
      const parts = await db.select({ participant: matchParticipants, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl }).from(matchParticipants).innerJoin(users, eq4(matchParticipants.userId, users.id)).where(eq4(matchParticipants.matchId, req.params.id));
      res.json({
        ...row.match,
        courtName: row.courtName,
        courtCity: row.courtCity,
        courtArea: row.courtArea,
        participants: parts.map((p) => ({ ...p.participant, firstName: p.firstName, lastName: p.lastName, profileImageUrl: p.profileImageUrl })),
        filledSpots: parts.length,
        spotsRemaining: row.match.totalSpots - parts.length
      });
    } catch (e) {
      console.error("Error fetching match:", e);
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });
  app2.post("/api/matches/:id/join", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "open") return res.status(400).json({ message: "This match is no longer open" });
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      if (parts.find((p) => p.userId === userId)) return res.status(409).json({ message: "You already joined this match" });
      if (parts.length >= match.totalSpots) return res.status(400).json({ message: "This match is full" });
      await db.insert(matchParticipants).values({ matchId, userId, paymentStatus: "unpaid" });
      const newCount = parts.length + 1;
      if (newCount >= match.totalSpots) await db.update(matches).set({ status: "full", updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
      res.json({ success: true, filledSpots: newCount, isFull: newCount >= match.totalSpots });
    } catch (e) {
      console.error("Error joining match:", e);
      res.status(500).json({ message: "Failed to join match" });
    }
  });
  app2.post("/api/matches/:id/leave", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status === "confirmed") return res.status(400).json({ message: "Cannot leave a confirmed match" });
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      const mine = parts.find((p) => p.userId === userId);
      if (!mine) return res.status(404).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.status(400).json({ message: "You already paid; contact support" });
      await db.delete(matchParticipants).where(eq4(matchParticipants.id, mine.id));
      if (parts.length - 1 <= 0) await db.update(matches).set({ status: "cancelled", updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
      else if (match.status === "full") await db.update(matches).set({ status: "open", updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
      res.json({ success: true });
    } catch (e) {
      console.error("Error leaving match:", e);
      res.status(500).json({ message: "Failed to leave match" });
    }
  });
  app2.post("/api/matches/:id/pay", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const { phone } = req.body;
      if (!phone) return res.status(400).json({ message: "Phone number is required" });
      const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "full") return res.status(400).json({ message: "Payment opens once all spots are filled" });
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      const mine = parts.find((p) => p.userId === userId);
      if (!mine) return res.status(403).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.status(400).json({ message: "You already paid" });
      const response = await initiateSTKPush({
        phone,
        amount: Number(match.pricePerSpot),
        accountReference: `MT${matchId.slice(0, 8).toUpperCase()}`,
        transactionDesc: "Match Spot"
      });
      await db.update(matchParticipants).set({ mpesaCheckoutRequestId: response.CheckoutRequestID }).where(eq4(matchParticipants.id, mine.id));
      res.json({ success: true, message: "Payment prompt sent to your phone", checkoutRequestId: response.CheckoutRequestID });
    } catch (e) {
      console.error("Match payment error:", e);
      res.status(500).json({ message: e.message || "Failed to initiate payment" });
    }
  });
  app2.get("/api/matches/:id/payment-status", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      const mine = parts.find((p) => p.userId === userId);
      if (!mine) return res.status(404).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.json({ status: "paid", mpesaReceiptNumber: mine.mpesaReceiptNumber });
      if (!mine.mpesaCheckoutRequestId) return res.json({ status: "unpaid" });
      let isSuccess = false;
      try {
        const r = await querySTKPushStatus(mine.mpesaCheckoutRequestId);
        isSuccess = r.ResultCode === "0";
      } catch {
        return res.json({ status: "pending" });
      }
      if (isSuccess) {
        await db.update(matchParticipants).set({ paymentStatus: "paid" }).where(eq4(matchParticipants.id, mine.id));
        await maybeConfirmMatch(matchId);
        return res.json({ status: "paid" });
      }
      res.json({ status: "pending" });
    } catch (e) {
      console.error("Error checking match payment:", e);
      res.status(500).json({ message: "Failed to check payment" });
    }
  });
  app2.post("/api/matches/:id/trigger-early", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.creatorId !== userId) return res.status(403).json({ message: "Only the creator can start early" });
      if (match.status !== "open") return res.status(400).json({ message: "Match is not open" });
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      if (parts.length < 1) return res.status(400).json({ message: "No players have joined" });
      const newPer = (Number(match.totalAmount) / parts.length).toFixed(2);
      await db.update(matches).set({ status: "confirming", pricePerSpot: newPer, updatedAt: /* @__PURE__ */ new Date() }).where(eq4(matches.id, matchId));
      for (const p of parts) {
        await db.update(matchParticipants).set({ confirmStatus: "none" }).where(eq4(matchParticipants.id, p.id));
      }
      res.json({ success: true, pricePerSpot: newPer, players: parts.length });
    } catch (e) {
      console.error("Error triggering early:", e);
      res.status(500).json({ message: "Failed to start early" });
    }
  });
  app2.post("/api/matches/:id/confirm", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "confirming") return res.status(400).json({ message: "Match is not in confirming stage" });
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      const mine = parts.find((p) => p.userId === userId);
      if (!mine) return res.status(403).json({ message: "You are not in this match" });
      if (mine.confirmStatus === "dropped") return res.status(400).json({ message: "You already dropped out" });
      await db.update(matchParticipants).set({ confirmStatus: "confirmed" }).where(eq4(matchParticipants.id, mine.id));
      await recomputeConfirming(matchId);
      res.json({ success: true });
    } catch (e) {
      console.error("Error confirming:", e);
      res.status(500).json({ message: "Failed to confirm" });
    }
  });
  app2.post("/api/matches/:id/drop", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq4(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, matchId));
      const mine = parts.find((p) => p.userId === userId);
      if (!mine) return res.status(403).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.status(400).json({ message: "You already paid" });
      await db.update(matchParticipants).set({ confirmStatus: "dropped" }).where(eq4(matchParticipants.id, mine.id));
      await recomputeConfirming(matchId);
      res.json({ success: true });
    } catch (e) {
      console.error("Error dropping:", e);
      res.status(500).json({ message: "Failed to drop out" });
    }
  });
  app2.get("/api/my-matches", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const myParts = await db.select().from(matchParticipants).where(eq4(matchParticipants.userId, userId));
      const result = [];
      for (const mp of myParts) {
        const [row] = await db.select({ match: matches, courtName: courts.name, courtCity: courts.city }).from(matches).innerJoin(courts, eq4(matches.courtId, courts.id)).where(eq4(matches.id, mp.matchId));
        if (row) {
          const parts = await db.select().from(matchParticipants).where(eq4(matchParticipants.matchId, mp.matchId));
          result.push({ ...row.match, courtName: row.courtName, courtCity: row.courtCity, filledSpots: parts.length, myPaymentStatus: mp.paymentStatus });
        }
      }
      res.json(result);
    } catch (e) {
      console.error("Error fetching my matches:", e);
      res.status(500).json({ message: "Failed to fetch your matches" });
    }
  });
}

// server/communityRoutes.ts
init_schema();
import { eq as eq5, desc as desc4, and as and3, gte as gte2 } from "drizzle-orm";
function registerCommunityRoutes(app2) {
  app2.post("/api/communities", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { name, description, imageUrl, sports, skillLevel, city, area, joinPolicy } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const [community] = await db.insert(communities).values({
        creatorId: userId,
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        sports: Array.isArray(sports) ? sports : [],
        skillLevel: skillLevel || "all",
        city: city || null,
        area: area || null,
        joinPolicy: joinPolicy || "open"
      }).returning();
      await db.insert(communityMembers).values({ communityId: community.id, userId, role: "creator", status: "approved" });
      res.status(201).json(community);
    } catch (e) {
      console.error("Error creating community:", e);
      res.status(500).json({ message: "Failed to create community" });
    }
  });
  app2.get("/api/communities", async (req, res) => {
    try {
      const { sport, city, skillLevel } = req.query;
      const rows = await db.select().from(communities).orderBy(desc4(communities.createdAt));
      const result = [];
      for (const c of rows) {
        if (sport && !(c.sports || []).includes(sport)) continue;
        if (city && c.city !== city) continue;
        if (skillLevel && c.skillLevel !== skillLevel) continue;
        const members = await db.select().from(communityMembers).where(and3(eq5(communityMembers.communityId, c.id), eq5(communityMembers.status, "approved")));
        result.push({ ...c, memberCount: members.length });
      }
      res.json(result);
    } catch (e) {
      console.error("Error fetching communities:", e);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });
  app2.get("/api/communities/:id", async (req, res) => {
    try {
      const [community] = await db.select().from(communities).where(eq5(communities.id, req.params.id));
      if (!community) return res.status(404).json({ message: "Community not found" });
      const members = await db.select({ member: communityMembers, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl }).from(communityMembers).innerJoin(users, eq5(communityMembers.userId, users.id)).where(eq5(communityMembers.communityId, req.params.id));
      res.json({
        ...community,
        members: members.filter((m) => m.member.status === "approved").map((m) => ({ ...m.member, firstName: m.firstName, lastName: m.lastName, profileImageUrl: m.profileImageUrl })),
        pendingMembers: members.filter((m) => m.member.status === "pending").map((m) => ({ ...m.member, firstName: m.firstName, lastName: m.lastName, profileImageUrl: m.profileImageUrl })),
        memberCount: members.filter((m) => m.member.status === "approved").length
      });
    } catch (e) {
      console.error("Error fetching community:", e);
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });
  app2.post("/api/communities/:id/join", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const communityId = req.params.id;
      const [community] = await db.select().from(communities).where(eq5(communities.id, communityId));
      if (!community) return res.status(404).json({ message: "Community not found" });
      const existing = await db.select().from(communityMembers).where(and3(eq5(communityMembers.communityId, communityId), eq5(communityMembers.userId, userId)));
      if (existing.length > 0) return res.status(409).json({ message: "You already joined or requested" });
      const status = community.joinPolicy === "open" ? "approved" : "pending";
      await db.insert(communityMembers).values({ communityId, userId, role: "member", status });
      res.json({ success: true, status });
    } catch (e) {
      console.error("Error joining community:", e);
      res.status(500).json({ message: "Failed to join" });
    }
  });
  app2.post("/api/communities/:id/leave", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const communityId = req.params.id;
      const existing = await db.select().from(communityMembers).where(and3(eq5(communityMembers.communityId, communityId), eq5(communityMembers.userId, userId)));
      if (!existing[0]) return res.status(404).json({ message: "You are not a member" });
      if (existing[0].role === "creator") return res.status(400).json({ message: "Creator cannot leave their own community" });
      await db.delete(communityMembers).where(eq5(communityMembers.id, existing[0].id));
      res.json({ success: true });
    } catch (e) {
      console.error("Error leaving community:", e);
      res.status(500).json({ message: "Failed to leave" });
    }
  });
  app2.post("/api/communities/:id/approve/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id: communityId, userId: targetUserId } = req.params;
      const [community] = await db.select().from(communities).where(eq5(communities.id, communityId));
      if (!community || community.creatorId !== userId) return res.status(403).json({ message: "Only the creator can approve members" });
      const [target] = await db.select().from(communityMembers).where(and3(eq5(communityMembers.communityId, communityId), eq5(communityMembers.userId, targetUserId)));
      if (!target) return res.status(404).json({ message: "Request not found" });
      await db.update(communityMembers).set({ status: "approved" }).where(eq5(communityMembers.id, target.id));
      res.json({ success: true });
    } catch (e) {
      console.error("Error approving member:", e);
      res.status(500).json({ message: "Failed to approve" });
    }
  });
  async function isApprovedMember(communityId, userId) {
    const rows = await db.select().from(communityMembers).where(and3(eq5(communityMembers.communityId, communityId), eq5(communityMembers.userId, userId), eq5(communityMembers.status, "approved")));
    return rows.length > 0;
  }
  app2.get("/api/communities/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const communityId = req.params.id;
      if (!await isApprovedMember(communityId, userId)) return res.status(403).json({ message: "Members only" });
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3);
      const rows = await db.select({ msg: communityMessages, firstName: users.firstName, lastName: users.lastName }).from(communityMessages).innerJoin(users, eq5(communityMessages.userId, users.id)).where(and3(eq5(communityMessages.communityId, communityId), gte2(communityMessages.createdAt, sevenDaysAgo))).orderBy(communityMessages.createdAt);
      res.json(rows.map((row) => ({ ...row.msg, firstName: row.firstName, lastName: row.lastName })));
    } catch (e) {
      console.error("Error fetching messages:", e);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/communities/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const communityId = req.params.id;
      const { message } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ message: "Message cannot be empty" });
      if (message.length > 1e3) return res.status(400).json({ message: "Message too long" });
      if (!await isApprovedMember(communityId, userId)) return res.status(403).json({ message: "Members only" });
      const [msg] = await db.insert(communityMessages).values({ communityId, userId, message: message.trim() }).returning();
      res.status(201).json(msg);
    } catch (e) {
      console.error("Error posting message:", e);
      res.status(500).json({ message: "Failed to post message" });
    }
  });
  app2.delete("/api/communities/:id/messages/:messageId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const { id: communityId, messageId } = req.params;
      const [msg] = await db.select().from(communityMessages).where(eq5(communityMessages.id, messageId));
      if (!msg) return res.status(404).json({ message: "Message not found" });
      const [community] = await db.select().from(communities).where(eq5(communities.id, communityId));
      const isModerator = community && community.creatorId === userId;
      if (msg.userId !== userId && !isModerator) return res.status(403).json({ message: "You cannot delete this message" });
      await db.delete(communityMessages).where(eq5(communityMessages.id, messageId));
      res.json({ success: true });
    } catch (e) {
      console.error("Error deleting message:", e);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  app2.get("/api/my-communities", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      const mine = await db.select().from(communityMembers).where(eq5(communityMembers.userId, userId));
      const result = [];
      for (const m of mine) {
        const [c] = await db.select().from(communities).where(eq5(communities.id, m.communityId));
        if (c) result.push({ ...c, myRole: m.role, myStatus: m.status });
      }
      res.json(result);
    } catch (e) {
      console.error("Error fetching my communities:", e);
      res.status(500).json({ message: "Failed to fetch" });
    }
  });
}

// server/routes.ts
init_schema();
import { eq as eqAdmin } from "drizzle-orm";
import { z as z2 } from "zod";
var verifyVendorStatus = async (userId) => {
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
        message: statusMessages[vendor.vendorVerificationStatus] || "Vendor verification required.",
        code: "NOT_VERIFIED",
        verificationStatus: vendor.vendorVerificationStatus
      }
    };
  }
  return { vendor };
};
async function registerRoutes(app2) {
  setupGoogleAuth(app2);
  seedOwner();
  registerMatchRoutes(app2);
  registerCommunityRoutes(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.id;
      console.log("Auth user route - extracted userId:", userId);
      console.log("Auth user route - req.user structure:", req.user);
      const user = await storage.getUser(userId);
      console.log("Auth user route - found user:", user);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/vendor/onboard", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { vendorOnboardingSchema: vendorOnboardingSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validatedData = vendorOnboardingSchema2.parse(req.body);
      const updatedUser = await storage.upsertUser({
        ...user,
        userType: "vendor",
        vendorVerificationStatus: "pending",
        ...validatedData
      });
      try {
        const vendorName = `${validatedData.firstName || ""} ${validatedData.lastName || ""}`.trim() || "Vendor";
        const businessName = validatedData.businessName || "Unknown Business";
        const vendorEmail = user.email || "";
        await Promise.all([
          EmailService.sendNewVendorAlertToAdmin({ vendorName, businessName, vendorEmail }),
          vendorEmail ? EmailService.sendVendorApplicationReceived({ vendorEmail, vendorName, businessName }) : Promise.resolve(false)
        ]);
      } catch (emailError) {
        console.warn("Failed to send vendor onboarding emails:", emailError);
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error during vendor onboarding:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid vendor data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to complete vendor onboarding" });
    }
  });
  app2.put("/api/vendor/update", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { vendorOnboardingSchema: vendorOnboardingSchema2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const validatedData = vendorOnboardingSchema2.parse(req.body);
      const updatedUser = await storage.upsertUser({
        ...user,
        ...validatedData,
        vendorVerificationStatus: user.vendorVerificationStatus || "pending"
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating vendor application:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({
          message: "Invalid vendor data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to update vendor application" });
    }
  });
  app2.put("/api/vendor/payment-details", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.userType !== "vendor") {
        return res.status(403).json({ message: "Only vendors can update payment details" });
      }
      const paymentDetailsSchema = z2.object({
        paymentPreference: z2.enum(["bank", "mpesa", "both"]),
        mpesaNumber: z2.string().optional(),
        bankName: z2.string().optional(),
        bankAccountNumber: z2.string().optional(),
        bankAccountName: z2.string().optional()
      }).superRefine((data, ctx) => {
        if (data.paymentPreference === "mpesa" || data.paymentPreference === "both") {
          if (!data.mpesaNumber || data.mpesaNumber.length < 10) {
            ctx.addIssue({ code: z2.ZodIssueCode.custom, message: "M-Pesa number is required (min 10 digits)", path: ["mpesaNumber"] });
          }
        }
        if (data.paymentPreference === "bank" || data.paymentPreference === "both") {
          if (!data.bankName) ctx.addIssue({ code: z2.ZodIssueCode.custom, message: "Bank name is required", path: ["bankName"] });
          if (!data.bankAccountNumber) ctx.addIssue({ code: z2.ZodIssueCode.custom, message: "Account number is required", path: ["bankAccountNumber"] });
          if (!data.bankAccountName) ctx.addIssue({ code: z2.ZodIssueCode.custom, message: "Account holder name is required", path: ["bankAccountName"] });
        }
      });
      const validatedData = paymentDetailsSchema.parse(req.body);
      const updatedUser = await storage.upsertUser({
        ...user,
        paymentPreference: validatedData.paymentPreference,
        mpesaNumber: validatedData.mpesaNumber || user.mpesaNumber,
        bankName: validatedData.bankName || user.bankName,
        bankAccountNumber: validatedData.bankAccountNumber || user.bankAccountNumber,
        bankAccountName: validatedData.bankAccountName || user.bankAccountName
      });
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating payment details:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update payment details" });
    }
  });
  app2.get("/api/vendor/can-create-courts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const canCreate = user.userType === "vendor" && user.vendorVerificationStatus === "verified";
      const verificationDetails = {
        canCreate,
        userType: user.userType,
        verificationStatus: user.vendorVerificationStatus,
        hasBusinessLicense: !!user.businessLicense
      };
      res.json({ ...verificationDetails, user });
    } catch (error) {
      console.error("Error checking vendor status:", error);
      res.status(500).json({ message: "Failed to check vendor status" });
    }
  });
  app2.get("/api/vendor/verification-status", isAuthenticated, async (req, res) => {
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
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
      );
      const aclPolicy = await objectStorageService.canAccessObjectEntity({
        objectFile,
        requestedPermission: "read" /* READ */
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
  app2.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      console.log("Upload URL request received from user:", req.user?.claims?.sub);
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log("Generated upload URL:", uploadURL);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL", message: error.message });
    }
  });
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  app2.post("/api/objects/upload-file", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const { uploadToCloudinary: uploadToCloudinary2 } = await Promise.resolve().then(() => (init_cloudinaryStorage(), cloudinaryStorage_exports));
      const url = await uploadToCloudinary2(req.file.buffer, req.file.mimetype, "fireflies");
      res.json({ url });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ error: "Failed to upload file", message: error.message });
    }
  });
  app2.get("/api/documents/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
      if (documentId.startsWith("doc_")) {
        const placeholderImageUrl = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjM4MCIgaGVpZ2h0PSIyODAiIGZpbGw9IndoaXRlIiBzdHJva2U9IiNEMUQ1REIiIHN0cm9rZS13aWR0aD0iMiIvPgo8dGV4dCB4PSIyMDAiIHk9IjEzMCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSI2MDAiPkRvY3VtZW50IFBsYWNlaG9sZGVyPC90ZXh0Pjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSIjOUI3QzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiI+VGhpcyBpcyBhIHBsYWNlaG9sZGVyIGZvciBvbGQgdXBsb2FkczwvdGV4dD48dGV4dCB4PSIyMDAiIHk9IjE3MCIgZmlsbD0iIzlCN0M4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPk5ldyB1cGxvYWRzIHdpbGwgc2hvdyByZWFsIGZpbGVzPC90ZXh0Pjwvc3ZnPg==";
        res.set({
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600"
        });
        const imageBuffer = Buffer.from(placeholderImageUrl.split(",")[1], "base64");
        res.send(imageBuffer);
        return;
      }
      res.status(404).json({ error: "Document not found" });
    } catch (error) {
      console.error("Error serving document:", error);
      res.status(500).json({ error: "Failed to serve document" });
    }
  });
  app2.post("/api/vendor/upload-document", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const { uploadToCloudinary: uploadToCloudinary2 } = await Promise.resolve().then(() => (init_cloudinaryStorage(), cloudinaryStorage_exports));
      const url = await uploadToCloudinary2(req.file.buffer, req.file.mimetype, "vendor-documents");
      res.json({ uploadURL: url, documentUrl: url });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document", message: error.message });
    }
  });
  app2.get("/api/courts", async (req, res) => {
    try {
      const { city, sport, search } = req.query;
      const courts2 = await storage.getCourts({
        city,
        sport,
        search
      });
      res.json(courts2);
    } catch (error) {
      console.error("Error fetching courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });
  app2.get("/api/courts/:id([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})", async (req, res) => {
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
  app2.get("/api/courts/:city/:sport", async (req, res) => {
    try {
      const { city, sport } = req.params;
      const { search, lat, lng, maxDistance, sortByDistance } = req.query;
      const courts2 = await storage.getCourts({
        city: city === "All Cities" ? void 0 : city,
        sport: sport === "All Sports" ? void 0 : sport,
        search,
        userLatitude: lat ? parseFloat(lat) : void 0,
        userLongitude: lng ? parseFloat(lng) : void 0,
        maxDistance: maxDistance ? parseFloat(maxDistance) : void 0,
        sortByDistance: sortByDistance === "true"
      });
      res.json(courts2);
    } catch (error) {
      console.error("Error fetching courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });
  app2.get("/api/bookings/availability/:courtId", async (req, res) => {
    try {
      const { courtId } = req.params;
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const bookings2 = await storage.getBookingsByCourtAndDate(courtId, date);
      const court = await storage.getCourtById(courtId);
      res.json({
        bookings: bookings2,
        facilityType: court?.facilityType || "shared_area",
        availableSports: court?.availableSports || [],
        sportCapacities: court?.sportCapacities || {}
      });
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });
  app2.post("/api/bookings", async (req, res) => {
    try {
      const {
        courtId,
        date,
        timeSlot,
        duration,
        totalAmount,
        selectedSport,
        sportSegments,
        courtsBooked: requestedCourts,
        // Guest booking fields
        isGuestBooking,
        guestName,
        guestEmail,
        guestPhone
        // Note: discount fields are NOT accepted from client - calculated server-side
      } = req.body;
      const courtsBooked = Math.max(1, parseInt(requestedCourts) || 1);
      const customerId = req.user?.claims?.sub || req.user?.id || null;
      if (!courtId || !date || !timeSlot || !duration || !totalAmount) {
        return res.status(400).json({ message: "Missing required booking fields" });
      }
      if (!customerId && isGuestBooking) {
        if (!guestName || !guestEmail || !guestPhone) {
          return res.status(400).json({ message: "Guest name, email, and phone are required for guest bookings" });
        }
      }
      const endTime = `${parseInt(timeSlot.split(":")[0]) + duration}:00`;
      let serverDiscountAmount = 0;
      let serverDiscountType = null;
      let isEligibleForDiscount = false;
      if (customerId) {
        const user = await storage.getUser(customerId);
        if (user && !user.hasUsedFirstDiscount) {
          isEligibleForDiscount = true;
          serverDiscountAmount = Math.round(Number(totalAmount) * 0.1);
          serverDiscountType = "first_booking";
        }
      }
      const originalAmount = Number(totalAmount);
      const finalAmount = isEligibleForDiscount ? originalAmount - serverDiscountAmount : originalAmount;
      const bookingData = {
        courtId,
        selectedSport: selectedSport || "General",
        sportSegments: sportSegments || null,
        bookingDate: date,
        timeSlot,
        startTime: timeSlot,
        endTime,
        duration,
        courtAmount: originalAmount.toString(),
        totalAmount: finalAmount.toString(),
        paymentMethod: "mpesa",
        paymentStatus: "pending",
        status: "confirmed"
      };
      if (customerId) {
        bookingData.customerId = customerId;
        bookingData.isGuestBooking = false;
        if (isEligibleForDiscount && serverDiscountAmount > 0) {
          bookingData.discountAmount = serverDiscountAmount.toString();
          bookingData.discountType = serverDiscountType;
          bookingData.originalAmount = originalAmount.toString();
          await storage.updateUser(customerId, { hasUsedFirstDiscount: true });
        }
      } else {
        bookingData.customerId = null;
        bookingData.isGuestBooking = true;
        bookingData.guestName = guestName;
        bookingData.guestEmail = guestEmail;
        bookingData.guestPhone = guestPhone;
      }
      const court = await storage.getCourtById(courtId);
      if (court && court.facilityType === "separate_areas" && selectedSport) {
        const sportCapacities = court.sportCapacities || {};
        const capacity = sportCapacities[selectedSport] ?? 1;
        const existingBookings = await storage.getBookingsByCourtAndDate(courtId, date);
        const startHour = parseInt(timeSlot.split(":")[0]);
        let alreadyBooked = 0;
        for (const b of existingBookings) {
          if (b.status === "cancelled") continue;
          const bStart = parseInt((b.startTime || b.timeSlot).split(":")[0]);
          const bEnd = bStart + (b.duration || 1);
          const overlapsSport = b.selectedSport === selectedSport || Array.isArray(b.sportSegments) && b.sportSegments.some(
            (seg) => seg.sport === selectedSport && seg.hour >= startHour && seg.hour < startHour + duration
          );
          const overlapsTime = startHour < bEnd && startHour + duration > bStart;
          if (overlapsTime && overlapsSport) {
            alreadyBooked += b.courtsBooked || 1;
          }
        }
        if (alreadyBooked + courtsBooked > capacity) {
          const remaining = Math.max(0, capacity - alreadyBooked);
          return res.status(409).json({
            message: remaining === 0 ? `All ${selectedSport} courts are fully booked at this time` : `Only ${remaining} court${remaining === 1 ? "" : "s"} available for ${selectedSport} at this time`
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
  app2.post("/api/reviews", isAuthenticated, async (req, res) => {
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
  app2.get("/api/courts/:id/reviews", async (req, res) => {
    try {
      const { id } = req.params;
      const reviews2 = await storage.getCourtReviews(id);
      res.json(reviews2);
    } catch (error) {
      console.error("Error fetching court reviews:", error);
      res.status(500).json({ message: "Failed to fetch court reviews" });
    }
  });
  app2.get("/api/reviews/:courtId", async (req, res) => {
    try {
      const reviews2 = await storage.getReviewsByCourt(req.params.courtId);
      res.json(reviews2);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/customer/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const reviews2 = await storage.getReviewsByCustomer(userId);
      res.json(reviews2);
    } catch (error) {
      console.error("Error fetching customer reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/customer/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const bookings2 = await storage.getBookingsByCustomer(userId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch booking history" });
    }
  });
  app2.get("/api/customer/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const bookings2 = await storage.getBookingsByCustomer(userId);
      const reviews2 = await storage.getReviewsByCustomer(userId);
      const profile = {
        ...user,
        totalBookings: bookings2.length,
        totalReviews: reviews2.length,
        recentBookings: bookings2.slice(0, 5),
        // Last 5 bookings
        memberSince: user.createdAt
      };
      res.json(profile);
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.put("/api/customer/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { firstName, lastName, profileImageUrl } = req.body;
      const updateData = {};
      if (firstName !== void 0) updateData.firstName = firstName;
      if (lastName !== void 0) updateData.lastName = lastName;
      if (profileImageUrl !== void 0) updateData.profileImageUrl = profileImageUrl;
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
  app2.get("/api/courts/:id/equipment/available", async (req, res) => {
    try {
      const equipment2 = await storage.getAvailableEquipmentByCourt(req.params.id);
      res.json(equipment2);
    } catch (error) {
      console.error("Error fetching available equipment:", error);
      res.status(500).json({ message: "Failed to fetch available equipment" });
    }
  });
  app2.post("/api/equipment", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const court = await storage.getCourtById(req.body.courtId);
      if (!court || court.vendorId !== userId) {
        return res.status(403).json({ message: "Access denied. You can only add equipment to your own courts." });
      }
      const equipment2 = await storage.createEquipment(req.body);
      res.status(201).json(equipment2);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });
  app2.put("/api/equipment/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const equipmentList = await storage.getEquipmentByCourt(req.body.courtId || "");
      const existingEquipment = equipmentList.find((e) => e.id === req.params.id);
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
  app2.delete("/api/equipment/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const allCourts = await storage.getCourtsByVendor(userId);
      let equipmentToDelete = null;
      for (const court of allCourts) {
        const courtEquipment = await storage.getEquipmentByCourt(court.id);
        equipmentToDelete = courtEquipment.find((e) => e.id === req.params.id);
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
  app2.put("/api/vendor/courts/:id/gallery", isAuthenticated, async (req, res) => {
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
      const imageList = Array.isArray(images) ? images : [];
      const coverUrl = imageUrl || (imageList.length > 0 ? imageList[0] : null);
      const publicizedImages = [];
      const objectStorageService = new ObjectStorageService();
      for (const url of imageList) {
        try {
          const publicPath = await objectStorageService.trySetObjectEntityAclPolicy(url, {
            owner: userId,
            visibility: "public"
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
            visibility: "public"
          });
        } catch {
        }
      }
      const updatedCourt = await storage.updateCourt(req.params.id, userId, {
        images: publicizedImages,
        imageUrl: publicCoverUrl ?? null
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
  app2.put("/api/vendor/courts/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }
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
      await storage.createNotification({
        userId: "admin",
        // This should be actual admin user ID
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
  app2.post("/api/reviews/:reviewId/helpful", isAuthenticated, async (req, res) => {
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
  app2.post("/api/reviews/:reviewId/report", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/courts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }
      const courts2 = await storage.getCourtsByVendor(userId);
      res.json(courts2);
    } catch (error) {
      console.error("Error fetching vendor courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });
  app2.get("/api/default-commission-rate", async (req, res) => {
    try {
      const defaultRate = 15;
      res.json({ defaultCommissionRate: defaultRate });
    } catch (error) {
      console.error("Error fetching default commission rate:", error);
      res.status(500).json({ message: "Failed to fetch default commission rate" });
    }
  });
  const publicizeCourtImages = async (vendorId, imageUrls) => {
    const objectStorageService = new ObjectStorageService();
    const publicPaths = [];
    for (const url of imageUrls) {
      try {
        const publicPath = await objectStorageService.trySetObjectEntityAclPolicy(url, {
          owner: vendorId,
          visibility: "public"
        });
        publicPaths.push(publicPath);
      } catch {
        publicPaths.push(url);
      }
    }
    return publicPaths;
  };
  app2.post("/api/courts", isAuthenticated, async (req, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      if (!vendorId) {
        return res.status(401).json({ message: "Authentication required" });
      }
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
          message: statusMessages[vendor.vendorVerificationStatus] || "Vendor verification required.",
          code: "NOT_VERIFIED",
          verificationStatus: vendor.vendorVerificationStatus
        });
      }
      console.log("Creating court with data:", req.body);
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
      if (typeof req.body.availableSports === "string") {
        req.body.availableSports = [req.body.availableSports];
      }
      if (typeof req.body.availableDays === "string") {
        req.body.availableDays = [req.body.availableDays];
      }
      if (typeof req.body.images === "string") {
        req.body.images = [req.body.images];
      }
      const courtData = insertCourtSchema.parse(req.body);
      console.log("Parsed court data:", courtData);
      const court = await storage.createCourt(vendorId, courtData);
      res.status(201).json(court);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        console.error("Zod validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid court data", errors: error.errors });
      }
      console.error("Error creating court:", error);
      res.status(500).json({ message: "Failed to create court" });
    }
  });
  app2.put("/api/courts/:id", isAuthenticated, async (req, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid court data", errors: error.errors });
      }
      console.error("Error updating court:", error);
      res.status(500).json({ message: "Failed to update court" });
    }
  });
  app2.delete("/api/courts/:id", isAuthenticated, async (req, res) => {
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
  app2.put("/api/courts/:id/image", isAuthenticated, async (req, res) => {
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
          visibility: "public"
          // Court images should be publicly accessible
        }
      );
      const court = await storage.updateCourt(req.params.id, vendorId, {
        imageUrl: objectPath
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
  app2.post("/api/courts/:id/images", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const court = await storage.getCourtById(req.params.id);
      if (!court || court.vendorId !== vendorId) {
        return res.status(404).json({ message: "Court not found or unauthorized" });
      }
      const objectStorageService = new ObjectStorageService();
      const { randomUUID: randomUUID4 } = await import("crypto");
      const objectId = randomUUID4();
      const privateObjectDir = objectStorageService.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/uploads/${objectId}`;
      const pathParts = fullPath.startsWith("/") ? fullPath.split("/") : `/${fullPath}`.split("/");
      const bucketName = pathParts[1];
      const objectName = pathParts.slice(2).join("/");
      const { objectStorageClient: objectStorageClient2 } = await Promise.resolve().then(() => (init_objectStorage(), objectStorage_exports));
      const bucket = objectStorageClient2.bucket(bucketName);
      const file = bucket.file(objectName);
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false
      });
      const servingUrl = `/objects/uploads/${objectId}`;
      await objectStorageService.trySetObjectEntityAclPolicy(servingUrl, {
        owner: vendorId,
        visibility: "public"
      });
      const currentImages = court.images || [];
      const updatedImages = [...currentImages, servingUrl];
      await storage.updateCourt(req.params.id, vendorId, { images: updatedImages });
      res.json({ url: servingUrl, images: updatedImages });
    } catch (error) {
      console.error("Error uploading gallery image:", error);
      res.status(500).json({ error: "Failed to upload gallery image", message: error.message });
    }
  });
  app2.delete("/api/courts/:id/images", isAuthenticated, async (req, res) => {
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
      const updatedImages = currentImages.filter((img) => img !== imageUrl);
      await storage.updateCourt(req.params.id, vendorId, { images: updatedImages });
      res.json({ images: updatedImages });
    } catch (error) {
      console.error("Error removing gallery image:", error);
      res.status(500).json({ error: "Failed to remove gallery image", message: error.message });
    }
  });
  app2.get("/api/courts/:courtId/equipment", async (req, res) => {
    try {
      const equipment2 = await storage.getEquipmentByCourt(req.params.courtId);
      res.json(equipment2);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });
  app2.post("/api/equipment", isAuthenticated, async (req, res) => {
    try {
      const equipmentData = insertEquipmentSchema.parse(req.body);
      const equipment2 = await storage.createEquipment(equipmentData);
      res.status(201).json(equipment2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid equipment data", errors: error.errors });
      }
      console.error("Error creating equipment:", error);
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });
  app2.get("/api/bookings/customer", isAuthenticated, async (req, res) => {
    try {
      const customerId = req.user?.claims?.sub || req.user?.id;
      const bookings2 = await storage.getBookingsByCustomer(customerId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/bookings/vendor", isAuthenticated, async (req, res) => {
    try {
      const vendorId = req.user?.claims?.sub || req.user?.id;
      const bookings2 = await storage.getBookingsByVendor(vendorId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/bookings/:id", isAuthenticated, async (req, res) => {
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
  app2.put("/api/bookings/:id/status", isAuthenticated, async (req, res) => {
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
  app2.post("/api/bookings/:id/cancel", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
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
      const bookingDateTime = /* @__PURE__ */ new Date(`${booking.bookingDate}T${booking.startTime}`);
      const now = /* @__PURE__ */ new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1e3 * 60 * 60);
      const isFullRefund = hoursUntilBooking >= 2;
      const cancelled = await storage.updateBookingStatus(booking.id, "cancelled");
      if (isFullRefund) {
        try {
          const paidReceipt = booking.mpesaReceiptNumber || booking.mpesa_receipt_number;
          const paidPhone = booking.mpesaPhoneNumber || booking.mpesa_phone_number || booking.customerPhone || booking.phoneNumber;
          const paidAmount = booking.totalAmount;
          const wasPaid = booking.paymentStatus === "completed" && paidReceipt;
          if (wasPaid && paidPhone && Number(paidAmount) > 0) {
            const existing = await db.select().from(refunds).where(eqAdmin(refunds.bookingId, booking.id));
            if (existing.length === 0) {
              await db.insert(refunds).values({
                bookingId: booking.id,
                customerPhone: String(paidPhone),
                amount: String(paidAmount),
                originalReceipt: String(paidReceipt),
                reason: "Customer cancellation (>2h before slot)",
                status: "pending"
              });
            }
            await storage.updateBookingPayment(booking.id, { paymentStatus: "refunded" });
            console.log("Full refund owed + booking marked refunded:", booking.id, paidAmount);
          } else {
            console.log("Cancelled >2h but no paid amount to refund:", booking.id);
          }
        } catch (refundErr) {
          console.error("Refund record creation failed (cancellation still succeeded):", refundErr);
        }
      } else {
        console.log("Late cancellation (<2h) \u2014 slot freed, no refund, vendor keeps share:", booking.id);
      }
      (async () => {
        try {
          const court = await storage.getCourt(booking.courtId);
          const formatTime = (t) => {
            const [h, m] = t.split(":");
            const hour = parseInt(h);
            return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
          };
          const formattedDate = new Date(booking.bookingDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
          });
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
              bookingId: booking.id
            });
          }
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
                bookingId: booking.id
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
  app2.get("/api/admin/me", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ isAdmin: false });
    const email = req.user?.email;
    if (!email) return res.status(401).json({ isAdmin: false });
    const admin = await isAdminEmail(email);
    if (!admin) return res.status(403).json({ isAdmin: false });
    res.json({ isAdmin: true, role: admin.role, email: admin.email });
  });
  app2.get("/api/admin/auth", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ authenticated: false });
    const email = req.user?.email;
    const admin = email ? await isAdminEmail(email) : null;
    if (!admin) return res.status(403).json({ authenticated: false });
    res.json({ authenticated: true, adminId: email, role: admin.role });
  });
  app2.post("/api/admin/login", (req, res) => {
    res.status(400).json({ message: "Use Google OAuth. Visit /api/auth/google" });
  });
  app2.post("/api/admin/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  app2.get("/api/admin/admins", requireOwner, async (req, res) => {
    try {
      const admins = await db.select().from(adminUsers);
      res.json(admins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admins" });
    }
  });
  app2.post("/api/admin/admins", requireOwner, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const existing = await db.select().from(adminUsers).where(eqAdmin(adminUsers.email, email));
      if (existing.length > 0) return res.status(409).json({ message: "Already an admin" });
      const [newAdmin] = await db.insert(adminUsers).values({ email, role: "admin", addedBy: req.adminUser.email }).returning();
      res.json(newAdmin);
    } catch (error) {
      res.status(500).json({ message: "Failed to add admin" });
    }
  });
  app2.delete("/api/admin/admins/:email", requireOwner, async (req, res) => {
    try {
      const { email } = req.params;
      if (email === req.adminUser.email) return res.status(400).json({ message: "Cannot remove yourself" });
      const target = await db.select().from(adminUsers).where(eqAdmin(adminUsers.email, email));
      if (!target[0]) return res.status(404).json({ message: "Admin not found" });
      if (target[0].role === "owner") return res.status(403).json({ message: "Cannot remove owner" });
      await db.delete(adminUsers).where(eqAdmin(adminUsers.email, email));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove admin" });
    }
  });
  app2.get("/api/venue-templates", async (req, res) => {
    try {
      const { VENUE_TEMPLATES: VENUE_TEMPLATES2 } = await Promise.resolve().then(() => (init_venueTemplates(), venueTemplates_exports));
      const templates = VENUE_TEMPLATES2.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        capacity: t.capacity,
        sections: t.sections
      }));
      res.json(templates);
    } catch (error) {
      console.error("Error fetching venue templates:", error);
      res.status(500).json({ message: "Failed to fetch venue templates" });
    }
  });
  app2.get("/api/venue-templates/:id", async (req, res) => {
    try {
      const { getTemplateById: getTemplateById2 } = await Promise.resolve().then(() => (init_venueTemplates(), venueTemplates_exports));
      const template = getTemplateById2(req.params.id);
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
  app2.get("/api/venues", async (req, res) => {
    try {
      const { city, search, lat, lng, maxDistance, sortByDistance } = req.query;
      const venues2 = await storage.getVenues({
        city,
        search,
        userLatitude: lat ? parseFloat(lat) : void 0,
        userLongitude: lng ? parseFloat(lng) : void 0,
        maxDistance: maxDistance ? parseFloat(maxDistance) : void 0,
        sortByDistance: sortByDistance === "true"
      });
      res.json(venues2);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });
  app2.get("/api/venues/:id", async (req, res) => {
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
  app2.post("/api/venues", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const verification = await verifyVendorStatus(userId);
      if (verification.error) {
        return res.status(verification.error.status).json(verification.error);
      }
      const validatedData = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(userId, validatedData);
      res.json(venue);
    } catch (error) {
      console.error("Error creating venue:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid venue data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create venue" });
    }
  });
  app2.put("/api/venues/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
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
  app2.delete("/api/venues/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/venues", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const venues2 = await storage.getVenuesByVendor(userId);
      res.json(venues2);
    } catch (error) {
      console.error("Error fetching vendor venues:", error);
      res.status(500).json({ message: "Failed to fetch vendor venues" });
    }
  });
  app2.get("/api/events", async (req, res) => {
    try {
      const { city, category, search, dateFrom, dateTo, lat, lng, maxDistance, sortByDistance } = req.query;
      const events2 = await storage.getEvents({
        city,
        category,
        search,
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0,
        userLatitude: lat ? parseFloat(lat) : void 0,
        userLongitude: lng ? parseFloat(lng) : void 0,
        maxDistance: maxDistance ? parseFloat(maxDistance) : void 0,
        sortByDistance: sortByDistance === "true"
      });
      res.json(events2);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  app2.get("/api/events/:id", async (req, res) => {
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
  app2.post("/api/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const verification = await verifyVendorStatus(userId);
      if (verification.error) {
        return res.status(verification.error.status).json(verification.error);
      }
      const { event: eventData, ticketTiers: ticketTiers2 } = req.body.event ? req.body : { event: req.body, ticketTiers: [] };
      const validatedEvent = insertEventSchema.parse(eventData);
      const venue = await storage.getVenueById(validatedEvent.venueId);
      if (!venue || venue.vendorId !== userId) {
        return res.status(403).json({
          message: "Access denied. You can only create events at your own venues.",
          code: "VENUE_NOT_OWNED"
        });
      }
      const createdEvent = await storage.createEvent(userId, validatedEvent);
      if (ticketTiers2 && ticketTiers2.length > 0) {
        const validatedTiers = ticketTiers2.map(
          (tier) => insertTicketTierSchema.parse({ ...tier, eventId: createdEvent.id })
        );
        await Promise.all(
          validatedTiers.map((tier) => storage.createTicketTier(tier))
        );
      }
      res.json(createdEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  app2.put("/api/events/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
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
  app2.delete("/api/events/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/events", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const events2 = await storage.getEventsByVendor(userId);
      res.json(events2);
    } catch (error) {
      console.error("Error fetching vendor events:", error);
      res.status(500).json({ message: "Failed to fetch vendor events" });
    }
  });
  app2.get("/api/events/:eventId/ticket-tiers", async (req, res) => {
    try {
      const ticketTiers2 = await storage.getTicketTiersByEvent(req.params.eventId);
      res.json(ticketTiers2);
    } catch (error) {
      console.error("Error fetching ticket tiers:", error);
      res.status(500).json({ message: "Failed to fetch ticket tiers" });
    }
  });
  app2.post("/api/ticket-tiers", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTicketTierSchema.parse(req.body);
      const ticketTier = await storage.createTicketTier(validatedData);
      res.json(ticketTier);
    } catch (error) {
      console.error("Error creating ticket tier:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid ticket tier data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create ticket tier" });
    }
  });
  app2.put("/api/ticket-tiers/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/ticket-tiers/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/event-bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const validatedData = insertEventBookingSchema.parse({
        ...req.body,
        customerId: userId
      });
      const bookingCode = `FB${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const booking = await storage.createEventBooking({
        ...validatedData,
        bookingCode
      });
      res.json(booking);
    } catch (error) {
      console.error("Error creating event booking:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event booking" });
    }
  });
  app2.get("/api/event-bookings/customer", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const bookings2 = await storage.getEventBookingsByCustomer(userId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching customer event bookings:", error);
      res.status(500).json({ message: "Failed to fetch customer event bookings" });
    }
  });
  app2.get("/api/event-bookings/vendor", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const bookings2 = await storage.getEventBookingsByVendor(userId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching vendor event bookings:", error);
      res.status(500).json({ message: "Failed to fetch vendor event bookings" });
    }
  });
  app2.get("/api/event-bookings/:id", isAuthenticated, async (req, res) => {
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
  app2.put("/api/event-bookings/:id/status", isAuthenticated, async (req, res) => {
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
  app2.get("/api/venues/:id/seat-map", async (req, res) => {
    try {
      const venueId = req.params.id;
      const sections = await storage.getSeatSectionsByVenue(venueId);
      const seats2 = await storage.getSeatsByVenue(venueId);
      res.json({ sections, seats: seats2 });
    } catch (error) {
      console.error("Error fetching seat map:", error);
      res.status(500).json({ message: "Failed to fetch seat map" });
    }
  });
  app2.post("/api/venues/:id/seat-map", isAuthenticated, async (req, res) => {
    try {
      const venueId = req.params.id;
      const userId = req.user?.claims?.sub || req.user?.id;
      const { sections, seats: seats2 } = req.body;
      const venue = await storage.getVenueById(venueId);
      if (!venue || venue.vendorId !== userId) {
        return res.status(403).json({ message: "Unauthorized to modify this venue" });
      }
      if (!Array.isArray(sections) || !Array.isArray(seats2)) {
        return res.status(400).json({ message: "Invalid seat map data" });
      }
      const existingSections = await storage.getSeatSectionsByVenue(venueId);
      for (const section of existingSections) {
        await storage.deleteSeatSection(section.id);
      }
      const createdSections = [];
      const sectionIdMap = /* @__PURE__ */ new Map();
      for (const section of sections) {
        const { tempId, ...sectionData } = section;
        const created = await storage.createSeatSection({
          venueId,
          name: sectionData.name,
          color: sectionData.color,
          basePrice: sectionData.basePrice,
          description: sectionData.description || null
        });
        createdSections.push(created);
        if (tempId) {
          sectionIdMap.set(tempId, created.id);
        }
      }
      const seatsToCreate = seats2.map((seat) => {
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
          isAccessible: seatData.isAccessible || false
        };
      });
      const createdSeats = await storage.bulkCreateSeats(seatsToCreate);
      await storage.updateVenue(venueId, userId, { hasSeatMap: true });
      res.json({ sections: createdSections, seats: createdSeats });
    } catch (error) {
      console.error("Error saving seat map:", error);
      res.status(500).json({ message: "Failed to save seat map" });
    }
  });
  app2.get("/api/events/:id/seat-availability", async (req, res) => {
    try {
      const eventId = req.params.id;
      await storage.releaseExpiredReservations(eventId);
      const availability = await storage.getEventSeatAvailability(eventId);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching seat availability:", error);
      res.status(500).json({ message: "Failed to fetch seat availability" });
    }
  });
  app2.post("/api/events/:id/reserve-seats", isAuthenticated, async (req, res) => {
    try {
      const eventId = req.params.id;
      const { seatIds } = req.body;
      if (!Array.isArray(seatIds) || seatIds.length === 0) {
        return res.status(400).json({ message: "Seat IDs are required" });
      }
      await storage.releaseExpiredReservations(eventId);
      const availability = await storage.getEventSeatAvailability(eventId);
      const unavailableSeats = seatIds.filter((seatId) => {
        const seat = availability.find((a) => a.seat.id === seatId);
        return !seat || seat.status !== "available";
      });
      if (unavailableSeats.length > 0) {
        return res.status(409).json({
          message: "Some seats are no longer available",
          unavailableSeats
        });
      }
      try {
        const reservations = await storage.reserveEventSeats(eventId, seatIds);
        res.json(reservations);
      } catch (dbError) {
        if (dbError.code === "23505") {
          return res.status(409).json({
            message: "Some seats were just reserved by another user"
          });
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Error reserving seats:", error);
      res.status(500).json({ message: "Failed to reserve seats" });
    }
  });
  app2.get("/api/admin/courts/all", requireAdmin, async (req, res) => {
    try {
      const courts2 = await storage.getAllCourtsWithDetails();
      res.json(courts2);
    } catch (error) {
      console.error("Error fetching all courts:", error);
      res.status(500).json({ message: "Failed to fetch all courts" });
    }
  });
  app2.put("/api/admin/courts/:id/commission", requireAdmin, async (req, res) => {
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
  app2.get("/api/admin/pending-vendors", requireAdmin, async (req, res) => {
    try {
      const pendingVendors = await storage.getPendingVendors();
      res.json(pendingVendors);
    } catch (error) {
      console.error("Error fetching pending vendors:", error);
      res.status(500).json({ message: "Failed to fetch pending vendors" });
    }
  });
  app2.post("/api/admin/approve-vendor/:vendorId", requireAdmin, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const updatedVendor = await storage.updateVendorStatus(vendorId, "verified");
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      try {
        const vendorEmail = updatedVendor.email || "";
        const vendorName = `${updatedVendor.firstName || ""} ${updatedVendor.lastName || ""}`.trim() || "Vendor";
        if (vendorEmail) {
          await EmailService.sendVendorApproved({ vendorEmail, vendorName });
        }
      } catch (emailError) {
        console.warn("Failed to send vendor approval email:", emailError);
      }
      res.json({ message: "Vendor approved successfully", vendor: updatedVendor });
    } catch (error) {
      console.error("Error approving vendor:", error);
      res.status(500).json({ message: "Failed to approve vendor" });
    }
  });
  app2.post("/api/admin/reject-vendor/:vendorId", requireAdmin, async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { reason } = req.body;
      const updatedVendor = await storage.updateVendorStatus(vendorId, "rejected");
      if (!updatedVendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      try {
        const vendorEmail = updatedVendor.email || "";
        const vendorName = `${updatedVendor.firstName || ""} ${updatedVendor.lastName || ""}`.trim() || "Vendor";
        if (vendorEmail) {
          await EmailService.sendVendorRejected({ vendorEmail, vendorName, reason });
        }
      } catch (emailError) {
        console.warn("Failed to send vendor rejection email:", emailError);
      }
      res.json({ message: "Vendor rejected successfully", vendor: updatedVendor });
    } catch (error) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({ message: "Failed to reject vendor" });
    }
  });
  app2.get("/api/admin/pending-courts", requireAdmin, async (req, res) => {
    try {
      const pendingCourts = await storage.getPendingCourts();
      res.json(pendingCourts);
    } catch (error) {
      console.error("Error fetching pending courts:", error);
      res.status(500).json({ message: "Failed to fetch pending courts" });
    }
  });
  app2.put("/api/admin/courts/:id/approve", requireAdmin, async (req, res) => {
    try {
      const { adminNotes } = req.body;
      const court = await storage.approveCourt(req.params.id, adminNotes);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      try {
        const vendor = await storage.getUser(court.vendorId);
        if (vendor) {
          await EnhancedNotificationService.sendCourtApprovalNotification({
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorPhone: vendor.phoneNumber || void 0,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            courtName: court.name,
            approved: true
          });
        }
      } catch (notificationError) {
        console.error("Error sending court approval notification:", notificationError);
      }
      res.json(court);
    } catch (error) {
      console.error("Error approving court:", error);
      res.status(500).json({ message: "Failed to approve court" });
    }
  });
  app2.put("/api/admin/courts/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { adminNotes } = req.body;
      const court = await storage.rejectCourt(req.params.id, adminNotes);
      if (!court) {
        return res.status(404).json({ message: "Court not found" });
      }
      try {
        const vendor = await storage.getUser(court.vendorId);
        if (vendor) {
          await EnhancedNotificationService.sendCourtApprovalNotification({
            vendorId: vendor.id,
            vendorEmail: vendor.email,
            vendorPhone: vendor.phoneNumber || void 0,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            courtName: court.name,
            approved: false,
            rejectionReason: adminNotes || "Please review and update your court information."
          });
        }
      } catch (notificationError) {
        console.error("Error sending court rejection notification:", notificationError);
      }
      res.json(court);
    } catch (error) {
      console.error("Error rejecting court:", error);
      res.status(500).json({ message: "Failed to reject court" });
    }
  });
  app2.get("/api/admin/pending-venues", requireAdmin, async (req, res) => {
    try {
      const pendingVenues = await storage.getPendingVenues();
      res.json(pendingVenues);
    } catch (error) {
      console.error("Error fetching pending venues:", error);
      res.status(500).json({ message: "Failed to fetch pending venues" });
    }
  });
  app2.put("/api/admin/venues/:id/approve", requireAdmin, async (req, res) => {
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
  app2.put("/api/admin/venues/:id/reject", requireAdmin, async (req, res) => {
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
  app2.get("/api/admin/pending-events", requireAdmin, async (req, res) => {
    try {
      const pendingEvents = await storage.getPendingEvents();
      res.json(pendingEvents);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      res.status(500).json({ message: "Failed to fetch pending events" });
    }
  });
  app2.put("/api/admin/events/:id/approve", requireAdmin, async (req, res) => {
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
  app2.put("/api/admin/events/:id/reject", requireAdmin, async (req, res) => {
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
  app2.post("/api/admin/seed-courts", requireAdmin, async (req, res) => {
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
          approvalStatus: "approved",
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
          approvalStatus: "approved",
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
          approvalStatus: "approved",
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
          approvalStatus: "approved",
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
          approvalStatus: "approved",
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
          approvalStatus: "approved",
          commissionRate: "15.00"
        }
      ];
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
  app2.delete("/api/admin/courts/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
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
  app2.get("/api/admin/courts/:courtId/analytics", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
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
  app2.get("/api/admin/courts/analytics/overview", isAuthenticated, async (req, res) => {
    try {
      const user = req.user;
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
  app2.get("/api/vendor/stats", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/courts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }
      const courts2 = await storage.getCourtsByVendor(userId);
      res.json(courts2);
    } catch (error) {
      console.error("Error fetching vendor courts:", error);
      res.status(500).json({ message: "Failed to fetch courts" });
    }
  });
  app2.get("/api/vendor/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }
      const bookings2 = await storage.getBookingsByVendor(userId);
      res.json(bookings2);
    } catch (error) {
      console.error("Error fetching vendor bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });
  app2.get("/api/vendor/check", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/analytics/courts", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/analytics/cities", isAuthenticated, async (req, res) => {
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
  app2.get("/api/vendor/event-bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user || user.userType !== "vendor") {
        return res.status(403).json({ message: "Access denied. Vendor account required." });
      }
      const eventBookings2 = await storage.getEventBookingsByVendor(userId);
      res.json(eventBookings2);
    } catch (error) {
      console.error("Error fetching vendor event bookings:", error);
      res.status(500).json({ message: "Failed to fetch event bookings" });
    }
  });
  app2.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;
      const notifications2 = await storage.getUserNotifications(userId, limit, offset);
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/notifications/count", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const count2 = await storage.getUnreadNotificationCount(userId);
      res.json({ count: count2 });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Failed to fetch notification count" });
    }
  });
  app2.post("/api/notifications/:notificationId/read", isAuthenticated, async (req, res) => {
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
  app2.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/notifications/:notificationId", isAuthenticated, async (req, res) => {
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
  app2.get("/api/notification-preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      let preferences = await storage.getUserNotificationPreferences(userId);
      if (!preferences) {
        preferences = await storage.createUserNotificationPreferences({
          userId,
          bookingConfirmations: true,
          bookingReminders: true,
          bookingCancellations: true,
          vendorBookingAlerts: true
        });
      }
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
      res.status(500).json({ message: "Failed to fetch notification preferences" });
    }
  });
  app2.put("/api/notification-preferences", isAuthenticated, async (req, res) => {
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
  app2.post("/api/test/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { type } = req.body;
      switch (type) {
        case "booking_confirmation":
          await EnhancedNotificationService.sendBookingConfirmation({
            bookingId: "TEST-BOOKING-123",
            customerId: user.id,
            customerEmail: user.email,
            customerPhone: user.phoneNumber || void 0,
            customerName: `${user.firstName} ${user.lastName}`,
            courtName: "Test Basketball Court",
            bookingDate: (/* @__PURE__ */ new Date()).toLocaleDateString("en-KE"),
            startTime: "10:00 AM",
            endTime: "11:00 AM",
            totalAmount: "2500",
            equipmentRented: ["Basketball", "Court Shoes"]
          });
          break;
        case "email_test":
          await EmailService.sendEmail({
            to: user.email,
            subject: "SportsBox Kenya - Email Test Successful!",
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
          return res.status(400).json({ message: "Invalid notification type" });
      }
      res.json({
        success: true,
        message: `Test ${type} notification sent successfully!`,
        recipient: user.email
      });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ message: "Failed to send test notification" });
    }
  });
  app2.post("/api/mpesa/stkpush/booking", async (req, res) => {
    try {
      const { bookingId, phone } = req.body;
      if (!bookingId || !phone) {
        return res.status(400).json({ message: "Booking ID and phone number are required" });
      }
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
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
        transactionDesc: "Court Booking"
      });
      await storage.updateBookingPayment(bookingId, {
        mpesaCheckoutRequestId: response.CheckoutRequestID,
        mpesaMerchantRequestId: response.MerchantRequestID,
        mpesaPhoneNumber: formatPhoneNumber(phone)
      });
      res.json({
        success: true,
        message: "Payment prompt sent to your phone",
        checkoutRequestId: response.CheckoutRequestID,
        customerMessage: response.CustomerMessage
      });
    } catch (error) {
      console.error("M-Pesa STK Push error:", error);
      res.status(500).json({ message: error.message || "Failed to initiate payment" });
    }
  });
  app2.post("/api/mpesa/stkpush/event-booking", isAuthenticated, async (req, res) => {
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
        transactionDesc: "Event Ticket"
      });
      await storage.updateEventBookingPayment(eventBookingId, {
        mpesaCheckoutRequestId: response.CheckoutRequestID,
        mpesaMerchantRequestId: response.MerchantRequestID,
        mpesaPhoneNumber: formatPhoneNumber(phone)
      });
      res.json({
        success: true,
        message: "Payment prompt sent to your phone",
        checkoutRequestId: response.CheckoutRequestID,
        customerMessage: response.CustomerMessage
      });
    } catch (error) {
      console.error("M-Pesa STK Push error:", error);
      res.status(500).json({ message: error.message || "Failed to initiate payment" });
    }
  });
  app2.post("/api/mpesa/callback", async (req, res) => {
    try {
      console.log("===== M-PESA CALLBACK RECEIVED =====");
      console.log(JSON.stringify(req.body, null, 2));
      const callbackData = parseCallbackData(req.body);
      if (callbackData.success) {
        console.log("\u2705 M-Pesa Payment successful!");
        console.log("Receipt:", callbackData.mpesaReceiptNumber);
        console.log("Amount:", callbackData.amount);
        console.log("Phone:", callbackData.phoneNumber);
        const booking = await storage.getBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (booking) {
          await storage.updateBookingPayment(booking.id, {
            paymentStatus: "completed",
            mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
            mpesaTransactionDate: callbackData.transactionDate
          });
          console.log("Court booking payment updated:", booking.id);
          try {
            const court = await storage.getCourtById(booking.courtId);
            let recipientEmail;
            let recipientName;
            if (booking.isGuestBooking) {
              recipientEmail = booking.guestEmail ?? void 0;
              recipientName = booking.guestName || "Valued Guest";
            } else if (booking.customerId) {
              const customer = await storage.getUser(booking.customerId);
              recipientEmail = customer?.email ?? void 0;
              recipientName = `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || "Valued Customer";
            }
            if (recipientEmail && court) {
              await EmailService.sendBookingConfirmation({
                customerEmail: recipientEmail,
                customerName: recipientName,
                courtName: court.name,
                bookingDate: booking.date,
                startTime: booking.timeSlot,
                endTime: booking.endTime,
                totalAmount: booking.totalAmount?.toString() ?? "0",
                bookingId: booking.id
              });
              console.log("Post-payment confirmation email sent to:", recipientEmail);
            }
          } catch (emailError) {
            console.error("Failed to send post-payment confirmation email:", emailError);
          }
        }
        const eventBooking = await storage.getEventBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (eventBooking) {
          await storage.updateEventBookingPayment(eventBooking.id, {
            paymentStatus: "completed",
            mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
            mpesaTransactionDate: callbackData.transactionDate
          });
          console.log("Event booking payment updated:", eventBooking.id);
        }
      } else {
        console.log("\u274C M-Pesa Payment failed:", callbackData.resultDesc);
        const booking = await storage.getBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (booking) {
          await storage.updateBookingPayment(booking.id, {
            paymentStatus: "failed"
          });
        }
        const eventBooking = await storage.getEventBookingByCheckoutRequestId(callbackData.checkoutRequestId);
        if (eventBooking) {
          await storage.updateEventBookingPayment(eventBooking.id, {
            paymentStatus: "failed"
          });
        }
      }
      res.json({ ResultCode: 0, ResultDesc: "Success" });
    } catch (error) {
      console.error("M-Pesa callback error:", error);
      res.json({ ResultCode: 0, ResultDesc: "Success" });
    }
  });
  app2.get("/api/mpesa/query/booking/:bookingId", async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      const customerId = req.user?.claims?.sub || req.user?.id || null;
      if (!booking.isGuestBooking && booking.customerId !== customerId) {
        return res.status(403).json({ message: "Unauthorized to query this payment" });
      }
      if (!booking.mpesaCheckoutRequestId) {
        return res.status(400).json({ message: "No M-Pesa payment initiated for this booking" });
      }
      if (booking.paymentStatus === "completed") {
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: booking.mpesaReceiptNumber
        });
      }
      const response = await querySTKPushStatus(booking.mpesaCheckoutRequestId);
      const isSuccess = response.ResultCode === "0";
      if (isSuccess && booking.paymentStatus !== "completed") {
        const receiptNumber = getSimulatedReceiptNumber(booking.mpesaCheckoutRequestId) || void 0;
        await storage.updateBookingPayment(bookingId, {
          paymentStatus: "completed",
          mpesaReceiptNumber: receiptNumber
        });
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: receiptNumber,
          resultDesc: response.ResultDesc,
          isSimulation: isSimulationMode()
        });
      }
      res.json({
        success: isSuccess,
        status: isSuccess ? "completed" : "pending",
        resultDesc: response.ResultDesc,
        isSimulation: isSimulationMode()
      });
    } catch (error) {
      console.error("M-Pesa query error:", error);
      res.status(500).json({ message: error.message || "Failed to query payment status" });
    }
  });
  app2.get("/api/mpesa/query/event-booking/:eventBookingId", isAuthenticated, async (req, res) => {
    try {
      const { eventBookingId } = req.params;
      const eventBooking = await storage.getEventBooking(eventBookingId);
      if (!eventBooking) {
        return res.status(404).json({ message: "Event booking not found" });
      }
      if (!eventBooking.mpesaCheckoutRequestId) {
        return res.status(400).json({ message: "No M-Pesa payment initiated for this booking" });
      }
      if (eventBooking.paymentStatus === "completed") {
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: eventBooking.mpesaReceiptNumber
        });
      }
      const response = await querySTKPushStatus(eventBooking.mpesaCheckoutRequestId);
      const isSuccess = response.ResultCode === "0";
      if (isSuccess && eventBooking.paymentStatus !== "completed") {
        const receiptNumber = getSimulatedReceiptNumber(eventBooking.mpesaCheckoutRequestId) || void 0;
        await storage.updateEventBookingPayment(eventBookingId, {
          paymentStatus: "completed",
          mpesaReceiptNumber: receiptNumber
        });
        return res.json({
          success: true,
          status: "completed",
          mpesaReceiptNumber: receiptNumber,
          resultDesc: response.ResultDesc,
          isSimulation: isSimulationMode()
        });
      }
      res.json({
        success: isSuccess,
        status: isSuccess ? "completed" : "pending",
        resultDesc: response.ResultDesc,
        isSimulation: isSimulationMode()
      });
    } catch (error) {
      console.error("M-Pesa query error:", error);
      res.status(500).json({ message: error.message || "Failed to query payment status" });
    }
  });
  app2.get("/api/pitch/download", (req, res) => {
    try {
      generatePitchPDF(res);
    } catch (error) {
      console.error("Pitch PDF generation error:", error);
      res.status(500).json({ message: "Failed to generate pitch document" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
