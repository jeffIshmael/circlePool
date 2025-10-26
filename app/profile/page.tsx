"use client";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, Bell, User, Settings, DollarSign, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { useState } from "react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'profile' | 'settings' | 'loan-requests'>('notifications');

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'loan_approved',
      title: 'Loan Approved!',
      message: 'Your loan request of 500 HBAR has been approved',
      time: '2 hours ago',
      read: false,
      circle: 'Family Savings Circle',
    },
    {
      id: 2,
      type: 'payout_received',
      title: 'Payout Received',
      message: 'You received 2,400 HBAR from Family Savings Circle',
      time: '1 day ago',
      read: false,
    },
    {
      id: 3,
      type: 'loan_request',
      title: 'New Loan Request',
      message: 'John D. requested a loan of 300 HBAR from Family Savings Circle',
      time: '2 days ago',
      read: true,
      requiresAction: true,
    },
    {
      id: 4,
      type: 'contribution_due',
      title: 'Contribution Due',
      message: 'Your monthly contribution of 400 HBAR is due in 3 days',
      time: '3 days ago',
      read: true,
    },
  ];

  // Mock loan requests data
  const loanRequests = [
    {
      id: 1,
      circleName: "Family Savings Circle",
      amount: "500 HBAR",
      interestRate: "5%",
      submittedDate: "Nov 20, 2024",
      paybackDate: "Jan 20, 2025",
      duration: "2 months",
      status: "pending",
      estimatedTotal: "550 HBAR",
    },
    {
      id: 2,
      circleName: "Friends Investment Group",
      amount: "300 HBAR",
      interestRate: "5%",
      submittedDate: "Nov 15, 2024",
      paybackDate: "Dec 15, 2024",
      duration: "1 month",
      status: "approved",
      estimatedTotal: "315 HBAR",
    },
    {
      id: 3,
      circleName: "Neighborhood Fund",
      amount: "1000 HBAR",
      interestRate: "5%",
      submittedDate: "Nov 10, 2024",
      paybackDate: "Feb 10, 2025",
      duration: "3 months",
      status: "rejected",
      estimatedTotal: "1150 HBAR",
    },
  ];

  return (
    <div className="min-h-screen bg-primary-light">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-light py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop Back Link */}
          <Link href="/" className="hidden md:inline-flex items-center text-primary-blue hover:underline mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          
          <div className="hidden md:inline-flex items-center gap-4 md:gap-6 mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-primary-blue rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold">
              JD
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-primary-dark mb-2">
                Your Profile
              </h1>
              <p className="text-sm md:text-base text-primary-slate">Manage your account and view notifications</p>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-2 border-b border-primary-lavender">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'notifications'
                  ? 'text-primary-blue border-b-2 border-primary-blue'
                  : 'text-primary-slate hover:text-primary-dark'
              }`}
            >
              Notifications ({notifications.filter(n => !n.read).length})
            </button>
            <button
              onClick={() => setActiveTab('loan-requests')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'loan-requests'
                  ? 'text-primary-blue border-b-2 border-primary-blue'
                  : 'text-primary-slate hover:text-primary-dark'
              }`}
            >
              My Loan Requests
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'profile'
                  ? 'text-primary-blue border-b-2 border-primary-blue'
                  : 'text-primary-slate hover:text-primary-dark'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'text-primary-blue border-b-2 border-primary-blue'
                  : 'text-primary-slate hover:text-primary-dark'
              }`}
            >
              Settings
            </button>
          </div>

       
        </div>
      </section>

      {/* Content */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-0">
          {/* Mobile View - Show all sections stacked */}
          <div className="md:hidden">
            {/* Profile Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    readOnly
                    className="w-full px-4 py-3 bg-primary-light border border-primary-lavender rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Display Name</label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Notifications</h2>
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl shadow-lg p-4 border-l-4 ${
                      notification.read
                        ? 'border-gray-300'
                        : 'border-primary-blue'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notification.type === 'loan_approved' ? 'bg-green-100 text-green-600' :
                        notification.type === 'payout_received' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'loan_request' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-primary-light text-primary-blue'
                      }`}>
                        {notification.type === 'loan_approved' && <CheckCircle className="w-5 h-5" />}
                        {notification.type === 'payout_received' && <DollarSign className="w-5 h-5" />}
                        {notification.type === 'loan_request' && <Users className="w-5 h-5" />}
                        {notification.type === 'contribution_due' && <Clock className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm text-primary-dark">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-blue rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-primary-slate mb-1">{notification.message}</p>
                        {notification.circle && (
                          <p className="text-xs text-primary-blue">From: {notification.circle}</p>
                        )}
                        <p className="text-xs text-primary-slate">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>


          </div>

          {/* Desktop View - Tabbed */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                    notification.read
                      ? 'border-gray-300'
                      : 'border-primary-blue'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        notification.type === 'loan_approved' ? 'bg-green-100 text-green-600' :
                        notification.type === 'payout_received' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'loan_request' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-primary-light text-primary-blue'
                      }`}>
                        {notification.type === 'loan_approved' && <CheckCircle className="w-6 h-6" />}
                        {notification.type === 'payout_received' && <DollarSign className="w-6 h-6" />}
                        {notification.type === 'loan_request' && <Users className="w-6 h-6" />}
                        {notification.type === 'contribution_due' && <Clock className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-primary-dark">{notification.title}</h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-blue rounded-full"></span>
                          )}
                        </div>
                        <p className="text-primary-slate mb-2">{notification.message}</p>
                        {notification.circle && (
                          <p className="text-xs text-primary-blue">From: {notification.circle}</p>
                        )}
                        <p className="text-xs text-primary-slate">{notification.time}</p>
                      </div>
                    </div>
                    {notification.requiresAction && (
                      <button className="px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all text-sm font-semibold">
                        Review
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Wallet Address</label>
                  <input
                    type="text"
                    value="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    readOnly
                    className="w-full px-4 py-3 bg-primary-light border border-primary-lavender rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary-dark mb-2">Display Name</label>
                    <input
                      type="text"
                      defaultValue="John Doe"
                      className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-dark mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="john.doe@example.com"
                      className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                </div>
                <button className="px-6 py-3 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'loan-requests' && (
            <div className="space-y-4">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary-dark mb-2">My Loan Requests</h2>
                <p className="text-primary-slate">Track your loan applications across all circles</p>
              </div>
              {loanRequests.map((request) => (
                <div
                  key={request.id}
                  className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                    request.status === 'approved' ? 'border-green-500' :
                    request.status === 'rejected' ? 'border-red-500' :
                    'border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-primary-dark mb-1">{request.circleName}</h3>
                      <p className="text-sm text-primary-slate">Submitted {request.submittedDate}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                      request.status === 'approved' ? 'bg-green-100 text-green-700' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-primary-slate mb-1">Loan Amount</p>
                      <p className="text-lg font-bold text-primary-blue">{request.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-slate mb-1">Estimated Total Due</p>
                      <p className="text-lg font-bold text-primary-dark">{request.estimatedTotal}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-primary-slate">Interest Rate:</p>
                      <p className="font-semibold text-primary-dark">{request.interestRate}</p>
                    </div>
                    <div>
                      <p className="text-primary-slate">Duration:</p>
                      <p className="font-semibold text-primary-dark">{request.duration}</p>
                    </div>
                    <div>
                      <p className="text-primary-slate">Payback Date:</p>
                      <p className="font-semibold text-primary-dark">{request.paybackDate}</p>
                    </div>
                  </div>
                  
                  {request.status === 'approved' && (
                    <button className="w-full px-4 py-2 bg-primary-blue text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold">
                      View Loan Details
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">Settings</h2>
              <div className="space-y-6">
                <div>
                  <label className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-primary-dark">Email Notifications</p>
                      <p className="text-sm text-primary-slate">Receive email updates about your circles</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </label>
                </div>
                <div>
                  <label className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-primary-dark">Push Notifications</p>
                      <p className="text-sm text-primary-slate">Get notified about important updates</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </label>
                </div>
                <div>
                  <label className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-primary-dark">SMS Notifications</p>
                      <p className="text-sm text-primary-slate">Receive SMS alerts</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5" />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

