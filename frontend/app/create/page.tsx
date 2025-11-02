"use client";

import Header from "@/components/Header";
import {
  ArrowLeft,
  Users,
  Calendar,
  Percent,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
// import server helpers via API to avoid importing Prisma on the client
import { useCircle } from "../hooks/useCircle";
import { getTotalCircles } from "../services/circleService";
// import { checkSlugExistsAction, registerCircleAction } from "./actions";
import { checkSlugExists, registerCircle } from "../lib/prismafunctions";
import { useHashConnect } from "../hooks/useHashConnect";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateCircle() {
  const { createCircle } = useCircle();
  const { isConnected, accountId } = useHashConnect();
  const [creating, setIsCreating] = useState(false);
  const [creatingError, setCreatingError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    groupName: "",
    startDate: "",
    startTime: "",
    frequency: "",
    amount: "",
    retainedPercent: "",
    interestRate: "",
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingError(null);

    if (!isConnected || !accountId) {
      setCreatingError("Please connect your wallet");
      return;
    }
    setIsCreating(true);
    // Client-side validations
    const amountNum = Number(formData.amount);
    const frequencyNum = Number(formData.frequency);
    const retainedNum = Number(formData.retainedPercent);
    const interestNum = Number(formData.interestRate);
    const start = new Date(`${formData.startDate} ${formData.startTime}`);
    const now = new Date();

    if (!formData.groupName.trim()) {
      setCreatingError("Circle name is required");
      setIsCreating(false);
      return;
    }
    if (!formData.startDate || !formData.startTime || isNaN(start.getTime())) {
      setCreatingError("Please select a valid start date and time");
      setIsCreating(false);
      return;
    }
    if (start <= now) {
      setCreatingError("Start date & time must be in the future");
      setIsCreating(false);
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setCreatingError("Amount must be greater than 0");
      setIsCreating(false);
      return;
    }
    if (isNaN(frequencyNum) || frequencyNum < 1) {
      setCreatingError("Contribution frequency must be at least 1 day");
      setIsCreating(false);
      return;
    }
    if (isNaN(retainedNum) || retainedNum < 10) {
      setCreatingError("Retention percentage must be at least 10%");
      setIsCreating(false);
      return;
    }
    if (isNaN(interestNum) || interestNum < 5) {
      setCreatingError("Interest rate must be at least 5%");
      setIsCreating(false);
      return;
    }
    // check if the slug exists
    const slugExists = await checkSlugExists(formData.groupName);
    if (slugExists) {
      setCreatingError(
        "Circle name already exists. Please choose another name."
      );
      setIsCreating(false);
      return;
    }

    try {
      // add  start date and time to form data
      const startDate = new Date(`${formData.startDate} ${formData.startTime}`);
      const startDateTimestamp = Math.floor(startDate.getTime() / 1000); // in seconds

      // Convert HBAR to tinybars (1 HBAR = 100,000,000 tinybars)
      const amountInTinybars = BigInt(Math.floor(amountNum * 100_000_000));

      // get the total number of circles from b.c
      const totalCircles = await getTotalCircles();

      console.log("Total circles:", totalCircles);

      // register to blockchain
      const result = await createCircle({
        amount: amountInTinybars,
        durationDays: frequencyNum || 30,
        startDate: startDateTimestamp,
        maxMembers: 5,
        interestPercent: interestNum || 5,
        leftPercent: retainedNum || 10,
      });

      console.log("Result from blockchain:", result);

      // Stop execution if blockchain transaction failed
      if (!result || !result.success) {
        throw new Error("Failed to create circle on blockchain");
      }


      
      // Only proceed if blockchain transaction was successful
      const circle = await registerCircle(
        formData.groupName,
        String(totalCircles),
        startDateTimestamp * 1000,
        (startDateTimestamp + frequencyNum * 24 * 60 * 60) * 1000,
        frequencyNum,
        amountNum,
        retainedNum || 10,
        interestNum || 5,
        accountId || ""
      );
      toast.success("Circle created successfully");
      console.log("Circle registered to prisma:", circle);
      router.push(`/my-circles`);
    } catch (error) {
      console.error("Error:", error);
      const message = (error as any)?.message || "Failed to create circle";
      if (
        typeof message === "string" &&
        message.toLowerCase().includes("already exists")
      ) {
        toast.error("Circle name already exists. Please choose another name.");
        setCreatingError(
          "Circle name already exists. Please choose another name."
        );
      } else {
        toast.error(message);
        setCreatingError(
          typeof message === "string" ? message : "Failed to create circle"
        );
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />

      {/* Hero Section */}
      <section className="bg-primary-light ">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary-blue hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-4xl font-bold text-primary-dark mb-4">
            Create a New Circle
          </h1>
          <p className="text-lg text-primary-slate">
            Set up your savings circle and start building wealth with your
            community.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Group Name */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                  <Users className="w-5 h-5 text-primary-blue" />
                  Circle Name
                </label>
                <input
                  type="text"
                  value={formData.groupName}
                  onChange={(e) =>
                    setFormData({ ...formData, groupName: e.target.value })
                  }
                  placeholder="e.g., Family Savings Circle"
                  className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                  disabled={creating}
                />
              </div>

              {/* Contribution Amount */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                  <DollarSign className="w-5 h-5 text-primary-blue" />
                  Contribution Amount (HBAR)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="e.g., 10"
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                    disabled={creating}
                  />
                </div>
                <p className="text-sm text-primary-slate mt-2">
                  The amount each member will contribute per round (in HBAR).
                  Minimum: greater than 0.
                </p>
              </div>

              {/* Start Date & Time */}
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                      <Calendar className="w-5 h-5 text-primary-blue" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      required
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                      <Calendar className="w-5 h-5 text-primary-blue" />
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                      required
                      disabled={creating}
                    />
                  </div>
                </div>
              </div>

              {/* Contribution Frequency */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                  <Calendar className="w-5 h-5 text-primary-blue" />
                  Contribution Frequency (days)
                </label>
                <input
                  type="number"
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  placeholder="e.g., 7, 14, 30"
                  min="1"
                  max="90"
                  className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                  disabled={creating}
                />
                <p className="text-sm text-primary-slate mt-2">
                  How often will members contribute? (e.g., 7 days for weekly,
                  30 days for monthly). Minimum: 1 day.
                </p>
              </div>

              {/* Retained Percentage */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                  <Percent className="w-5 h-5 text-primary-blue" />
                  Retention Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.retainedPercent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retainedPercent: e.target.value,
                      })
                    }
                    placeholder="e.g., 20"
                    min="10"
                    max="50"
                    step="1"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                    disabled={creating}
                  />
                  <span className="absolute right-4 top-3 text-primary-slate">
                    %
                  </span>
                </div>
                <p className="text-sm text-primary-slate mt-2">
                  Percentage of each payout that stays in the group reserve.
                  Minimum: 10% (Recommended: 15–25%).
                </p>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                  <TrendingUp className="w-5 h-5 text-primary-blue" />
                  Loan Interest Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) =>
                      setFormData({ ...formData, interestRate: e.target.value })
                    }
                    placeholder="e.g., 5"
                    min="5"
                    max="20"
                    step="0.5"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                    disabled={creating}
                  />
                  <span className="absolute right-4 top-3 text-primary-slate">
                    %
                  </span>
                </div>
                <p className="text-sm text-primary-slate mt-2">
                  Interest rate for micro-loans from the circle pool. Minimum:
                  5% (Recommended: 5–10% per month).
                </p>
              </div>

              {/* Submit Button */}
              {creatingError && (
                <div className="pt-2 text-red-600 text-sm" role="alert">
                  {creatingError}
                </div>
              )}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={creating}
                  aria-busy={creating}
                  className="w-full px-6 py-4 bg-primary-blue text-white rounded-lg transition-all font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary-blue/80 hover:scale-105 hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Circle
                      <Users className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
