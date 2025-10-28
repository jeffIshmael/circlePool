import Header from "@/components/Header";
import Link from "next/link";
import { Users, Coins, TrendingUp, Shield, Clock, Globe, ArrowLeft } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-light py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center text-primary-blue hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          <h1 className="text-5xl font-bold text-primary-dark mb-6">
            About CirclePool
          </h1>
          <p className="text-xl text-primary-slate leading-relaxed">
            We're reimagining traditional rotating savings groups (chamas) for the digital age. 
            CirclePool combines the trusted model of community savings with blockchain transparency 
            and micro-lending capabilities.
          </p>
        </div>
      </section>

      {/* Concept Overview */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-dark mb-8">
            The CirclePool Concept
          </h2>
          <div className="prose prose-lg max-w-none text-primary-slate">
            <p className="mb-4">
              CirclePool is a circular savings and micro-lending platform built on Hedera Hashgraph. 
              It takes the traditional chama or rotating savings group model and adds a smart, sustainable twist 
              that creates long-term wealth for your community.
            </p>
            <p className="mb-4">
              Unlike traditional rotating savings where 100% of funds are distributed, CirclePool retains 
              a percentage (set by the circle creator) of each payout in a Group Reserve. This reserve:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Grows over time through retained contributions and loan interest</li>
              <li>Enables members to access micro-loans at rates set by the circle creator</li>
              <li>Creates a sustainable wealth-building ecosystem for your community</li>
              <li>Turns your circle into a mini community bank</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works Detailed */}
      <section className="py-20 bg-primary-light">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-dark mb-12 text-center">
            How CirclePool Works
          </h2>
          
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Group Creation</h3>
                  <p className="text-primary-slate mb-4">
                    Members form a savings circle on CirclePool. The creator sets up:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-primary-slate mb-4">
                    <li>Group name and description</li>
                    <li>Number of members</li>
                    <li>Contribution amount and frequency (weekly, monthly, etc.)</li>
                    <li>Retained percentage (percentage of payouts that stays in the reserve)</li>
                    <li>Interest rate for micro-loans from the reserve</li>
                  </ul>
                  <p className="text-primary-slate">
                    Each group is managed by a smart contract on Hedera Hashgraph, ensuring transparency 
                    and automated execution of all transactions.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Regular Contributions</h3>
                  <p className="text-primary-slate mb-4">
                    Every member contributes a fixed amount at regular intervals. Contributions are:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-primary-slate mb-4">
                    <li>Recorded on-chain for full transparency</li>
                    <li>Managed automatically through Hedera stablecoins</li>
                    <li>Tracked in real-time by all members</li>
                    <li>Protected by smart contract logic</li>
                  </ul>
                  <p className="text-primary-slate">
                    The system eliminates the need for manual tracking and prevents disputes.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Rotational Payouts</h3>
                  <p className="text-primary-slate mb-4">
                    Each cycle, one member receives the pooled funds as a payout. The circle creator decides how much 
                    goes to the member and how much stays in the reserve. Here's the CirclePool advantage:
                  </p>
                  <div className="bg-primary-light rounded-lg p-4 mb-4">
                    <p className="font-semibold text-primary-dark mb-2">The Flexible Split</p>
                    <p className="text-primary-slate">
                      When a payout happens, <strong>the receiving member gets most of the funds</strong>, while 
                      <strong>a percentage (configured by the circle creator) is retained in the CirclePool Group Reserve</strong>. 
                      This retained portion becomes a growing shared fund that benefits all members.
                    </p>
                  </div>
                  <p className="text-primary-slate">
                    This is the key innovation: your savings group becomes more than just rotating payouts - 
                    it becomes a wealth-building mechanism.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    4
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Micro-Lending from the Reserve</h3>
                  <p className="text-primary-slate mb-4">
                    Members can borrow from the Group Reserve at an interest rate set by the circle creator. This is how it works:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-primary-slate mb-4">
                    <li>Loan requests are submitted to the group</li>
                    <li>Interest rate is determined when the circle is created</li>
                    <li>Approval happens through group voting or automatic contract rules</li>
                    <li>Interest earned is added back to the reserve, making everyone's pot grow</li>
                    <li>Essentially, your chama becomes a mini community bank</li>
                  </ul>
                  <p className="text-primary-slate">
                    This creates additional value for members while strengthening the group's financial position.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    5
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Transparency & Security</h3>
                  <p className="text-primary-slate mb-4">
                    All transactions — contributions, payouts, loans, and repayments — are recorded on Hedera Hashgraph:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-primary-light p-4 rounded-lg text-center">
                      <Shield className="w-8 h-8 text-primary-blue mx-auto mb-2" />
                      <p className="font-semibold text-primary-dark">Immutable Records</p>
                      <p className="text-sm text-primary-slate">All transactions are permanent and verifiable</p>
                    </div>
                    <div className="bg-primary-light p-4 rounded-lg text-center">
                      <Coins className="w-8 h-8 text-primary-blue mx-auto mb-2" />
                      <p className="font-semibold text-primary-dark">Near-Zero Fees</p>
                      <p className="text-sm text-primary-slate">Less than $0.01 per transaction</p>
                    </div>
                    <div className="bg-primary-light p-4 rounded-lg text-center">
                      <Clock className="w-8 h-8 text-primary-blue mx-auto mb-2" />
                      <p className="font-semibold text-primary-dark">Fast Settlement</p>
                      <p className="text-sm text-primary-slate">Transactions complete in seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary-blue rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    6
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-primary-dark mb-4">Group Growth Over Time</h3>
                  <p className="text-primary-slate mb-4">
                    Even after everyone has received their turn, the group fund continues to grow from:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-primary-slate mb-4">
                    <li>Retained savings from each payout cycle</li>
                    <li>Loan interest accumulated from micro-lending</li>
                    <li>Compound growth on the reserve fund</li>
                  </ul>
                  <div className="bg-blue-50 border border-primary-blue rounded-lg p-4">
                    <p className="text-primary-dark font-semibold mb-2">Community Decision Making</p>
                    <p className="text-primary-slate text-sm">
                      Members can vote to withdraw shared profits or reinvest into the next saving cycle. 
                      This turns a short-term chama into a sustainable wealth-building ecosystem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-primary-dark mb-12 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-primary-light p-6 rounded-xl border border-primary-lavender">
              <Globe className="w-10 h-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-primary-dark mb-3">Built on Hedera</h3>
              <p className="text-primary-slate">
                Low-cost transactions, fast settlement, and enterprise-grade security on the Hedera Hashgraph network.
              </p>
            </div>
            <div className="bg-primary-light p-6 rounded-xl border border-primary-lavender">
              <Users className="w-10 h-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-primary-dark mb-3">Smart Contract Managed</h3>
              <p className="text-primary-slate">
                Automated group fund management through transparent smart contracts that ensure fairness.
              </p>
            </div>
            <div className="bg-primary-light p-6 rounded-xl border border-primary-lavender">
              <TrendingUp className="w-10 h-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-primary-dark mb-3">Sustainable Growth</h3>
              <p className="text-primary-slate">
                Built-in mechanisms for wealth accumulation through retained savings and lending interest.
              </p>
            </div>
            <div className="bg-primary-light p-6 rounded-xl border border-primary-lavender">
              <Shield className="w-10 h-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-primary-dark mb-3">Transparent</h3>
              <p className="text-primary-slate">
                Every transaction is immutable and verifiable on the blockchain. No trust required.
              </p>
            </div>
            <div className="bg-primary-light p-6 rounded-xl border border-primary-lavender">
              <Clock className="w-10 h-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-primary-dark mb-3">Mobile-First</h3>
              <p className="text-primary-slate">
                Access your circle, contribute, and track progress from anywhere in the world, anytime.
              </p>
            </div>
            <div className="bg-primary-light p-6 rounded-xl border border-primary-lavender">
              <Users className="w-10 h-10 text-primary-blue mb-4" />
              <h3 className="text-xl font-bold text-primary-dark mb-3">Community Controlled</h3>
              <p className="text-primary-slate">
                Group decisions made through democratic voting. You control how your circle grows.
              </p>
            </div>
          </div>
        </div>
      </section>

  
    </div>
  );
}

