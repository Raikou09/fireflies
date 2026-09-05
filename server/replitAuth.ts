import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { pool as sharedPool } from "./db";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: sharedPool,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,  // Changed to true for admin sessions
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",  // Only secure in production
      maxAge: sessionTtl,
      sameSite: 'lax'  // Add sameSite for better compatibility
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Check if user already exists to preserve their userType
  const existingUser = await storage.getUserByEmail(claims["email"]);

  // If there's an existing user with a DIFFERENT id (pre-existing vendor with old ID),
  // migrate their court ownership to the new Replit Auth ID before upserting.
  if (existingUser && existingUser.id !== claims["sub"]) {
    await storage.migrateVendorId(existingUser.id, claims["sub"]);
  }

  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    // Preserve existing userType if user exists, otherwise default to customer
    userType: existingUser?.userType || "customer"
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  console.log('Authentication check - isAuthenticated:', req.isAuthenticated());
  const user = req.user as any;
  console.log('Authentication check - user exists:', !!user);

  if (!req.isAuthenticated() || !user?.expires_at) {
    console.log('Authentication check - FAILED: Not authenticated or no expiry');
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  console.log('Authentication check - Current time vs expires_at:', now, user.expires_at);
  
  if (now <= user.expires_at) {
    console.log('Authentication check - SUCCESS: Token still valid');
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('Authentication check - FAILED: No refresh token');
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  console.log('Authentication check - Attempting token refresh');
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log('Authentication check - SUCCESS: Token refreshed');
    return next();
  } catch (error) {
    console.log('Authentication check - FAILED: Token refresh failed', error);
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
