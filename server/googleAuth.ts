import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express } from "express";
import { storage } from "./storage";
import { pool } from "./db";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: 'none',
    },
  });
}

export function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Google OAuth credentials not provided.");
    return;
  }

  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 
    "https://fireflies-production-ba72.up.railway.app/api/auth/google/callback";

  console.log("Google OAuth callback URL:", callbackURL);

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL,
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
          userType: "customer",
        });
      } else {
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
      return done(error as Error, undefined);
    }
  }));

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  app.get("/api/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/?error=auth_failed" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  app.get("/api/login", (req, res) => {
    res.redirect("/api/auth/google");
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  // Check admin session as fallback
  if ((req.session as any)?.adminAuthenticated) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};