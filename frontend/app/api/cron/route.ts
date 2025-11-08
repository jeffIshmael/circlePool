/**
 * @title Cron Jobs API Route
 * @author Jeff Muchiri
 * 
 * API route for triggering cron jobs from external services
 * POST /api/cron
 * 
 * Usage:
 * - Set up external cron service (Vercel Cron, cron-job.org, etc.)
 * - Configure to POST to: https://your-domain.com/api/cron
 * - Include header: x-api-key: YOUR_API_KEY
 * 
 * Query parameters:
 * - job: "startdate" | "paydate" | "all" (default: "all")
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/app/lib/apiAuth";
import { checkStartdate, checkPaydate } from "@/app/lib/cronjobs";

export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return unauthorizedResponse();
    }

    // Get job type from query params (default: "all")
    const { searchParams } = new URL(request.url);
    const job = searchParams.get("job") || "all";

    const results: {
      startdate?: { success: boolean; error?: string };
      paydate?: { success: boolean; processed?: number; failed?: number; error?: string };
    } = {};

    // Execute requested job(s)
    if (job === "startdate" || job === "all") {
      try {
        await checkStartdate();
        results.startdate = { success: true };
        console.log("✅ checkStartdate completed successfully");
      } catch (error: any) {
        console.error("❌ checkStartdate failed:", error);
        results.startdate = {
          success: false,
          error: error.message || "Unknown error",
        };
      }
    }

    if (job === "paydate" || job === "all") {
      try {
        const paydateResult = await checkPaydate();
        results.paydate = {
          success: true,
          processed: paydateResult.processed || 0,
          failed: paydateResult.failed || 0,
        };
        console.log(
          `✅ checkPaydate completed - processed ${paydateResult.processed} circles, ${paydateResult.failed || 0} failed`
        );
      } catch (error: any) {
        console.error("❌ checkPaydate failed:", error);
        results.paydate = {
          success: false,
          error: error.message || "Unknown error",
        };
      }
    }

    // Determine overall success
    // Consider it successful if at least one job succeeded or if paydate processed at least one circle
    const allSuccessful =
      Object.values(results).every((result) => result.success !== false) ||
      (results.paydate?.success && (results.paydate.processed || 0) > 0);

    return NextResponse.json(
      {
        success: allSuccessful,
        timestamp: new Date().toISOString(),
        jobs: results,
      },
      { status: allSuccessful ? 200 : 500 }
    );
  } catch (error: any) {
    console.error("❌ Cron job route error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}

