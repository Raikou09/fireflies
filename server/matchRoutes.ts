import type { Express } from "express";
import { db } from "./db";
import { matches, matchParticipants, courts, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { isAuthenticated } from "./googleAuth";
import { storage } from "./storage";
import { initiateSTKPush, querySTKPushStatus } from "./mpesaService";

async function recomputeConfirming(matchId: string) {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match || match.status !== "confirming") return;
  const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
  const active = parts.filter(p => p.confirmStatus !== "dropped");
  if (active.length === 0) {
    await db.update(matches).set({ status: "cancelled", updatedAt: new Date() }).where(eq(matches.id, matchId));
    return;
  }
  const newPer = (Number(match.totalAmount) / active.length).toFixed(2);
  // If the per-spot price changed, reset all "confirmed" back to "none" so everyone re-confirms
  if (newPer !== Number(match.pricePerSpot).toFixed(2)) {
    await db.update(matches).set({ pricePerSpot: newPer, updatedAt: new Date() }).where(eq(matches.id, matchId));
    for (const p of active) {
      if (p.confirmStatus === "confirmed") {
        await db.update(matchParticipants).set({ confirmStatus: "none" }).where(eq(matchParticipants.id, p.id));
      }
    }
    return;
  }
  // Price stable — if everyone active has confirmed, lock the match to payment
  if (active.every(p => p.confirmStatus === "confirmed")) {
    await db.update(matches).set({ status: "full", totalSpots: active.length, updatedAt: new Date() }).where(eq(matches.id, matchId));
  }
}

async function maybeConfirmMatch(matchId: string) {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
  if (!match || match.status === "confirmed") return;
  const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
  if (parts.length < match.totalSpots) return;
  if (!parts.every(p => p.paymentStatus === "paid")) return;
  const startHour = parseInt(match.startTime.split(":")[0]);
  const endTime = `${startHour + match.duration}:00`;
  try {
    const booking = await storage.createBooking({
      courtId: match.courtId, selectedSport: match.sport, sportSegments: null,
      bookingDate: match.matchDate, timeSlot: match.startTime, startTime: match.startTime,
      endTime, duration: match.duration, courtAmount: match.totalAmount, totalAmount: match.totalAmount,
      paymentMethod: "mpesa", paymentStatus: "completed", status: "confirmed",
      customerId: match.creatorId, isGuestBooking: false, courtsBooked: 1,
    });
    await db.update(matches).set({ status: "confirmed", bookingId: booking.id, updatedAt: new Date() }).where(eq(matches.id, matchId));
  } catch (e) { console.error("Error creating booking from match:", e); }
}

export function registerMatchRoutes(app: Express) {
  app.post("/api/matches", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { courtId, sport, matchDate, startTime, duration, totalSpots, notes, communityId } = req.body;
      if (!courtId || !sport || !matchDate || !startTime || !totalSpots)
        return res.status(400).json({ message: "Missing required fields" });
      const spots = parseInt(totalSpots);
      if (isNaN(spots) || spots < 2) return res.status(400).json({ message: "Need at least 2 spots" });
      const dur = parseInt(duration) || 1;
      const [court] = await db.select().from(courts).where(eq(courts.id, courtId));
      if (!court) return res.status(404).json({ message: "Court not found" });
      const totalAmount = (Number(court.hourlyRate) || 0) * dur;
      const [match] = await db.insert(matches).values({
        creatorId: userId, courtId, sport, matchDate, startTime, duration: dur, totalSpots: spots,
        totalAmount: totalAmount.toFixed(2), pricePerSpot: (totalAmount / spots).toFixed(2),
        notes: notes || null, status: "open", communityId: communityId || null,
      }).returning();
      await db.insert(matchParticipants).values({ matchId: match.id, userId, paymentStatus: "unpaid" });
      res.status(201).json(match);
    } catch (e) { console.error("Error creating match:", e); res.status(500).json({ message: "Failed to create match" }); }
  });

  app.get("/api/matches", async (req, res) => {
    try {
      const { sport, city } = req.query;
      const rows = await db.select({ match: matches, courtName: courts.name, courtCity: courts.city, courtArea: courts.area })
        .from(matches).innerJoin(courts, eq(matches.courtId, courts.id))
        .where(eq(matches.status, "open")).orderBy(desc(matches.createdAt));
      const result = [];
      for (const r of rows) {
        if (sport && r.match.sport !== sport) continue;
        if (city && r.courtCity !== city) continue;
        const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, r.match.id));
        result.push({ ...r.match, courtName: r.courtName, courtCity: r.courtCity, courtArea: r.courtArea,
          filledSpots: parts.length, spotsRemaining: r.match.totalSpots - parts.length });
      }
      res.json(result);
    } catch (e) { console.error("Error fetching matches:", e); res.status(500).json({ message: "Failed to fetch matches" }); }
  });

  app.get("/api/matches/:id", async (req, res) => {
    try {
      const [row] = await db.select({ match: matches, courtName: courts.name, courtCity: courts.city, courtArea: courts.area })
        .from(matches).innerJoin(courts, eq(matches.courtId, courts.id)).where(eq(matches.id, req.params.id));
      if (!row) return res.status(404).json({ message: "Match not found" });
      const parts = await db.select({ participant: matchParticipants, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl })
        .from(matchParticipants).innerJoin(users, eq(matchParticipants.userId, users.id)).where(eq(matchParticipants.matchId, req.params.id));
      res.json({ ...row.match, courtName: row.courtName, courtCity: row.courtCity, courtArea: row.courtArea,
        participants: parts.map(p => ({ ...p.participant, firstName: p.firstName, lastName: p.lastName, profileImageUrl: p.profileImageUrl })),
        filledSpots: parts.length, spotsRemaining: row.match.totalSpots - parts.length });
    } catch (e) { console.error("Error fetching match:", e); res.status(500).json({ message: "Failed to fetch match" }); }
  });

  app.post("/api/matches/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "open") return res.status(400).json({ message: "This match is no longer open" });
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      if (parts.find(p => p.userId === userId)) return res.status(409).json({ message: "You already joined this match" });
      if (parts.length >= match.totalSpots) return res.status(400).json({ message: "This match is full" });
      await db.insert(matchParticipants).values({ matchId, userId, paymentStatus: "unpaid" });
      const newCount = parts.length + 1;
      if (newCount >= match.totalSpots) await db.update(matches).set({ status: "full", updatedAt: new Date() }).where(eq(matches.id, matchId));
      res.json({ success: true, filledSpots: newCount, isFull: newCount >= match.totalSpots });
    } catch (e) { console.error("Error joining match:", e); res.status(500).json({ message: "Failed to join match" }); }
  });

  app.post("/api/matches/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status === "confirmed") return res.status(400).json({ message: "Cannot leave a confirmed match" });
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      const mine = parts.find(p => p.userId === userId);
      if (!mine) return res.status(404).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.status(400).json({ message: "You already paid; contact support" });
      await db.delete(matchParticipants).where(eq(matchParticipants.id, mine.id));
      if (parts.length - 1 <= 0) await db.update(matches).set({ status: "cancelled", updatedAt: new Date() }).where(eq(matches.id, matchId));
      else if (match.status === "full") await db.update(matches).set({ status: "open", updatedAt: new Date() }).where(eq(matches.id, matchId));
      res.json({ success: true });
    } catch (e) { console.error("Error leaving match:", e); res.status(500).json({ message: "Failed to leave match" }); }
  });

  app.post("/api/matches/:id/pay", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id; const { phone } = req.body;
      if (!phone) return res.status(400).json({ message: "Phone number is required" });
      const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "full") return res.status(400).json({ message: "Payment opens once all spots are filled" });
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      const mine = parts.find(p => p.userId === userId);
      if (!mine) return res.status(403).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.status(400).json({ message: "You already paid" });
      const response = await initiateSTKPush({ phone, amount: Number(match.pricePerSpot),
        accountReference: `MT${matchId.slice(0, 8).toUpperCase()}`, transactionDesc: "Match Spot" });
      await db.update(matchParticipants).set({ mpesaCheckoutRequestId: response.CheckoutRequestID }).where(eq(matchParticipants.id, mine.id));
      res.json({ success: true, message: "Payment prompt sent to your phone", checkoutRequestId: response.CheckoutRequestID });
    } catch (e: any) { console.error("Match payment error:", e); res.status(500).json({ message: e.message || "Failed to initiate payment" }); }
  });

  app.get("/api/matches/:id/payment-status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id;
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      const mine = parts.find(p => p.userId === userId);
      if (!mine) return res.status(404).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.json({ status: "paid", mpesaReceiptNumber: mine.mpesaReceiptNumber });
      if (!mine.mpesaCheckoutRequestId) return res.json({ status: "unpaid" });
      let isSuccess = false;
      try { const r = await querySTKPushStatus(mine.mpesaCheckoutRequestId); isSuccess = r.ResultCode === "0"; }
      catch { return res.json({ status: "pending" }); }
      if (isSuccess) {
        await db.update(matchParticipants).set({ paymentStatus: "paid" }).where(eq(matchParticipants.id, mine.id));
        await maybeConfirmMatch(matchId);
        return res.json({ status: "paid" });
      }
      res.json({ status: "pending" });
    } catch (e) { console.error("Error checking match payment:", e); res.status(500).json({ message: "Failed to check payment" }); }
  });


  // Creator triggers the match early with fewer players
  app.post("/api/matches/:id/trigger-early", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.creatorId !== userId) return res.status(403).json({ message: "Only the creator can start early" });
      if (match.status !== "open") return res.status(400).json({ message: "Match is not open" });
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      if (parts.length < 1) return res.status(400).json({ message: "No players have joined" });
      const newPer = (Number(match.totalAmount) / parts.length).toFixed(2);
      await db.update(matches).set({ status: "confirming", pricePerSpot: newPer, updatedAt: new Date() }).where(eq(matches.id, matchId));
      // Reset everyone to "none" so they explicitly confirm the new price
      for (const p of parts) {
        await db.update(matchParticipants).set({ confirmStatus: "none" }).where(eq(matchParticipants.id, p.id));
      }
      res.json({ success: true, pricePerSpot: newPer, players: parts.length });
    } catch (e) { console.error("Error triggering early:", e); res.status(500).json({ message: "Failed to start early" }); }
  });

  // A participant confirms they're in at the current price
  app.post("/api/matches/:id/confirm", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      if (match.status !== "confirming") return res.status(400).json({ message: "Match is not in confirming stage" });
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      const mine = parts.find(p => p.userId === userId);
      if (!mine) return res.status(403).json({ message: "You are not in this match" });
      if (mine.confirmStatus === "dropped") return res.status(400).json({ message: "You already dropped out" });
      await db.update(matchParticipants).set({ confirmStatus: "confirmed" }).where(eq(matchParticipants.id, mine.id));
      await recomputeConfirming(matchId);
      res.json({ success: true });
    } catch (e) { console.error("Error confirming:", e); res.status(500).json({ message: "Failed to confirm" }); }
  });

  // A participant drops out during confirming (recalculates for the rest)
  app.post("/api/matches/:id/drop", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const matchId = req.params.id;
      const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
      if (!match) return res.status(404).json({ message: "Match not found" });
      const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
      const mine = parts.find(p => p.userId === userId);
      if (!mine) return res.status(403).json({ message: "You are not in this match" });
      if (mine.paymentStatus === "paid") return res.status(400).json({ message: "You already paid" });
      await db.update(matchParticipants).set({ confirmStatus: "dropped" }).where(eq(matchParticipants.id, mine.id));
      await recomputeConfirming(matchId);
      res.json({ success: true });
    } catch (e) { console.error("Error dropping:", e); res.status(500).json({ message: "Failed to drop out" }); }
  });

  app.get("/api/my-matches", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const myParts = await db.select().from(matchParticipants).where(eq(matchParticipants.userId, userId));
      const result = [];
      for (const mp of myParts) {
        const [row] = await db.select({ match: matches, courtName: courts.name, courtCity: courts.city })
          .from(matches).innerJoin(courts, eq(matches.courtId, courts.id)).where(eq(matches.id, mp.matchId));
        if (row) {
          const parts = await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, mp.matchId));
          result.push({ ...row.match, courtName: row.courtName, courtCity: row.courtCity, filledSpots: parts.length, myPaymentStatus: mp.paymentStatus });
        }
      }
      res.json(result);
    } catch (e) { console.error("Error fetching my matches:", e); res.status(500).json({ message: "Failed to fetch your matches" }); }
  });
}
