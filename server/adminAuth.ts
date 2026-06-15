import { db } from "./db";
import { adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
export type { AdminUser } from "@shared/schema";

const OWNER_EMAIL = "tavish@dreamcatchers.tv";

export async function seedOwner() {
  try {
    const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, OWNER_EMAIL));
    if (existing.length === 0) {
      await db.insert(adminUsers).values({ email: OWNER_EMAIL, role: "owner", addedBy: "system" });
      console.log("Owner admin seeded:", OWNER_EMAIL);
    }
  } catch (error) { console.error("Error seeding owner:", error); }
}

export async function isAdminEmail(email: string) {
  try {
    const results = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return results[0] || null;
  } catch { return null; }
}

export const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "No email found" });
  const admin = await isAdminEmail(email);
  if (!admin) return res.status(403).json({ message: "Admin access required" });
  req.adminUser = admin;
  next();
};

export const requireOwner = async (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Authentication required" });
  const email = req.user?.email;
  if (!email) return res.status(401).json({ message: "No email found" });
  const results = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  const admin = results[0];
  if (!admin || admin.role !== "owner") return res.status(403).json({ message: "Owner access required" });
  req.adminUser = admin;
  next();
};
