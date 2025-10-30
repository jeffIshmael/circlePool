"use client";
import Header from "@/components/Header";
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useHashConnect } from "@/app/hooks/useHashConnect";
import { getUsersApprovedLoans } from "@/app/lib/prismafunctions";

export default function MyLoans() {
  const { accountId } = useHashConnect();
  const [loading, setLoading] = useState(true);
  const [activeLoans, setActiveLoans] = useState<
    Array<{
      id: number;
      circle?: string;
      amount: string;
      borrowedDate: string;
      dueDate: string;
      interestRate: string;
      totalDue: string;
      daysRemaining: number;
    }>
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accountId) {
        setActiveLoans([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const loans: any[] = await getUsersApprovedLoans(accountId);
        const mapped = loans.map((loan) => {
          const amountNum = Number(loan.amount || 0);
          const rate = Number(loan.interestRate || 0) / 100;
          const months = Number(loan.duration || 0);
          const start = loan.startDate ? new Date(loan.startDate) : new Date();
          const due = new Date(start);
          due.setMonth(due.getMonth() + (Number.isFinite(months) ? months : 0));
          const totalDueNum = amountNum * (1 + rate * months);
          const now = new Date();
          const daysRemaining = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          return {
            id: loan.id,
            circle: loan.circle?.name, // optional if relation exists
            amount: `${amountNum} HBAR`,
            borrowedDate: fmt(start),
            dueDate: fmt(due),
            interestRate: `${Number(loan.interestRate || 0)}%`,
            totalDue: `${totalDueNum.toFixed(2)} HBAR`,
            daysRemaining,
          };
        });
        if (!cancelled) setActiveLoans(mapped);
      } catch {
        if (!cancelled) setActiveLoans([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [accountId]);

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
          </div>
        </div>
      </section>


      {/* Active Loans */}
      <section className="">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center text-primary-slate">Loading loans…</div>
          ) : activeLoans.length > 0 ? (
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
                        {loan.circle || "Approved Loan"}
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
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

