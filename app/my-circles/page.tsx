"use client";
import Header from "@/components/Header";
import LoanRequestModal from "@/components/LoanRequestModal";
import { ArrowLeft, Users,Plus , Calendar, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MyCircles() {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleRequestLoanClick = (circle: any) => {
    setSelectedCircle(circle);
    setShowLoanModal(true);
  };

  const handleLoanSuccess = () => {
    setShowLoanModal(false);
    setSelectedCircle(null);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };
  // Mock data - replace with actual data from your backend
  const circles = [
    {
      id: 1,
      name: "Family Savings Circle",
      slug: "family-savings-circle",
      members: 8,
      nextPayout: "Dec 15, 2024",
      amount: "2400 HBAR",
      poolBalance: "3200 HBAR",
      status: "active",
    },
    {
      id: 2,
      name: "Friends Investment Group",
      slug: "friends-investment-group",
      members: 6,
      nextPayout: "Jan 10, 2025",
      amount: "1800 HBAR",
      poolBalance: "2400 HBAR",
      status: "active",
    },
    {
      id: 3,
      name: "Neighborhood Fund",
      slug: "neighborhood-fund",
      members: 10,
      nextPayout: "Nov 28, 2024",
      amount: "3000 HBAR",
      poolBalance: "4500 HBAR",
      status: "active",
    },
  ];

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />

      {/* Notification Banner */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Loan Request Submitted!</p>
            <p className="text-sm">Your application is awaiting approval from the circle.</p>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      {showLoanModal && selectedCircle && (
        <LoanRequestModal
          isOpen={showLoanModal}
          onClose={() => {
            setShowLoanModal(false);
            setSelectedCircle(null);
          }}
          circleName={selectedCircle.name}
          interestRate="5%"
          availableAmount={selectedCircle.poolBalance}
          onSuccess={handleLoanSuccess}
        />
      )}
      
      {/* Hero Section */}
      <section className="bg-primary-light py-12">
        <div className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-primary-blue hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-primary-dark mb-4">
                My Circles
              </h1>
              <p className="text-lg text-primary-slate">
                Manage and track your savings circles
              </p>
            </div>
            <Link
              href="/create"
              className="hidden md:inline-flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
            >
              Create New Circle <Plus className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Circles Grid */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {circles.map((circle) => (
              <div
                key={circle.id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-primary-lavender hover:shadow-xl transition-all"
              >
                {/* Circle Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-primary-dark mb-2">
                    {circle.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-primary-slate">
                    <Users className="w-4 h-4" />
                    <span>{circle.members} members</span>
                    <span className="mx-2">•</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase">
                      {circle.status}
                    </span>
                  </div>
                </div>

                {/* Next Payout */}
                <div className="bg-primary-light rounded-xl p-4 mb-4">
                  <div className="text-xs font-semibold text-primary-blue uppercase tracking-wide mb-2">
                    Next Payout
                  </div>
                  <div className="text-2xl font-bold text-primary-dark mb-1">
                    {circle.amount}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-primary-slate">
                    <Calendar className="w-4 h-4" />
                    <span>{circle.nextPayout}</span>
                  </div>
                </div>

                {/* Pool Balance */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-primary-slate">
                    Pool Balance
                  </span>
                  <span className="text-xl font-bold text-primary-blue">
                    {circle.poolBalance}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Link
                    href={`/circle/${circle.slug}`}
                    className="flex-1 px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-medium text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleRequestLoanClick(circle)}
                    className="flex-1 px-4 py-2 bg-primary-lavender text-primary-dark rounded-lg hover:bg-opacity-80 transition-all font-medium text-center"
                  >
                    Request Loan
                  </button>
                </div>
              </div>
            ))}

            {/* Create New Circle Card */}
            <Link
              href="/create"
              className="bg-white rounded-2xl shadow-lg p-6 border-2 border-dashed border-primary-lavender hover:border-primary-blue transition-all flex flex-col items-center justify-center min-h-[300px] text-center"
            >
              <div className="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary-blue" />
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-2">
                Create New Circle
              </h3>
              <p className="text-primary-slate">
                Start a new savings circle
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

