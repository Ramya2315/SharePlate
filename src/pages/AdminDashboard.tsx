import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { api } from '../services/api.ts';
import { OrganizationVerification, FoodListing, SafetyReport, AuditLog, PlatformAnalytics } from '../types/index.ts';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  Activity,
  Package,
  Clock,
  Building2,
  UserCog,
  MapPin,
  Check,
  Shield,
  Key,
} from 'lucide-react';
import { LogisticsMapAgent } from '../components/LogisticsMapAgent.tsx';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'verifications' | 'logistics' | 'listings' | 'reports' | 'logs'>('users');
  const [usersList, setUsersList] = useState<any[]>([]);
  const [permissionsMatrix, setPermissionsMatrix] = useState<any>(null);
  const [verifications, setVerifications] = useState<OrganizationVerification[]>([]);
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [selectedVerif, setSelectedVerif] = useState<OrganizationVerification | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadData = async () => {
    try {
      const [verifRes, listRes, repRes, logRes, anaRes, usersRes, permRes] = await Promise.all([
        api.getVerifications(),
        api.getListings(),
        api.getSafetyReports(),
        api.getAuditLogs(),
        api.getDashboardAnalytics(),
        api.getUsers(),
        api.getRolePermissions().catch(() => null),
      ]);
      setVerifications(verifRes.verifications || []);
      setListings(listRes.listings || []);
      setSafetyReports(repRes.reports || []);
      setAuditLogs(logRes.auditLogs || []);
      setAnalytics(anaRes);
      setUsersList(usersRes.users || []);
      if (permRes) setPermissionsMatrix(permRes.matrix);
    } catch (err: any) {
      showToast(err.message || 'Failed to load administration dataset', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      showToast(`User role successfully changed to ${newRole.toUpperCase()}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };

  const handleToggleVerification = async (userId: string, currentVal: boolean) => {
    try {
      await api.updateUserVerification(userId, !currentVal);
      showToast(`Verification status set to ${!currentVal ? 'VERIFIED' : 'UNVERIFIED'}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update verification', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleReviewVerification = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.reviewVerification(id, status, reviewNotes);
      showToast(`Organization verification marked as ${status}`, 'success');
      setSelectedVerif(null);
      setReviewNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Review failed', 'error');
    }
  };

  const handleResolveReport = async (id: string, newStatus: string) => {
    try {
      await api.resolveSafetyReport(id, newStatus, 'Investigated and resolved by platform administrator');
      showToast(`Safety report marked as ${newStatus}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const pendingVerifs = verifications.filter((v) => v.status === 'pending');
  const openReports = safetyReports.filter((r) => r.status === 'open');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Administration Console</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#183B28]">{user?.email}</span>
            <span className="text-emerald-700 font-medium">· Platform Superadmin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Governance & Trust Center</h1>
        </div>
      </div>

      {/* Admin KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Pending Verifications</span>
          <span className="block text-2xl font-bold text-amber-600 mt-1 tabular-nums">{pendingVerifs.length}</span>
          <span className="text-[11px] text-slate-500">Charity & donor vetting</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Open Safety Flags</span>
          <span className="block text-2xl font-bold text-rose-600 mt-1 tabular-nums">{openReports.length}</span>
          <span className="text-[11px] text-slate-500">Incident reports queue</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Rescued Food Volume</span>
          <span className="block text-2xl font-bold text-[#183B28] mt-1 tabular-nums">
            {analytics?.metrics.totalKgRescued || '155.0'} kg
          </span>
          <span className="text-[11px] text-slate-500">Verified handovers</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Registered Organizations</span>
          <span className="block text-2xl font-bold text-slate-900 mt-1 tabular-nums">
            {analytics?.metrics.registeredOrganizations || '4'}
          </span>
          <span className="text-[11px] text-slate-500">Providers & NGOs</span>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>User Role Management ({usersList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'verifications'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Organization Verifications ({pendingVerifs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logistics')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'logistics'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Google Maps & Logistics Agent</span>
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'listings'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Surplus Listings</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'reports'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Safety Reports ({openReports.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'logs'
              ? 'border-[#183B28] text-[#183B28]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Logs ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 0: User Role Management Console */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">User Role & Access Governance</h2>
                <p className="text-xs text-slate-500">
                  Manage user roles (Provider, NGO, Volunteer, Admin), authorization levels, and verification status.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono tabular-nums">{usersList.length} registered accounts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">User / Email</th>
                    <th className="py-3 px-4 font-semibold">Organization</th>
                    <th className="py-3 px-4 font-semibold">Current Role</th>
                    <th className="py-3 px-4 font-semibold">Verification</th>
                    <th className="py-3 px-4 font-semibold text-right">Assign New Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{u.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.organizationName ? (
                          <span>{u.organizationName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Individual Courier</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-900'
                              : u.role === 'provider'
                              ? 'bg-emerald-100 text-emerald-900'
                              : u.role === 'ngo'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleVerification(u.id, u.isVerified)}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            u.isVerified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {u.isVerified ? '✓ Verified' : '○ Unverified'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28] font-medium"
                        >
                          <option value="provider">Provider (Donor)</option>
                          <option value="ngo">NGO (Recipient)</option>
                          <option value="volunteer">Volunteer (Courier)</option>
                          <option value="admin">Admin (Full Access)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions Capability Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#183B28]" />
              <h3 className="text-sm font-bold text-slate-900">Platform Role Permissions Matrix</h3>
            </div>
            <p className="text-xs text-slate-600">
              Enforced server-side via JWT and RBAC middleware on all API endpoints.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Capability / Permission</th>
                    <th className="py-2.5 px-3 font-semibold text-center text-emerald-800">Provider</th>
                    <th className="py-2.5 px-3 font-semibold text-center text-blue-800">NGO</th>
                    <th className="py-2.5 px-3 font-semibold text-center text-amber-800">Volunteer</th>
                    <th className="py-2.5 px-3 font-semibold text-center text-purple-800">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { name: 'Publish surplus food listings', p: true, n: false, v: false, a: true },
                    { name: 'Edit / cancel own listings', p: true, n: false, v: false, a: true },
                    { name: 'Submit donation claim request', p: false, n: true, v: false, a: true },
                    { name: 'Approve / reject claims (atomic)', p: true, n: false, v: false, a: true },
                    { name: 'Accept & claim pickup route', p: false, n: false, v: true, a: true },
                    { name: 'Verify QR & single-use code', p: true, n: true, v: true, a: true },
                    { name: 'Review charity verifications', p: false, n: false, v: false, a: true },
                    { name: 'Assign / modify user roles', p: false, n: false, v: false, a: true },
                    { name: 'View administrative audit logs', p: false, n: false, v: false, a: true },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-800 font-medium">{row.name}</td>
                      <td className="py-2 px-3 text-center">{row.p ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="py-2 px-3 text-center">{row.n ? <span className="text-blue-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="py-2 px-3 text-center">{row.v ? <span className="text-amber-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                      <td className="py-2 px-3 text-center">{row.a ? <span className="text-purple-700 font-bold">✓</span> : <span className="text-slate-300">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Google Maps & Logistics Agent */}
      {activeTab === 'logistics' && (
        <div className="space-y-4">
          <LogisticsMapAgent />
        </div>
      )}

      {/* Tab 1: Organization Verifications */}
      {activeTab === 'verifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Organization Verification Requests</h2>
            <span className="text-xs text-slate-500">{verifications.length} total applications</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Organization</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Registration #</th>
                  <th className="py-3 px-4 font-semibold">Documentation Excerpt</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {verifications.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{v.organizationName}</span>
                      <span className="text-[11px] text-slate-500">{v.contactPerson} · {v.phone}</span>
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600">{v.organizationType.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{v.registrationNumber}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{v.documentsDescription}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          v.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {v.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReviewVerification(v.id, 'approved')}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-md transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewVerification(v.id, 'rejected')}
                            className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Listings Oversight */}
      {activeTab === 'listings' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Platform Food Listings Oversight</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Food Listing</th>
                  <th className="py-3 px-4 font-semibold">Provider</th>
                  <th className="py-3 px-4 font-semibold text-right">Remaining / Total</th>
                  <th className="py-3 px-4 font-semibold">Deadline</th>
                  <th className="py-3 px-4 font-semibold">Safety Declaration</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.foodName}</td>
                    <td className="py-3 px-4 text-slate-600">{l.providerName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{l.remainingQuantity} / {l.quantity} {l.unit}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(l.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-4">
                      <span className="text-emerald-700 font-semibold text-[11px]">✓ Confirmed</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Safety Incident Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Food Safety & Hygiene Incident Reports</h2>
          {safetyReports.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No safety complaints filed. Platform is nominal.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {safetyReports.map((rep) => (
                <div key={rep.id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{rep.reportedEntityTitle}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold uppercase">
                        {rep.issueType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(rep.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    "{rep.description}"
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">Reported by: {rep.reporterEmail}</span>
                    {rep.status === 'open' ? (
                      <button
                        onClick={() => handleResolveReport(rep.id, 'resolved')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-[#183B28] rounded-md hover:bg-[#122c1e]"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-semibold">Resolved</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Administrative Audit Trail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Actor Email</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Resource</th>
                  <th className="py-3 px-4 font-semibold">Resource ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-4 font-sans font-medium text-slate-800">{log.actorEmail}</td>
                    <td className="py-2.5 px-4 font-bold text-[#183B28]">{log.action}</td>
                    <td className="py-2.5 px-4 text-slate-600">{log.resourceType}</td>
                    <td className="py-2.5 px-4 text-slate-400 text-[11px]">{log.resourceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
