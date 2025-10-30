"use client";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, Bell, User, Settings, DollarSign, Users, CheckCircle, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useHashConnect } from "@/app/hooks/useHashConnect";
import { getUsersNotificationsAndRequests, getUsersLoanRequests, getUserByAddress, updateUserName } from "@/app/lib/prismafunctions";
import { toast } from "sonner";


export default function Profile() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'profile' | 'settings' | 'loan-requests'>('notifications');
  const { accountId } = useHashConnect();
  const [loading, setLoading] = useState(true);
  const [simpleNotifications, setSimpleNotifications] = useState<any[]>([]);
  const [actionableJoinRequests, setActionableJoinRequests] = useState<any[]>([]);
  const [actionableLoanRequests, setActionableLoanRequests] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userLoanRequests, setUserLoanRequests] = useState<Array<{
    id: number;
    circleName?: string;
    amount: string;
    interestRate: string;
    submittedDate: string;
    paybackDate: string;
    duration: string;
    status: string;
    estimatedTotal: string;
  }>>([]);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const hasChanges = (editName !== (userProfile?.userName || "")) || (editEmail !== (userProfile?.email || ""));

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!accountId) {
        setSimpleNotifications([]);
        setActionableJoinRequests([]);
        setActionableLoanRequests([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getUsersNotificationsAndRequests(accountId);
        // notifications: plain list
        if (!cancelled) setSimpleNotifications(data.notifications || []);
        // join requests requiring action (admin of circles)
        if (!cancelled) setActionableJoinRequests(data.joinRequests || []);
        // loan requests to circles the user admins (pending only)
        const pendingLoans = Array.isArray(data.circleLoanRequests)
          ? data.circleLoanRequests.filter((r: any) => r.status === 'pending')
          : [];
        if (!cancelled) setActionableLoanRequests(pendingLoans);

        // load user profile
        const user = await getUserByAddress(accountId);
        if (!cancelled) setUserProfile(user || null);

        // load user's own loan requests for the My Loan Requests tab
        const myLoans: any[] = await getUsersLoanRequests(accountId);
        const mapped = myLoans.map((lr) => {
          const amountNum = Number(lr.amount || 0);
          const rate = Number(lr.interestRate || 0);
          const months = Number(lr.duration || 0);
          const start = lr.startDate ? new Date(lr.startDate) : new Date();
          const due = new Date(start);
          due.setMonth(due.getMonth() + (Number.isFinite(months) ? months : 0));
          const totalDueNum = amountNum * (1 + (rate / 100) * months);
          const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          return {
            id: lr.id,
            circleName: lr.circle?.name,
            amount: `${amountNum} HBAR`,
            interestRate: `${rate}%`,
            submittedDate: fmt(start),
            paybackDate: fmt(due),
            duration: `${months} month${months === 1 ? '' : 's'}`,
            status: lr.status || 'pending',
            estimatedTotal: `${totalDueNum.toFixed(2)} HBAR`,
          };
        });
        if (!cancelled) setUserLoanRequests(mapped);
      } catch {
        if (!cancelled) {
          setSimpleNotifications([]);
          setActionableJoinRequests([]);
          setActionableLoanRequests([]);
          setUserProfile(null);
          setUserLoanRequests([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [accountId]);

  // Sync editable fields when profile loads
  useEffect(() => {
    setEditName(userProfile?.userName || "");
    setEditEmail(userProfile?.email || "");
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!accountId) {
      toast.error("Connect wallet first");
      return;
    }
    try {
      setSavingProfile(true);
      await updateUserName(accountId, editName || null, editEmail || null);
      const refreshed = await getUserByAddress(accountId);
      setUserProfile(refreshed || null);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };



  return (
    <div className="min-h-screen bg-primary-light">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary-light ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Desktop Back Link */}
          <div className="flex flex-col">
            <Link href="/" className="hidden md:inline-flex items-center text-primary-blue hover:underline mb-4">
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
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex gap-2 border-b border-primary-lavender mb-6">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === 'notifications'
                  ? 'text-primary-blue border-b-2 border-primary-blue'
                  : 'text-primary-slate hover:text-primary-dark'
              }`}
            >
              Notifications ({simpleNotifications.filter((n: any) => !n.read).length})
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
      <section className="py-8 ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-0">
          {/* Mobile View - Show all sections stacked */}
          <div className="md:hidden">
            {/* Profile Section */
            }
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Account ID</label>
                  <input
                    type="text"
                    value={accountId || ""}
                    readOnly
                    className="w-full px-4 py-3 bg-primary-light border border-primary-lavender rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Display Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  />
                </div>
                <button onClick={handleSaveProfile} disabled={savingProfile || !hasChanges} className={`px-4 py-3 rounded-lg font-semibold ${savingProfile || !hasChanges ? "bg-gray-300 text-gray-600" : "bg-primary-blue text-white hover:bg-opacity-90"}`}>
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-primary-dark mb-4">Notifications</h2>
              <div className="space-y-3">
                {simpleNotifications.map((notification: any) => (
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
            <div className="space-y-6">
              {/* Action Required */}
              <div>
                <h3 className="text-lg font-semibold text-primary-dark mb-3">Action required</h3>
                {loading && (
                  <div className="text-primary-slate text-sm">Loading…</div>
                )}
                {!loading && actionableJoinRequests.length === 0 && actionableLoanRequests.length === 0 && (
                  <div className="text-primary-slate text-sm">No pending actions.</div>
                )}

                <div className="space-y-4">
                  {actionableJoinRequests.map((req) => (
                    <div key={`join-${req.id}`} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                            <Users className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-primary-dark mb-1">Join Request</h4>
                            <p className="text-primary-slate text-sm">A user requested to join your circle (ID {req.circleId}).</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toast.success("Approved")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">Approve</button>
                          <button onClick={() => toast.error("Rejected")} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {actionableLoanRequests.map((lr) => (
                    <div key={`loan-${lr.id}`} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-primary-dark mb-1">Loan Request</h4>
                            <p className="text-primary-slate text-sm">{lr.user?.userName || lr.user?.address} requested a loan of {lr.amount} HBAR in {lr.circle?.name || `Circle #${lr.circleId}`}.</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toast.success("Approved")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm">Approve</button>
                          <button onClick={() => toast.error("Rejected")} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Other notifications */}
              <div>
                <h3 className="text-lg font-semibold text-primary-dark mb-3">Updates</h3>
                {loading && (
                  <div className="text-primary-slate text-sm">Loading…</div>
                )}
                {!loading && simpleNotifications.length === 0 && (
                  <div className="text-primary-slate text-sm">No notifications.</div>
                )}
                <div className="space-y-4">
                  {simpleNotifications.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
                        notification.read ? 'border-gray-300' : 'border-primary-blue'
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
                              <h3 className="font-bold text-primary-dark">{notification.title || 'Notification'}</h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-primary-blue rounded-full"></span>
                              )}
                            </div>
                            <p className="text-primary-slate mb-2">{notification.message}</p>
                            {notification.circle && (
                              <p className="text-xs text-primary-blue">From: {notification.circle}</p>
                            )}
                            {notification.createdAt && (
                              <p className="text-xs text-primary-slate">{new Date(notification.createdAt).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-primary-dark mb-6">Profile Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-primary-dark mb-2">Account ID</label>
                  <input
                    type="text"
                    value={accountId || ""}
                    readOnly
                    className="w-full px-4 py-3 bg-primary-light border border-primary-lavender rounded-lg text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-primary-dark mb-2">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-primary-dark mb-2">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-primary-lavender rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    />
                  </div>
                </div>
                <button onClick={handleSaveProfile} disabled={savingProfile || !hasChanges} className={`px-6 py-3 rounded-lg transition-all font-semibold ${savingProfile || !hasChanges ? "bg-gray-300 text-gray-600" : "bg-primary-blue text-white hover:bg-opacity-90"}`}>
                  {savingProfile ? "Saving..." : "Save Changes"}
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
              {userLoanRequests.map((request: any) => (
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

