import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "@workspace/db";
import {
  SignupBody,
  RegisterBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  ChangePasswordBody,
  OauthLoginBody,
  GoogleLoginBody,
} from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middlewares/auth";
import { rateLimiter } from "../middlewares/rateLimiter";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "intell_meet_jwt_secret_key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "intell_meet_jwt_refresh_secret_key";

// Helper: Password strength validation
function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one digit";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
}

// Helper: Set refresh token cookie
function setRefreshTokenCookie(res: any, token: string, rememberMe: boolean) {
  res.cookie("intell_meet_refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined, // 7 days if rememberMe, otherwise browser session limit
  });
}

// Helper: Generate JWT tokens
function generateTokens(user: any) {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: "15m" } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: "7d" } // Long-lived refresh token
  );

  return { accessToken, refreshToken };
}

// Helper: Format user response to match the OpenAPI User schema
export function formatUserResponse(user: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber || null,
    jobTitle: user.jobTitle || null,
    department: user.department || null,
    bio: user.bio || null,
    timezone: user.timezone || "UTC",
    avatar: user.avatar || null,
    profileColor: user.profileColor || "purple",
    authProvider: user.authProvider || "local",
    googleId: user.googleId || null,
    profilePicture: user.profilePicture || null,
    emailVerified: !!user.emailVerified,
    hasPassword: !!user.password,
    notificationSettings: {
      email: user.notificationSettings?.email ?? true,
      push: user.notificationSettings?.push ?? true,
      sms: user.notificationSettings?.sms ?? false,
    },
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /api/auth/register & POST /api/auth/signup
const handleRegister = async (req: any, res: any) => {
  // Support both /register and /signup bodies
  const isSignupRoute = req.path === "/signup";
  const parsed = isSignupRoute ? SignupBody.safeParse(req.body) : RegisterBody.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid registration parameters", details: parsed.error.format() });
    return;
  }

  const { name, email, password, role } = parsed.data;

  // Password strength check
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "Member",
    });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken, true); // default to auto log-in with persistence

    res.status(201).json({
      token: accessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    req.log.error({ error }, "Error in user signup");
    res.status(500).json({ error: "Internal server error" });
  }
};

router.post("/signup", rateLimiter(15 * 60 * 1000, 10), handleRegister);
router.post("/register", rateLimiter(15 * 60 * 1000, 10), handleRegister);

// POST /api/auth/login
router.post("/login", rateLimiter(15 * 60 * 1000, 20), async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid login parameters" });
    return;
  }

  const { email, password, rememberMe } = parsed.data;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken, !!rememberMe);

    res.json({
      token: accessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    req.log.error({ error }, "Error in user login");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  const tokenFromCookie = req.cookies.intell_meet_refresh_token;
  if (!tokenFromCookie) {
    res.status(401).json({ error: "No refresh token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(tokenFromCookie, JWT_REFRESH_SECRET) as { id: string };

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== tokenFromCookie) {
      res.status(401).json({ error: "Invalid refresh token session" });
      return;
    }

    // Generate fresh access token and a rotated refresh token (optional, but let's rotate for security)
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    user.refreshToken = newRefreshToken;
    await user.save();

    // Re-set cookie
    setRefreshTokenCookie(res, newRefreshToken, true);

    res.json({ token: accessToken });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired session" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  const tokenFromCookie = req.cookies.intell_meet_refresh_token;

  try {
    if (tokenFromCookie) {
      const decoded = jwt.verify(tokenFromCookie, JWT_REFRESH_SECRET) as { id: string };
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
  } catch (err) {
    // Suppress token verification failures on logout
  }

  res.clearCookie("intell_meet_refresh_token");
  res.json({ message: "Logged out successfully" });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", rateLimiter(15 * 60 * 1000, 5), async (req, res) => {
  const parsed = ForgotPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid forgot password params" });
    return;
  }

  const { email } = parsed.data;

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security measure: Do not disclose whether email exists or not
      res.json({ message: "If that email address exists, a password reset link has been generated.", resetLink: "" });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = `${req.protocol}://${req.get("host")?.replace("5000", "5173")}/reset-password?token=${resetToken}`;

    // Mock Mail Transport logging to console
    console.log(`
=========================================
[SMTP MOCK TRANSPORT] Password Reset Mail
To: ${user.email}
Subject: Reset your Intell Meet password
Reset Link: ${resetLink}
=========================================
    `);

    res.json({
      message: "If that email address exists, a password reset link has been generated.",
      resetLink, // Expose in JSON response during dev/testing for easy automation
    });
  } catch (error) {
    req.log.error({ error }, "Error in forgot password request");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/reset-password
router.post("/reset-password", rateLimiter(15 * 60 * 1000, 5), async (req, res) => {
  const parsed = ResetPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reset parameters" });
    return;
  }

  const { token, password } = parsed.data;

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: "Password reset token is invalid or has expired." });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // Force logout other sessions
    await user.save();

    res.json({ message: "Password has been reset successfully." });
  } catch (error) {
    req.log.error({ error }, "Error in reset password execution");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/change-password
router.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid change password inputs" });
    return;
  }

  const { oldPassword, newPassword } = parsed.data;

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    res.status(400).json({ error: passwordError });
    return;
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Require current password check only if a password exists
    if (user.password) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        res.status(400).json({ error: "Current password input is incorrect" });
        return;
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    req.log.error({ error }, "Error changing password");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(formatUserResponse(user));
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/oauth
router.post("/oauth", async (req, res) => {
  const parsed = OauthLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid OAuth payload", details: parsed.error.format() });
    return;
  }

  const { email, name } = parsed.data;

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        role: "Member",
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken, true);

    res.json({
      token: accessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    req.log.error({ error }, "Error during simulated OAuth login");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/google - Authenticate using Google OAuth 2.0 ID Token
router.post("/google", rateLimiter(15 * 60 * 1000, 30), async (req, res) => {
  const parsed = GoogleLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid Google payload", details: parsed.error.format() });
    return;
  }

  const { idToken } = parsed.data;

  try {
    // 1. Verify token with Google's tokeninfo API or use mock parser in local dev mode
    let payload: {
      aud: string;
      email: string;
      email_verified?: string;
      name: string;
      picture?: string;
      sub: string;
    };

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "335439563229-placeholder.apps.googleusercontent.com";

    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!response.ok) {
      res.status(401).json({ error: "Invalid Google ID token" });
      return;
    }

    payload = (await response.json()) as any;

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== "335439563229-placeholder.apps.googleusercontent.com" && payload.aud !== GOOGLE_CLIENT_ID) {
      res.status(401).json({ error: "Google token client ID mismatch" });
      return;
    }

    const email = payload.email.toLowerCase();
    const name = payload.name;
    const picture = payload.picture || "";
    const googleId = payload.sub;

    // 2. Locate user
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        // Link Google ID to existing local account
        user.googleId = googleId;
        user.authProvider = "google";
        user.emailVerified = true;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
      } else {
        // Create user from Google Profile
        user = new User({
          name,
          email,
          role: "Member",
          authProvider: "google",
          googleId,
          profilePicture: picture,
          avatar: picture,
          emailVerified: true,
        });
        await user.save();
      }
    }

    // 3. Issue Session Tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken, true);

    res.json({
      token: accessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    req.log.error({ error }, "Error during Google OAuth authentication");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/google/disconnect - Disconnect Google Account from user profile
router.post("/google/disconnect", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.password) {
      res.status(400).json({
        error: "You must set a local password before disconnecting your Google account.",
      });
      return;
    }

    user.googleId = undefined;
    user.authProvider = "local";
    await user.save();

    res.json({ message: "Google account disconnected successfully." });
  } catch (error) {
    req.log.error({ error }, "Error disconnecting Google account");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
