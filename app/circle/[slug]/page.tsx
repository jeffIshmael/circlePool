"use client";
import Header from "@/components/Header";
import LoanRequestModal from "@/components/LoanRequestModal";
import Link from "next/link";
import { ArrowLeft, Users, Calendar, DollarSign, TrendingUp, Clock, Percent, Share2 } from "lucide-react";
import { useState } from "react";

export default function CircleDetail({ params }: { params: { slug: string } }) {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Mock data - replace with actual data fetching based on slug
  const circle = {
    id: 1,
    name: "Family Savings Circle",
    slug: "family-savings-circle",
    members: 8,
    frequency: "Every 7 days",
    retainedPercent: "20%",
    interestRate: "5%",
    startDate: "Jan 1, 2024",
    nextPayout: {
      date: "Dec 15, 2024",
      recipient: "Sarah K.",
      amount: "2400 HBAR",
    },
    poolBalance: "3200 HBAR",
    loanableAmount: "2560 HBAR",
    membersList: [
      { name: "John D.", paid: true, position: 1, nextPayout: "Jan 15, 2025" },
      { name: "Sarah K.", paid: false, position: 2, nextPayout: "Dec 15, 2024" },
      { name: "Mike T.", paid: false, position: 3, nextPayout: "Dec 22, 2024" },
      { name: "Emma L.", paid: false, position: 4, nextPayout: "Dec 29, 2024" },
      { name: "David R.", paid: false, position: 5, nextPayout: "Jan 5, 2025" },
      { name: "Lisa M.", paid: false, position: 6, nextPayout: "Jan 12, 2025" },
      { name: "Tom H.", paid: false, position: 7, nextPayout: "Jan 19, 2025" },
      { name: "You", paid: false, position: 8, nextPayout: "Jan 26, 2025" },
    ],
  };

  const handleLoanSuccess = () => {
    setShowLoanModal(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />

      {/* Notification Banner */}
      {showNotification && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm w-11/12 animate-slide-down">
          <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">Loan Request Submitted!</p>
            <p className="text-xs">Awaiting approval from the circle.</p>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}
      <LoanRequestModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        circleName={circle.name}
        interestRate={circle.interestRate}
        availableAmount={circle.loanableAmount}
        onSuccess={handleLoanSuccess}
      />
      
      {/* Mobile Back Button - Top */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-primary-light border-b border-primary-lavender">
        <div className="flex items-center px-4 py-3">
          <Link href="/my-circles" className="flex items-center gap-2 text-primary-blue hover:opacity-80">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back</span>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-primary-light pt-20 md:pt-12 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop Back Link */}
          <Link href="/my-circles" className="hidden md:inline-flex items-center text-primary-blue hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Circles
          </Link>
          
          {/* Circle Header */}
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
            <div className="flex items-start justify-between mb-3 md:mb-4">
              <h1 className="text-2xl md:text-4xl font-bold text-primary-dark pr-2">
                {circle.name}
              </h1>
              <button className="px-3 py-2 md:px-4 md:py-2 bg-primary-lavender text-primary-dark rounded-lg hover:bg-opacity-80 transition-all font-semibold flex items-center gap-2 text-sm md:text-base">
                <Share2 className="w-4 h-4" />
                <span className="hidden md:inline">Share Circle</span>
                <span className="md:hidden">Share</span>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-primary-slate">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-primary-blue" />
                <span className="font-semibold text-primary-dark">{circle.members} Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary-blue" />
                <span>{circle.frequency}</span>
              </div>
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 md:w-5 md:h-5 text-primary-blue" />
                <span>{circle.retainedPercent} retained, {circle.interestRate} interest</span>
              </div>
              <span className="px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase">
                Active
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Next Payout */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-primary-lavender">
              <div className="text-xs md:text-sm font-semibold text-primary-blue uppercase tracking-wide mb-2">
                Next Payout
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary-dark mb-2">
                {circle.nextPayout.amount}
              </div>
              <div className="text-xs md:text-sm text-primary-slate mb-1">
                To: <span className="font-semibold text-primary-dark">{circle.nextPayout.recipient}</span>
              </div>
              <div className="flex items-center gap-2 text-xs md:text-sm text-primary-slate">
                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                <span>{circle.nextPayout.date}</span>
              </div>
            </div>

            {/* Pool Balance */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-primary-lavender">
              <div className="text-xs md:text-sm font-semibold text-primary-blue uppercase tracking-wide mb-2">
                Pool Balance
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary-blue mb-2">
                {circle.poolBalance}
              </div>
              <div className="text-xs md:text-sm text-primary-slate mb-3 md:mb-4">
                {circle.loanableAmount} available for loans
              </div>
              <button 
                onClick={() => setShowLoanModal(true)}
                className="w-full px-4 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                Request Loan
              </button>
            </div>

            {/* Start Date */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-primary-lavender">
              <div className="text-xs md:text-sm font-semibold text-primary-blue uppercase tracking-wide mb-2">
                Started
              </div>
              <div className="text-lg md:text-xl font-bold text-primary-dark mb-2">
                {circle.startDate}
              </div>
              <div className="text-xs md:text-sm text-primary-slate mb-3 md:mb-4">
                Running for {Math.floor((new Date().getTime() - new Date(circle.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
              <button className="w-full px-4 py-3 bg-primary-lavender text-primary-dark rounded-lg hover:bg-opacity-80 transition-all font-semibold flex items-center justify-center gap-2 text-sm md:text-base">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                View History
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Members & Rotation */}
      <section className="py-8 md:py-12 pb-20 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl md:text-2xl font-bold text-primary-dark mb-4 md:mb-6">Members & Rotation</h2>
          
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Mobile View - Cards */}
            <div className="md:hidden">
              {circle.membersList.map((member) => (
                <div key={member.position} className="p-4 border-b border-primary-lavender last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        member.paid ? 'bg-green-500' : member.position === 2 ? 'bg-primary-blue' : 'bg-gray-300'
                      }`}>
                        {member.position}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-primary-dark">{member.name}</p>
                        {member.position === 2 && (
                          <span className="text-xs text-primary-blue font-semibold">Next</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-primary-slate">{member.nextPayout}</p>
                      {member.paid ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Paid</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-primary-light">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-dark">Position</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-dark">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-dark">Next Payout</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-primary-dark">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-lavender">
                  {circle.membersList.map((member) => (
                    <tr key={member.position} className="hover:bg-primary-light transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            member.paid ? 'bg-green-500' : member.position === 2 ? 'bg-primary-blue' : 'bg-gray-300'
                          }`}>
                            {member.position}
                          </div>
                          {member.position === 2 && (
                            <span className="px-2 py-1 bg-primary-blue text-white rounded text-xs font-semibold">
                              Next
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary-dark">{member.name}</td>
                      <td className="px-6 py-4 text-primary-slate">{member.nextPayout}</td>
                      <td className="px-6 py-4">
                        {member.paid ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Paid</span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

