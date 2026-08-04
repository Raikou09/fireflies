import type { Express } from "express";
import { db } from "./db";
import { communities, communityMembers, users } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { isAuthenticated } from "./googleAuth";

export function registerCommunityRoutes(app: Express) {
  // Create a community
  app.post("/api/communities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const { name, description, imageUrl, sports, skillLevel, city, area, joinPolicy } = req.body;
      if (!name) return res.status(400).json({ message: "Name is required" });
      const [community] = await db.insert(communities).values({
        creatorId: userId, name, description: description || null, imageUrl: imageUrl || null,
        sports: Array.isArray(sports) ? sports : [], skillLevel: skillLevel || "all",
        city: city || null, area: area || null, joinPolicy: joinPolicy || "open",
      }).returning();
      await db.insert(communityMembers).values({ communityId: community.id, userId, role: "creator", status: "approved" });
      res.status(201).json(community);
    } catch (e) { console.error("Error creating community:", e); res.status(500).json({ message: "Failed to create community" }); }
  });

  // List communities (with member counts)
  app.get("/api/communities", async (req, res) => {
    try {
      const { sport, city, skillLevel } = req.query;
      const rows = await db.select().from(communities).orderBy(desc(communities.createdAt));
      const result = [];
      for (const c of rows) {
        if (sport && !(c.sports || []).includes(sport as string)) continue;
        if (city && c.city !== city) continue;
        if (skillLevel && c.skillLevel !== skillLevel) continue;
        const members = await db.select().from(communityMembers).where(and(eq(communityMembers.communityId, c.id), eq(communityMembers.status, "approved")));
        result.push({ ...c, memberCount: members.length });
      }
      res.json(result);
    } catch (e) { console.error("Error fetching communities:", e); res.status(500).json({ message: "Failed to fetch communities" }); }
  });

  // Get one community with members
  app.get("/api/communities/:id", async (req, res) => {
    try {
      const [community] = await db.select().from(communities).where(eq(communities.id, req.params.id));
      if (!community) return res.status(404).json({ message: "Community not found" });
      const members = await db.select({ member: communityMembers, firstName: users.firstName, lastName: users.lastName, profileImageUrl: users.profileImageUrl })
        .from(communityMembers).innerJoin(users, eq(communityMembers.userId, users.id)).where(eq(communityMembers.communityId, req.params.id));
      res.json({ ...community,
        members: members.filter(m => m.member.status === "approved").map(m => ({ ...m.member, firstName: m.firstName, lastName: m.lastName, profileImageUrl: m.profileImageUrl })),
        pendingMembers: members.filter(m => m.member.status === "pending").map(m => ({ ...m.member, firstName: m.firstName, lastName: m.lastName, profileImageUrl: m.profileImageUrl })),
        memberCount: members.filter(m => m.member.status === "approved").length });
    } catch (e) { console.error("Error fetching community:", e); res.status(500).json({ message: "Failed to fetch community" }); }
  });

  // Join (or request to join) a community
  app.post("/api/communities/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const communityId = req.params.id;
      const [community] = await db.select().from(communities).where(eq(communities.id, communityId));
      if (!community) return res.status(404).json({ message: "Community not found" });
      const existing = await db.select().from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
      if (existing.length > 0) return res.status(409).json({ message: "You already joined or requested" });
      const status = community.joinPolicy === "open" ? "approved" : "pending";
      await db.insert(communityMembers).values({ communityId, userId, role: "member", status });
      res.json({ success: true, status });
    } catch (e) { console.error("Error joining community:", e); res.status(500).json({ message: "Failed to join" }); }
  });

  // Leave a community
  app.post("/api/communities/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const communityId = req.params.id;
      const existing = await db.select().from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
      if (!existing[0]) return res.status(404).json({ message: "You are not a member" });
      if (existing[0].role === "creator") return res.status(400).json({ message: "Creator cannot leave their own community" });
      await db.delete(communityMembers).where(eq(communityMembers.id, existing[0].id));
      res.json({ success: true });
    } catch (e) { console.error("Error leaving community:", e); res.status(500).json({ message: "Failed to leave" }); }
  });

  // Approve a pending member (creator only)
  app.post("/api/communities/:id/approve/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id; const { id: communityId, userId: targetUserId } = req.params;
      const [community] = await db.select().from(communities).where(eq(communities.id, communityId));
      if (!community || community.creatorId !== userId) return res.status(403).json({ message: "Only the creator can approve members" });
      const [target] = await db.select().from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, targetUserId)));
      if (!target) return res.status(404).json({ message: "Request not found" });
      await db.update(communityMembers).set({ status: "approved" }).where(eq(communityMembers.id, target.id));
      res.json({ success: true });
    } catch (e) { console.error("Error approving member:", e); res.status(500).json({ message: "Failed to approve" }); }
  });

  // My communities
  app.get("/api/my-communities", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const mine = await db.select().from(communityMembers).where(eq(communityMembers.userId, userId));
      const result = [];
      for (const m of mine) {
        const [c] = await db.select().from(communities).where(eq(communities.id, m.communityId));
        if (c) result.push({ ...c, myRole: m.role, myStatus: m.status });
      }
      res.json(result);
    } catch (e) { console.error("Error fetching my communities:", e); res.status(500).json({ message: "Failed to fetch" }); }
  });
}
