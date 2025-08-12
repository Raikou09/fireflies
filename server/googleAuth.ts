import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import type { Express } from "express";
import { storage } from "./storage";

// Google OAuth configuration
export function setupGoogleAuth(app: Express) {
  // Only setup Google OAuth if credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not provided. Skipping Google authentication setup.");
    return;
  }

  // Google OAuth Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Extract user info from Google profile
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value || "";
      const firstName = profile.name?.givenName || "";
      const lastName = profile.name?.familyName || "";
      const profileImageUrl = profile.photos?.[0]?.value || "";

      // Check if user already exists
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Create new user with Google info
        user = await storage.upsertUser({
          id: googleId,
          email,
          firstName,
          lastName,
          profileImageUrl,
          userType: "customer" // Default to customer, can be changed later
        });
      } else {
        // Update existing user with latest Google info
        user = await storage.upsertUser({
          ...user,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          profileImageUrl: profileImageUrl || user.profileImageUrl,
        });
      }

      return done(null, user);
    } catch (error) {
      console.error("Google OAuth error:", error);
      return done(error, null);
    }
  }));

  // Google OAuth routes
  app.get("/api/auth/google",
    passport.authenticate("google", { 
      scope: ["profile", "email"] 
    })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { 
      failureRedirect: "/?error=google_auth_failed" 
    }),
    (req, res) => {
      // Successful authentication, redirect to home
      res.redirect("/");
    }
  );
}