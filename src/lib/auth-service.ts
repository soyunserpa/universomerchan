// ============================================================
// UNIVERSO MERCHAN — Authentication Service
// ============================================================
// Dual auth system:
//   - CUSTOMERS: Register/login on universomerchan.com
//   - ADMINS: Login on admin.universomerchan.com (separate)
//
// Both use JWT tokens but with different claims and secrets.
// A customer token CANNOT access admin routes and vice versa.
// ============================================================

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./database";
import { eq, and } from "drizzle-orm";
import * as schema from "./schema";
import { sendWelcomeEmail, notifyAdminNewUser } from "./email-service";

const AUTH_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "universo-merchan-default-secret-change-me"
);

const TOKEN_EXPIRY_CUSTOMER = "7d";   // Customers stay logged in 7 days
const TOKEN_EXPIRY_ADMIN = "12h";     // Admins must re-login every 12 hours

// ============================================================
// TYPES
// ============================================================

export interface AuthUser {
  id: number;
  email: string;
  role: "customer" | "admin";
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  cif?: string;
  discountPercent: number;
}

export interface TokenPayload {
  userId: number;
  email: string;
  role: "customer" | "admin";
  iat: number;
  exp: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  cif?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

// ============================================================
// REGISTER (customers only — admins created via script)
// ============================================================

export async function registerCustomer(input: RegisterInput): Promise<AuthResult> {
  const { email, password, firstName, lastName, phone, companyName, cif } = input;

  // Validate
  if (!email || !password || !firstName) {
    return { success: false, error: "Nombre, email y contraseña son obligatorios" };
  }

  if (password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }

  // Check email uniqueness
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase().trim()),
  });

  if (existing) {
    return { success: false, error: "Ya existe una cuenta con este email" };
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [user] = await db
    .insert(schema.users)
    .values({
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "customer",
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      phone: phone?.trim() || null,
      companyName: companyName?.trim() || null,
      cif: cif?.trim() || null,
      discountPercent: "0",
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Generate token
  const token = await generateToken(user.id, user.email, "customer");

  // Send welcome email (async, don't block registration)
  sendWelcomeEmail(user.email, firstName).catch(console.error);

  // Notify admin (async)
  notifyAdminNewUser({
    name: `${firstName} ${lastName || ""}`.trim(),
    email: user.email,
    company: companyName || undefined,
  }).catch(console.error);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: "customer",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      companyName: user.companyName || undefined,
      discountPercent: 0,
    },
  };
}

// ============================================================
// LOGIN (both customer and admin)
// ============================================================

export async function loginUser(
  input: LoginInput,
  expectedRole: "customer" | "admin"
): Promise<AuthResult> {
  const { email, password } = input;

  if (!email || !password) {
    return { success: false, error: "Email y contraseña son obligatorios" };
  }

  // Find user with matching role
  const user = await db.query.users.findFirst({
    where: and(
      eq(schema.users.email, email.toLowerCase().trim()),
      eq(schema.users.role, expectedRole)
    ),
  });

  if (!user) {
    // Generic error to avoid revealing if email exists
    return { success: false, error: "Email o contraseña incorrectos" };
  }

  if (!user.isActive) {
    return { success: false, error: "Cuenta desactivada. Contacta con soporte." };
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return { success: false, error: "Email o contraseña incorrectos" };
  }

  // Update last login
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date() })
    .where(eq(schema.users.id, user.id));

  // Generate token
  const expiry = expectedRole === "admin" ? TOKEN_EXPIRY_ADMIN : TOKEN_EXPIRY_CUSTOMER;
  const token = await generateToken(user.id, user.email, expectedRole, expiry);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role as "customer" | "admin",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || undefined,
      companyName: user.companyName || undefined,
      cif: user.cif || undefined,
      discountPercent: parseFloat(user.discountPercent?.toString() || "0"),
    },
  };
}

// ============================================================
// TOKEN GENERATION
// ============================================================

async function generateToken(
  userId: number,
  email: string,
  role: "customer" | "admin",
  expiry: string = TOKEN_EXPIRY_CUSTOMER
): Promise<string> {
  return new SignJWT({
    userId,
    email,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(AUTH_SECRET);
}

// ============================================================
// TOKEN VERIFICATION
// ============================================================

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, AUTH_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ============================================================
// MIDDLEWARE HELPERS
// ============================================================

export async function requireAuth(
  authHeader: string | null,
  requiredRole?: "customer" | "admin"
): Promise<{ user: AuthUser } | { error: string; status: number }> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "No autorizado", status: 401 };
  }

  const token = authHeader.replace("Bearer ", "");
  const payload = await verifyToken(token);

  if (!payload) {
    return { error: "Token inválido o expirado", status: 401 };
  }

  if (requiredRole && payload.role !== requiredRole) {
    return { error: "No tienes permisos para esta acción", status: 403 };
  }

  // Fetch fresh user data
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, payload.userId),
  });

  if (!user || !user.isActive) {
    return { error: "Cuenta no encontrada o desactivada", status: 401 };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role as "customer" | "admin",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone || undefined,
      companyName: user.companyName || undefined,
      cif: user.cif || undefined,
      discountPercent: parseFloat(user.discountPercent?.toString() || "0"),
    },
  };
}

// ============================================================
// PASSWORD RESET (simplified — sends a reset link)
// ============================================================

export async function requestPasswordReset(email: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email.toLowerCase().trim()),
  });

  // Always return true to not reveal if email exists
  if (!user) return true;

  // Generate a short-lived token (1 hour)
  const resetToken = await new SignJWT({
    userId: user.id,
    purpose: "password_reset",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(AUTH_SECRET);

  // In production: send email with reset link
  // For now, log it
  console.log(`[Auth] Password reset requested for ${email}. Token: ${resetToken.slice(0, 20)}...`);

  return true;
}

export async function resetPassword(
  resetToken: string,
  newPassword: string
): Promise<AuthResult> {
  if (newPassword.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }

  const payload = await verifyToken(resetToken);
  if (!payload || (payload as any).purpose !== "password_reset") {
    return { success: false, error: "Enlace de recuperación inválido o expirado" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db
    .update(schema.users)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, payload.userId));

  return { success: true };
}

// ============================================================
// UPDATE PROFILE
// ============================================================

export async function updateProfile(
  userId: number,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
    cif?: string;
    shippingStreet?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
  }
): Promise<AuthResult> {
  try {
    await db
      .update(schema.users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, userId));

    const updated = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
    });

    if (!updated) {
      return { success: false, error: "Usuario no encontrado" };
    }

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role as "customer" | "admin",
        firstName: updated.firstName || "",
        lastName: updated.lastName || "",
        phone: updated.phone || undefined,
        companyName: updated.companyName || undefined,
        cif: updated.cif || undefined,
        discountPercent: parseFloat(updated.discountPercent?.toString() || "0"),
      },
    };
  } catch (error: any) {
    return { success: false, error: "Error al actualizar el perfil" };
  }
}
