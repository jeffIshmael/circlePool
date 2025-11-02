/**
 * @title API Authorization Utility
 * 
 * 
 * Authorization middleware for protecting API routes
 */

import { NextRequest } from "next/server";

/**
 * Validates API key from request headers
 * Set API_KEY environment variable to protect your endpoints
 * Supports both:
 * - x-api-key: YOUR_API_KEY (custom header)
 * - Authorization: Bearer YOUR_API_KEY (standard format)
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  // If no API_KEY is set, allow all requests (development mode)
  if (!apiKey) {
    console.warn("⚠️  API_KEY not set - API routes are unprotected!");
    return true; // Allow in development
  }

  // Try x-api-key header first (custom header)
  let providedKey = request.headers.get("x-api-key");

  // If not found, try Authorization: Bearer format
  if (!providedKey) {
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      providedKey = authHeader.substring(7); // Remove "Bearer " prefix
    }
  }

  if (!providedKey) {
    return false;
  }

  // Compare with environment variable
  return providedKey === apiKey;
}

/**
 * Returns an unauthorized response
 */
export function unauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized - Invalid or missing API key" },
    { status: 401 }
  );
}

