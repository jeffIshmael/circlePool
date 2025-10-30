"use client";
import Header from "@/components/Header";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const HashConnectButton = dynamic(() => import("./components/HashConnectButton"), { ssr: false });


export default function Home() {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Header />

      {/* Hero Section */}
      <section className="bg-primary-light pt-20 pb-32 relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="2" fill="#5289AD" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-8">
              <h1 className="text-3xl font-bold text-primary-dark leading-tight sm:text-4xl md:text-5xl">
                Transform your savings group into a community bank.
              </h1>
              <p className="text-base sm:text-lg text-primary-slate leading-relaxed">
                CirclePool brings the traditional rotating savings model online,
                but with a powerful twist: a portion of each payout (set by the
                circle creator) stays in the group fund, creating a growing
                reserve that enables micro-loans and sustainable wealth building
                for your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => window.location.href = "/create"} className="inline-flex items-center cursor-pointer justify-center px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-medium">
                  Create a Circle
                  <span className="ml-2">
                    {" "}
                    <ArrowUpRight />{" "}
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2 pt-4">
                <span className="text-sm text-primary-slate">Built on:</span>
                <div className="flex items-center gap-2 text-sm font-semibold text-primary-blue">
                  <Image
                    src="/images/hedera.webp"
                    alt="Hedera Hashgraph"
                    width={20}
                    height={20}
                  />
                  <span>Hedera Hashgraph</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-primary-lavender">
                {/* Circle Name */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-primary-dark mb-1">
                    Family Savings Circle
                  </h3>
                  <p className="text-sm text-primary-slate">8 members</p>
                </div>

                {/* Next Payout Info */}
                <div className="bg-primary-light rounded-xl p-4 mb-6">
                  <div className="text-xs font-semibold text-primary-blue uppercase tracking-wide mb-2">
                    Next Payout
                  </div>
                  <div className="text-3xl font-bold text-primary-dark mb-2">
                    2400 HBAR
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-slate">
                      To:{" "}
                      <span className="font-semibold text-primary-dark">
                        Sarah K.
                      </span>
                    </span>
                    <span className="text-primary-slate">
                      {new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        15
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Circle Pool Balance */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-primary-slate">
                      Circle Pool Balance
                    </span>
                    <span className="text-2xl font-bold text-primary-dark">
                      3200 HBAR
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary-slate">
                      Available for Loans
                    </span>
                    <span className="text-lg font-semibold text-primary-blue">
                      2560 HBAR
                    </span>
                  </div>
                </div>

                {/* Members */}
                <div className="mt-6 pt-6 border-t border-primary-lavender">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-primary-lavender rounded-full flex items-center justify-center">
                      <span className="text-xl">👥</span>
                    </div>
                    <div>
                      <div className="font-medium text-primary-dark">
                        8 Members
                      </div>
                      <div className="text-sm text-primary-slate">
                        Rotating monthly
                      </div>
                    </div>
                  </div>
                  <div className="w-full flex items-center justify-between gap-3">
                    <button className="flex-1 flex items-center justify-center px-4 py-3 border border-primary-gray text-primary-blue rounded-lg transition-all font-medium hover:cursor-not-allowed">
                      View Circle Details <ArrowUpRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Overlapping Card */}
      <div className="relative -mt-10 z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-2xl p-12 md:p-16">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary-blue uppercase tracking-wider mb-3">
                Built on Hedera Hashgraph
              </p>
              <p className="text-lg text-primary-slate max-w-2xl mx-auto">
                Every transaction is transparent, secure, and costs less than
                $0.01 on the Hedera network. Your savings groups gain the power
                of blockchain without the complexity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-primary-light p-8 rounded-xl border border-primary-lavender">
                <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🔄</span>
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-3">
                  Automated Rotations
                </h3>
                <p className="text-primary-slate">
                  Contributions and payouts happen automatically. Members get
                  paid in their turn while a percentage (set by the circle
                  creator) stays in the group reserve.
                </p>
              </div>
              <div className="bg-primary-light p-8 rounded-xl border border-primary-lavender">
                <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🪙</span>
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-3">
                  Micro-Lending
                </h3>
                <p className="text-primary-slate">
                  Borrow from your group's reserve fund at interest rates set by
                  the circle. Interest earned grows the shared pot for
                  everyone's benefit.
                </p>
              </div>
              <div className="bg-primary-light p-8 rounded-xl border border-primary-lavender">
                <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h3 className="text-xl font-bold text-primary-dark mb-3">
                  Growing Reserve
                </h3>
                <p className="text-primary-slate">
                  Watch your circle fund grow over time from retained savings
                  and loan interest, turning your group into a sustainable
                  wealth-building ecosystem.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <section className="pt-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-light to-white" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-dark mb-4">
              Why CirclePool works
            </h2>
            <p className="text-lg text-primary-slate max-w-2xl mx-auto">
              Built on Hedera Hashgraph, CirclePool combines the trust of
              traditional rotating savings with blockchain transparency and
              micro-lending power.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💵</span>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Near-Zero Fees
              </h3>
              <p className="text-primary-slate">
                Transactions cost less than $0.01 on Hedera Hashgraph - the most
                cost-effective savings platform available.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Trustless
              </h3>
              <p className="text-primary-slate">
                Smart contracts manage everything transparently. No
                intermediaries, no fraud risk - just immutable records on
                Hedera.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Fast & Global
              </h3>
              <p className="text-primary-slate">
                Settlements happen in seconds. Members can be anywhere in the
                world and contribute seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-dark mb-4">
              How It Works
            </h2>
            <p className="text-lg text-primary-slate max-w-2xl mx-auto">
              Start a CirclePool group in minutes and watch your community turn
              into a sustainable wealth-building platform.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Create or Join
              </h3>
              <p className="text-primary-slate">
                Start a new savings circle or join an existing one. Set
                contribution amounts, frequency, and rotation order.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Contribute Regularly
              </h3>
              <p className="text-primary-slate">
                Members contribute a fixed amount on schedule. All transactions
                are recorded transparently on Hedera.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Receive Payouts
              </h3>
              <p className="text-primary-slate">
                Each member gets their payout in turn. Most of it goes to you,
                while a percentage (set by your circle) stays in the growing
                group reserve.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                4
              </div>
              <h3 className="text-xl font-bold text-primary-dark mb-3">
                Borrow from Reserve
              </h3>
              <p className="text-primary-slate">
                Access micro-loans from your circle's growing fund at rates set
                by the group. Interest earned grows the shared pot.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-blue rounded-t-3xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to build wealth with your community?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Turn your savings group into a sustainable wealth-building platform
            with CirclePool. Create your circle today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-blue rounded-lg hover:bg-gray-100 transition-all font-semibold">
              Get Started Now
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:text-primary-blue transition-all font-semibold">
              Learn More
            </button>
          </div>
        </div>
      </section>

      <div className="mt-2 mb-2 pt-4  text-center text-gray-600">
        © CirclePool {new Date().getFullYear()}. All Rights Reserved.
      </div>
    </div>
  );
}
