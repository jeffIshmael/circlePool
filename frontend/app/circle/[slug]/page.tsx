"use client";
import Header from "@/components/Header";
import LoanRequestModal from "@/components/LoanRequestModal";
import PaymentModal from "@/components/PaymentModal";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  CircleDollarSign,
  Percent,
  CalendarClock,
  Share2,
  Clock,
  Loader2,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getCircleById,
  getMembersOnchainWithBalances,
} from "@/app/services/circleService";
import { getCircleBySlug, checkUserIsMemberOfCircle, sendRequestToJoinCircle, checkUserHasPendingJoinRequestToCircle } from "@/app/lib/prismafunctions";
import { useHashConnect } from "@/app/hooks/useHashConnect";
import { toast } from "sonner";

// FIX: Helper function to format dates consistently on client only
function formatDateForDisplay(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" }).toLowerCase();
  const year = date.getFullYear();
  const hours24 = date.getHours();
  const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
  const ampm = hours24 >= 12 ? "PM" : "AM";
  const hours = String(hours12).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
}

export default function CircleDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [slug, setSlug] = useState("");
  const [blockchainCircleId, setBlockchainCircleId] = useState<number | null>(null);

  const { accountId } = useHashConnect();
  const [loading, setLoading] = useState(true);
  // FIX: Add mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [circle, setCircle] = useState({
    id: 0,
    name: "",
    members: 0,
    amount: "0",
    duration: 0,
    retainedPercent: 0,
    interestRate: 0,
    startDate: "",
    nextPayoutAmount: "0 HBAR",
    nextPayoutDate: "",
    poolBalance: "-",
    loanableAmount: "0 HBAR",
    started: false,
  });
  const [members, setMembers] = useState<
    Array<{
      position: number;
      address: string;
      label: string;
      status: string;
      balance: string;
      loan: string;
    }>
  >([]);
  const [isMember, setIsMember] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // FIX: Set mounted on client side only
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!slug) return;
      setLoading(true);
      try {
        const prismaCircle: any = await getCircleBySlug(slug);
        if (!prismaCircle) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const chainCircleId = Number(prismaCircle.blockchainId);
        if (!cancelled) setBlockchainCircleId(chainCircleId);
        const onChain = await getCircleById(chainCircleId);
        // check membership (only if wallet connected)
        if (accountId) {
          try {
            const mem = await checkUserIsMemberOfCircle(accountId, prismaCircle.slug);
            if(!mem) {
              const hasPendingRequest = await checkUserHasPendingJoinRequestToCircle(accountId, prismaCircle.id);
              setPendingRequest(hasPendingRequest);         
            }
            if (!cancelled) setIsMember(!!mem);
          } catch {}
        } else {
          setIsMember(false);
        }
        const membersOnChain = await getMembersOnchainWithBalances(
          chainCircleId
        );
        const memberList = (membersOnChain.members || []).map(
          (m: any, idx: number) => {
            const balH = ((m.balance || 0) / 100_000_000).toFixed(2) + " HBAR";
            const loanH = ((m.loan || 0) / 100_000_000).toFixed(2) + " HBAR";
            const label =
              accountId && m.address === accountId ? "You" : m.address;
            const status = (m.balance || 0) > 0 ? "Active" : "Pending";
            return {
              position: idx + 1,
              address: m.address,
              label,
              status,
              balance: balH,
              loan: loanH,
            };
          }
        );

        const amountNum =
          (Number(prismaCircle.amount || 0) *
            (100 - Number(prismaCircle.leftPercent || 0))) /
          100;
        const membersCount = Array.isArray(prismaCircle.members)
          ? prismaCircle.members.length
          : 0;
        const nextPayoutHbar = (amountNum * membersCount).toFixed(2) + " HBAR";

        const started = !!prismaCircle.started;
        const dateSource = started
          ? new Date(prismaCircle.payDate)
          : new Date(prismaCircle.startDate);
        
        // FIX: Format date only on client side to avoid hydration mismatch
        const dateLabel = mounted ? formatDateForDisplay(dateSource) : "Loading...";
        
        const loanableHbar =
          ((onChain.loanableAmount || 0) / 100_000_000).toFixed(2) + " HBAR";
        const amountHbar = (Number(prismaCircle.amount || 0)) + " HBAR";

        if (!cancelled) {
          setCircle({
            id: prismaCircle.id,
            name: prismaCircle.name,
            members: membersCount,
            amount: amountHbar,
            duration: prismaCircle.cycleTime,
            retainedPercent: Number(prismaCircle.leftPercent || 0),
            interestRate: Number(prismaCircle.interestPercent || 0),
            startDate: dateLabel,
            nextPayoutAmount: nextPayoutHbar,
            nextPayoutDate: dateLabel,
            poolBalance: "-",
            loanableAmount: loanableHbar,
            started,
          });
          setMembers(memberList);
        }
      } catch {
        if (!cancelled) {
          setMembers([]);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, accountId, mounted]); // FIX: Add mounted to dependencies

  const handleLoanSuccess = () => {
    setShowLoanModal(false);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    toast.success("Payment successful! Refreshing data...");
    // Reload circle data
    if (slug) {
      setLoading(true);
      try {
        const prismaCircle: any = await getCircleBySlug(slug);
        if (prismaCircle) {
          const chainCircleId = Number(prismaCircle.blockchainId);
          const onChain = await getCircleById(chainCircleId);
          const membersOnChain = await getMembersOnchainWithBalances(chainCircleId);
          const memberList = (membersOnChain.members || []).map(
            (m: any, idx: number) => {
              const balH = ((m.balance || 0) / 100_000_000).toFixed(2) + " HBAR";
              const loanH = ((m.loan || 0) / 100_000_000).toFixed(2) + " HBAR";
              const label =
                accountId && m.address === accountId ? "You" : m.address;
              const status = (m.balance || 0) > 0 ? "Active" : "Pending";
              return {
                position: idx + 1,
                address: m.address,
                label,
                status,
                balance: balH,
                loan: loanH,
              };
            }
          );
          const loanableHbar =
            ((onChain.loanableAmount || 0) / 100_000_000).toFixed(2) + " HBAR";
          setCircle((prev) => ({ ...prev, loanableAmount: loanableHbar }));
          setMembers(memberList);
        }
      } catch (error) {
        console.error("Failed to refresh data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // FIX: Only get shareLink on client side
  const shareLink = mounted && typeof window !== "undefined" ? window.location.href : "";
  
  const copyShare = async () => {
    // FIX: Check if clipboard API is available
    if (!mounted || typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard not available");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleRequestToJoin = async () => {
    try {
      if (!accountId) {
        toast.error("Please connect your wallet to send a join request");
        return;
      }
      await sendRequestToJoinCircle(accountId, circle.id);
      toast.success("Join request sent. Awaiting approval from the circle admin.");
    } catch {
      toast.error("Failed to send join request");
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-primary-light">
        <Header />
        <section className="pt-24 md:pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-primary-lavender/40 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-primary-dark mb-2">Circle not found</h1>
              <p className="text-primary-slate">The circle you are looking for does not exist or was removed.</p>
              <div className="mt-6">
                <Link href="/my-circles" className="px-4 py-2 bg-primary-blue text-white rounded-lg">Back to My Circles</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Show loading skeleton until all data is loaded
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-primary-light">
        <Header />
        <section className="pt-24 md:pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary-blue mx-auto mb-4" />
                <p className="text-primary-slate text-lg">Loading circle details...</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />

      {/* Loan Notification */}
      {showNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 max-w-sm w-11/12"
        >
          <DollarSign className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">Loan Request Submitted!</p>
            <p className="text-xs text-white/80">
              Awaiting approval from the circle.
            </p>
          </div>
        </motion.div>
      )}

      <LoanRequestModal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        circleName={circle.name || "Circle"}
        interestRate={`${circle.interestRate}%`}
        availableAmount={circle.loanableAmount}
        onSuccess={handleLoanSuccess}
      />

      {blockchainCircleId !== null && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          circleName={circle.name || "Circle"}
          circleId={circle.id}
          circleBlockchainId={blockchainCircleId}
          requiredAmount={circle.amount}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Hero Section */}
      <section className="pt-24 md:pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/my-circles"
            className="inline-flex items-center text-primary-blue hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Circles
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`rounded-3xl shadow-xl p-6 md:p-8 border ${
              circle.started
                ? "bg-white border-green-200"
                : "bg-gray-100 border-gray-300"
            }`}
          >
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-primary-dark flex items-center gap-3">
                  {circle.name}
                  {circle.started ? (
                    <span className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                      🟢 Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                      🕓 Not Started
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-bold mt-4 text-primary-slate" style={{ fontSize: "12px" }}>
                  <CalendarClock className="w-4 h-4 text-primary-blue" />
                  <span className="text-bold">
                    {circle.amount}/{circle.duration} days
                  </span>

                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-primary-slate">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-blue" />{" "}
                    {circle.members} Members
                  </span>
                  <span className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary-blue" />{" "}
                    {circle.retainedPercent}% Retained for every payout • {circle.interestRate}%
                    Interest on loans
                  </span>
                </div>
              </div>

              {/* Share Button */}
              <div className="relative group">
                <button
                  onClick={async () => {
                    await copyShare();
                    setShowShare(true);
                    setTimeout(() => setShowShare(false), 1500);
                  }}
                  aria-label="copy link"
                  className="px-4 py-2 bg-primary-blue text-white hover:cursor-pointer rounded-xl font-semibold hover:bg-primary-blue/80 transition-all flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                {/* Tooltip */}
                <div className={`pointer-events-none absolute right-0 top-full mt-2 z-40 text-center ${showShare ? "block" : "hidden"} group-hover:block`}>
                  <div className="rounded-md bg-black/80 text-white text-xs px-2 py-1 shadow-md whitespace-nowrap">
                    Copy link to share
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[
              {
                label: circle.started ? "Next Payout Amount" : "Planned Payout",
                value: circle.nextPayoutAmount,
                icon: <CircleDollarSign className="w-4 h-4" />,
              },
              // show loan limit only for members
              ...(isMember
                ? [
                    {
                      label: "Loan Limit",
                      value: circle.loanableAmount,
                      icon: <DollarSign className="w-4 h-4" />,
                      sub: circle.started
                        ? "Available for loans"
                        : "Loans unavailable until start",
                      button: true,
                    } as const,
                  ]
                : []),
              {
                label: circle.started ? "Next Pay Date" : "Start Date",
                value: circle.nextPayoutDate,
                icon: <Calendar className="w-4 h-4" />,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-primary-lavender/40 p-6 shadow-md hover:shadow-lg transition-all"
              >
                <div className="text-xs font-semibold text-primary-blue uppercase tracking-wide mb-2 flex items-center gap-2">
                  {item.icon} {item.label}
                </div>
                <div className="text-2xl font-bold text-primary-dark mb-2">
                  {item.value}
                </div>
                {item.sub && (
                  <div className="text-sm text-primary-slate mb-3">
                    {item.sub}
                  </div>
                )}
                {item.button && (
                  <button
                    onClick={() => {
                      if (circle.started) setShowLoanModal(true);
                      else toast.warning("Circle hasn't started yet!");
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                      circle.started
                        ? "bg-primary-blue text-white hover:bg-opacity-90"
                        : "bg-gray-300 text-gray-600 cursor-not-allowed"
                    }`}
                  >
                    {circle.started ? "Request Loan" : "Not Available"}
                  </button>
                )}
              </motion.div>
            ))}
            {!isMember && (
              <div className="bg-white rounded-2xl border border-primary-lavender/40 p-6 shadow-md flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-primary-blue uppercase tracking-wide mb-2">Membership</div>
                  <div className="text-primary-dark font-semibold">You are not a member of this circle</div>
                  <div className="text-sm text-primary-slate">Request access to view loan limits and member balances.</div>
                </div>
                <button
                  onClick={() => handleRequestToJoin()}
                  className="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90"
                >
                  {pendingRequest ? "Request Sent" : "Request to Join"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Members Table */}
      {isMember ? (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-primary-dark mb-6">
              Members & Balances
            </h2>

            {!circle.started && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" />
                This circle has not started yet. Balances & payout order will update once it
                begins.
              </div>
            )}

            {/* Make Payment Button - Only for members */}
            {isMember && (
              <div className="mb-6 flex justify-end">
                <button
                  onClick={() => {
                    if (!accountId) {
                      toast.error("Please connect your wallet to make a payment");
                      return;
                    }
                    setShowPaymentModal(true);
                  }}
                  className="px-6 py-3 bg-primary-blue text-white rounded-xl font-semibold hover:bg-primary-blue/90 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <CreditCard className="w-5 h-5" />
                  Make Payment
                </button>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-primary-lavender">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-primary-lavender sticky top-0">
                    <tr>
                      {["#", "Member", "Status", "Balance", "Loan"].map((col) => (
                        <th
                          key={col}
                          className="px-6 py-4 text-left text-sm font-semibold text-primary-dark"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-lavender">
                    {members.map((m) => (
                      <tr
                        key={m.address}
                        className="hover:bg-primary-light/50 transition"
                      >
                        <td className="px-6 py-4 text-sm">{m.position}</td>
                        <td className="px-6 py-4 font-mono text-xs break-all">
                          {m.label}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              m.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{m.balance}</td>
                        <td className="px-6 py-4 text-sm">{m.loan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl border border-primary-lavender/40 p-8 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-primary-dark mb-1">Members & Balances</h3>
                <p className="text-sm text-primary-slate">Only members can view member list and balances.</p>
              </div>
              <button
                onClick={() => toast.info("Join request sent")}
                className="px-4 py-2 bg-primary-blue text-white rounded-lg font-semibold hover:bg-opacity-90"
              >
                Request to Join
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}