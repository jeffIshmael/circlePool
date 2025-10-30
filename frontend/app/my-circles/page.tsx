"use client";
import Header from "@/components/Header";
import LoanRequestModal from "@/components/LoanRequestModal";
import {
  ArrowLeft,
  Users,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHashConnect } from "@/app/hooks/useHashConnect";
import {
  getCircleById,
  getCirclesWithLoanableAmount,
} from "@/app/services/circleService";
import { getCircles } from "@/app/lib/prismafunctions";

type UiCircle = {
  id: number;
  name: string;
  slug: string;
  members: number;
  nextPayout: string; // formatted label
  amount: string; // formatted HBAR string
  nextPayoutHbar: string; // formatted HBAR string
  loanableAmount: string; // formatted HBAR string
  status: "active" | "not started";
  leftPercent: number;
  interestPercent: number;
};

export default function MyCircles() {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(true);
  const [circles, setCircles] = useState<UiCircle[]>([]);
  const { accountId } = useHashConnect();
  const router = useRouter();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinLink, setJoinLink] = useState("");
  const [joinError, setJoinError] = useState("");

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
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // fetch circles from database
        const dbCircles: any[] = await getCircles();
        const circleFull: UiCircle[] = await Promise.all(
          dbCircles.map(async (c) => {
            let loanableHbar = 0;
            try {
              if (c.blockchainId) {
                const onChain = await getCircleById(Number(c.blockchainId));
                loanableHbar = Number(
                  (onChain.loanableAmount || 0) / 100_000_000
                );
              }
            } catch {}

            const amountNum =
              (Number(c.amount || 0) * (100 - Number(c.leftPercent || 0))) /
              100;
            const membersCount = Array.isArray(c.members)
              ? c.members.length
              : 0;
            const nextPayoutHbar = amountNum * membersCount;

            const started = !!c.started;
            const dateSource = started
              ? new Date(c.payDate)
              : new Date(c.startDate);
            const day = dateSource.getDate();
            const month = dateSource
              .toLocaleString("en-US", { month: "short" })
              .toLowerCase();
            const year = dateSource.getFullYear();
            const hours = String(dateSource.getHours()).padStart(2, "0");
            const minutes = String(dateSource.getMinutes()).padStart(2, "0");
            const nextPayoutLabel = `${day} ${month} ${year}, ${hours}${minutes}`;

            return {
              id: c.id,
              name: c.name,
              slug: c.slug,
              members: membersCount,
              nextPayout: nextPayoutLabel,
              amount: `${amountNum.toFixed(2)} HBAR`,
              nextPayoutHbar: `${nextPayoutHbar.toFixed(2)} HBAR`,
              loanableAmount: `${loanableHbar.toFixed(2)} HBAR`,
              status: started ? "active" : "not started",
              leftPercent: Number(c.leftPercent || 0),
              interestPercent: Number(c.interestPercent || 0),
            } as UiCircle;
          })
        );
        if (!cancelled) setCircles(circleFull);
      } catch {
        if (!cancelled) setCircles([]);
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
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowJoinModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-semibold text-primary-dark mb-3">
              Join a Circle
            </h3>
            <p className="text-sm text-primary-slate mb-4">
              Paste a circle link to continue.
            </p>
            <input
              type="text"
              value={joinLink}
              onChange={(e) => {
                setJoinLink(e.target.value);
                setJoinError("");
              }}
              placeholder="https://circle-pool.vercel.app/..."
              className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue mb-2"
            />
            {joinError && (
              <p className="text-xs text-red-600 mb-2">{joinError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    const raw = joinLink.trim();
                    if (!raw) return;
                    const url = new URL(raw);
                    const validHost = url.host === "circle-pool.vercel.app";
                    const validPath = /^\/circle\/[a-z0-9-]+$/i.test(
                      url.pathname
                    );
                    if (!validHost || !validPath) {
                      setJoinError("Invalid link.");
                      return;
                    }
                    router.push(url.pathname);
                    setShowJoinModal(false);
                  } catch {
                    setJoinError("Invalid link.");
                  }
                }}
                disabled={!joinLink.trim()}
                className={`px-4 py-2 rounded-lg ${
                  !joinLink.trim()
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-primary-blue text-white hover:bg-opacity-90"
                }`}
              >
                Check out
              </button>
            </div>
          </div>
        </div>
      )}
      {showLoanModal && selectedCircle && (
        <LoanRequestModal
          isOpen={showLoanModal}
          onClose={() => {
            setShowLoanModal(false);
            setSelectedCircle(null);
          }}
          circleName={selectedCircle.name}
          interestRate={`${selectedCircle.interestPercent}%`}
          availableAmount={selectedCircle.loanableAmount}
          onSuccess={handleLoanSuccess}
        />
      )}

      {/* Notification Banner */}
      {showNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Loan Request Submitted!</p>
            <p className="text-sm">
              Your application is awaiting approval from the circle.
            </p>
          </div>
        </div>
      )}

      {/* Loan Request Modal */}

      {/* Hero Section */}
      <section className="bg-primary-light py-12">
        <div className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary-blue hover:underline mb-6"
          >
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="flex items-center px-6 py-3 bg-primary-lavender text-primary-dark border border-primary-blue rounded-lg hover:opacity-80 hover:cursor-pointer transition-all font-semibold"
              >
                Join a Circle
                <LinkIcon className="w-4 h-4 ml-2" />
              </button>
              <Link
                href="/create"
                className="flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
              >
                Create New Circle <Plus className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </div>
        {/* Mobile: show only Create button */}
        <div className="md:hidden mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-3 bg-primary-lavender text-primary-dark rounded-lg font-semibold"
            >
              Join Circle
            </button>
            <Link
              href="/create"
              className="flex items-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold"
            >
              Create New Circle <Plus className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Circles Grid */}
      <section className="">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && (
              <div className="col-span-full text-center text-primary-slate">
                Loading circles…
              </div>
            )}
            {!loading && circles.length === 0 && (
              <div className="col-span-full text-center text-primary-slate">
                No circles found.
              </div>
            )}
            {!loading &&
              circles.map((circle) => (
                <div
                  key={circle.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 overflow-hidden group"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary-light to-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-2xl font-bold text-primary-dark group-hover:text-primary-blue transition">
                        {circle.name}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          circle.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {circle.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary-slate">
                      <Users className="w-4 h-4" />
                      <span>{circle.members} members</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 space-y-4">
                    {/* Next Payout */}
                    <div className="bg-primary-light rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-primary-blue uppercase tracking-wide">
                          Next Payout
                        </span>
                        <Calendar className="w-4 h-4 text-primary-blue" />
                      </div>
                      <div className="text-xl font-bold text-primary-dark">
                        {circle.nextPayoutHbar}
                      </div>
                      <p className="text-sm text-primary-slate mt-1">
                        {circle.status === "active"
                          ? circle.nextPayout
                          : `Starts ${circle.nextPayout}`}
                      </p>
                    </div>

                    {/* Pool Info */}
                    <div className="flex justify-between items-center border-b pb-2 text-sm text-primary-slate">
                      <span>Retain</span>
                      <span className="font-semibold text-primary-dark">
                        {circle.leftPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2 text-sm text-primary-slate">
                      <span>Loan Interest</span>
                      <span className="font-semibold text-primary-dark">
                        {circle.interestPercent}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-primary-slate">
                      <span>Loan limit</span>
                      <span className="font-bold text-primary-blue text-lg">
                        {circle.loanableAmount}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-gray-100">
                    <Link
                      href={`/circle/${circle.slug}`}
                      className="flex-1 px-4 py-2 bg-primary-blue text-white text-center rounded-lg font-medium hover:opacity-90 hover:cursor-pointer transition"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleRequestLoanClick(circle)}
                      className="flex-1 px-4 py-2 bg-primary-lavender text-primary-dark text-center rounded-lg font-medium hover:opacity-80 hover:cursor-pointer transition"
                    >
                      Request Loan
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
