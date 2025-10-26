"use client";
import Header from "@/components/Header";
import { ArrowLeft, Users, Calendar, Percent, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CreateCircle() {
  const [formData, setFormData] = useState({
    groupName: "",
    startDate: "",
    frequency: "",
    retainedPercent: "",
    interestRate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating circle:", formData);
    // Handle circle creation logic here
  };

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-light py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-primary-blue hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-4xl font-bold text-primary-dark mb-4">
            Create a New Circle
          </h1>
          <p className="text-lg text-primary-slate">
            Set up your savings circle and start building wealth with your community.
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
                  onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                  placeholder="e.g., Family Savings Circle"
                  className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-primary-dark mb-3">
                  <Calendar className="w-5 h-5 text-primary-blue" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
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
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="e.g., 7, 14, 30"
                  min="1"
                  max="90"
                  className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  required
                />
                <p className="text-sm text-primary-slate mt-2">
                  How often will members contribute? (e.g., 7 days for weekly, 30 days for monthly)
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
                    onChange={(e) => setFormData({ ...formData, retainedPercent: e.target.value })}
                    placeholder="e.g., 20"
                    min="5"
                    max="50"
                    step="1"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                  <span className="absolute right-4 top-3 text-primary-slate">%</span>
                </div>
                <p className="text-sm text-primary-slate mt-2">
                  Percentage of each payout that stays in the group reserve (Recommended: 15-25%)
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
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="e.g., 5"
                    min="1"
                    max="20"
                    step="0.5"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    required
                  />
                  <span className="absolute right-4 top-3 text-primary-slate">%</span>
                </div>
                <p className="text-sm text-primary-slate mt-2">
                  Interest rate for micro-loans from the circle pool (Recommended: 3-10% per month)
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold text-lg flex items-center justify-center gap-2"
                >
                  Create Circle
                  <Users className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

