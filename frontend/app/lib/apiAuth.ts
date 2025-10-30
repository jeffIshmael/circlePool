/**
 * @title API Authorization Utility
 * @author Jeff Muchiri
 * 
 * Authorization middleware for protecting API routes
 */

import { NextRequest } from "next/server";

/**
 * Validates API key from request headers
 * Set API_KEY environment variable to protect your endpoints
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;

  // If no API_KEY is set, allow all requests (development mode)
  if (!apiKey) {
    console.warn("⚠️  API_KEY not set - API routes are unprotected!");
    return true; // Allow in development
  }

  // Get API key from headers
  const providedKey = request.headers.get("x-api-key");

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

