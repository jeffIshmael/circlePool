"use client";
import Header from "@/components/Header";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MyLoans() {
  const [requestLoanOpen, setRequestLoanOpen] = useState(false);

  // Mock data - replace with actual data
  const activeLoans = [
    {
      id: 1,
      circle: "Family Savings Circle",
      amount: "500 HBAR",
      borrowedDate: "Nov 15, 2024",
      dueDate: "Jan 15, 2025",
      interestRate: "5%",
      totalDue: "600 HBAR",
      daysRemaining: 45,
    },
  ];

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-light hidden md:block py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-primary-blue hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary-dark mb-4">
                My Loans
              </h1>
              <p className="text-lg text-primary-slate">
                Manage your loans from your circles
              </p>
            </div>
            <button
              onClick={() => setRequestLoanOpen(!requestLoanOpen)}
              className="hidden md:inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold gap-2"
            >
              <Plus className="w-5 h-5" />
              Request Loan
            </button>
          </div>
        </div>
      </section>

      {/* Request Loan Modal */}
      {requestLoanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-primary-dark mb-6">
              Request a Loan
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-primary-dark mb-2">
                  Select Circle
                </label>
                <select className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue">
                  <option>Family Savings Circle</option>
                  <option>Friends Investment Group</option>
                  <option>Neighborhood Fund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-primary-dark mb-2">
                  Loan Amount (HBAR)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 500"
                  className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setRequestLoanOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Loans */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {activeLoans.length > 0 ? (
            <div className="space-y-6">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="bg-white rounded-2xl shadow-lg p-8 border border-primary-lavender"
                >
                  {/* Loan Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-primary-dark mb-2">
                        {loan.circle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-primary-slate">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>Amount: {loan.amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>Interest: {loan.interestRate}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold uppercase">
                      Active
                    </span>
                  </div>

                  {/* Loan Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-primary-light rounded-xl p-4">
                      <div className="text-sm font-medium text-primary-slate mb-1">
                        Borrowed Date
                      </div>
                      <div className="text-lg font-bold text-primary-dark">
                        {loan.borrowedDate}
                      </div>
                    </div>
                    <div className="bg-primary-light rounded-xl p-4">
                      <div className="text-sm font-medium text-primary-slate mb-1">
                        Due Date
                      </div>
                      <div className="text-lg font-bold text-primary-dark">
                        {loan.dueDate}
                      </div>
                    </div>
                    <div className="bg-primary-light rounded-xl p-4">
                      <div className="text-sm font-medium text-primary-slate mb-1">
                        Days Remaining
                      </div>
                      <div className="text-lg font-bold text-primary-blue">
                        {loan.daysRemaining} days
                      </div>
                    </div>
                  </div>

                  {/* Total Due */}
                  <div className="bg-blue-50 border border-primary-blue rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-primary-dark">
                        Total Amount Due
                      </span>
                      <span className="text-2xl font-bold text-primary-blue">
                        {loan.totalDue}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button className="flex-1 px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold">
                      Pay Loan Now
                    </button>
                    <button className="px-6 py-3 bg-primary-lavender text-primary-dark rounded-lg hover:bg-opacity-80 transition-all font-semibold">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="text-2xl font-bold text-primary-dark mb-2">
                No Active Loans
              </h3>
              <p className="text-primary-slate mb-6">
                You don't have any active loans at the moment
              </p>
              <button
                onClick={() => setRequestLoanOpen(true)}
                className="inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold gap-2"
              >
                <Plus className="w-5 h-5" />
                Request a Loan
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

