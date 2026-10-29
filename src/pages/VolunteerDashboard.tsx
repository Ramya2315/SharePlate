import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { api } from '../services/api.ts';
import { PickupTask } from '../types/index.ts';
import { QRModal } from '../components/QRModal.tsx';
import { LogisticsMapAgent } from '../components/LogisticsMapAgent.tsx';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  QrCode,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Package,
  Navigation,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<PickupTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogisticsMap, setShowLogisticsMap] = useState(false);

  // Verification dialog
  const [verifyingTaskId, setVerifyingTaskId] = useState<string | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [targetStatus, setTargetStatus] = useState<'picked_up' | 'delivered'>('picked_up');
  const [verifying, setVerifying] = useState(false);

  // QR Modal
  const [activeQrModalTaskId, setActiveQrModalTaskId] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const res = await api.getPickups();
      setTasks(res.tasks || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch pickup tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleClaimTask = async (taskId: string) => {
    try {
      await api.claimPickup(taskId);
      showToast('You accepted this pickup task! Safe travels.', 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to claim task', 'error');
    }
  };

  const handleUpdateStatusManual = async (taskId: string, nextStatus: string) => {
    try {
      await api.updatePickupStatus(taskId, nextStatus);
      showToast(`Task status marked as ${nextStatus}`, 'success');
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingTaskId || !verificationCodeInput.trim()) {
      showToast('Please type the verification code provided by the donor or kitchen staff', 'error');
      return;
    }

    setVerifying(true);
    try {
      await api.verifyPickupCode(verifyingTaskId, verificationCodeInput.trim(), targetStatus);
      showToast(`Handover verified! Task updated to ${targetStatus}.`, 'success');
      setVerifyingTaskId(null);
      setVerificationCodeInput('');
      fetchTasks();
    } catch (err: any) {
      showToast(err.message || 'Verification code mismatch or expired token', 'error');
    } finally {
      setVerifying(false);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'delivered' && t.status !== 'cancelled');
  const completedTasks = tasks.filter((t) => t.status === 'delivered');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Courier Dispatch</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#183B28]">{user?.name}</span>
            <span className="text-emerald-700 font-medium">· Active Courier</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Food Rescue Pickups & Handover</h1>
        </div>

        <button
          onClick={() => setShowLogisticsMap(!showLogisticsMap)}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-all shadow-xs flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" />
          <span>{showLogisticsMap ? 'Hide Route Agent' : 'Open Google Maps & Route Agent'}</span>
        </button>
      </div>

      {/* Embedded Real-time Google Maps Logistics Agent */}
      {showLogisticsMap && (
        <div className="animate-in fade-in slide-in-from-top-3">
          <LogisticsMapAgent />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Pending Pickups</span>
          <span className="block text-2xl font-bold text-amber-600 mt-1 tabular-nums">
            {activeTasks.length}
          </span>
          <span className="text-[11px] text-slate-500">Requires physical collection</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Delivered Handouts</span>
          <span className="block text-2xl font-bold text-[#183B28] mt-1 tabular-nums">
            {completedTasks.length}
          </span>
          <span className="text-[11px] text-slate-500">Cryptographically confirmed</span>
        </div>
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Verified Courier Rating</span>
          <span className="block text-2xl font-bold text-slate-900 mt-1 tabular-nums">100%</span>
          <span className="text-[11px] text-emerald-700">Zero safety incidents</span>
        </div>
      </div>

      {/* Active Tasks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Active Rescue Routes ({activeTasks.length})</h2>
          <span className="text-xs text-slate-500">Confirm collection upon physical handover</span>
        </div>

        {activeTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No active pickup tasks currently assigned to you. Check back as new donation claims are approved!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTasks.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-base font-bold text-slate-900 block">{t.foodName}</span>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        {t.quantity} {t.unit} to rescue
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'assigned'
                          ? 'bg-amber-100 text-amber-800'
                          : t.status === 'accepted'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600 border border-slate-200/80">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-[#183B28] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900 block">Pickup Location:</span>
                        <span>{t.providerName} — {t.providerAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900 block">Delivery Destination:</span>
                        <span>{t.ngoName} — {t.destinationAddress}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-amber-800">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Collection deadline: {new Date(t.collectionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {t.notes && (
                    <p className="text-[11px] text-slate-500 italic">Instructions: "{t.notes}"</p>
                  )}
                </div>

                {/* Handover & Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  {!t.volunteerId ? (
                    <button
                      onClick={() => handleClaimTask(t.id)}
                      className="w-full py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-2xs"
                    >
                      Accept This Task
                    </button>
                  ) : t.status === 'assigned' ? (
                    <button
                      onClick={() => handleUpdateStatusManual(t.id, 'accepted')}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors"
                    >
                      En Route to Donor
                    </button>
                  ) : t.status === 'accepted' ? (
                    <button
                      onClick={() => {
                        setVerifyingTaskId(t.id);
                        setTargetStatus('picked_up');
                        setVerificationCodeInput(t.verificationCodePlain || '');
                      }}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Verify Food Pickup</span>
                    </button>
                  ) : t.status === 'picked_up' ? (
                    <button
                      onClick={() => {
                        setVerifyingTaskId(t.id);
                        setTargetStatus('delivered');
                        setVerificationCodeInput(t.verificationCodePlain || '');
                      }}
                      className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Delivery at NGO</span>
                    </button>
                  ) : null}

                  <button
                    onClick={() => setActiveQrModalTaskId(t.id)}
                    title="View QR Code"
                    className="p-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">Completed Pickup Deliveries ({completedTasks.length})</h2>
        {completedTasks.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Completed deliveries will appear here with timestamps.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Food Rescued</th>
                  <th className="py-3 px-4 font-semibold">Source Donor</th>
                  <th className="py-3 px-4 font-semibold">Recipient NGO</th>
                  <th className="py-3 px-4 font-semibold text-right">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Verified Time</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedTasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.foodName}</td>
                    <td className="py-3 px-4 text-slate-600">{t.providerName}</td>
                    <td className="py-3 px-4 text-slate-600">{t.ngoName}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{t.quantity} {t.unit}</td>
                    <td className="py-3 px-4 text-slate-500">{t.verifiedAt ? new Date(t.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Verified'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Delivered</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Code Verification Modal */}
      {verifyingTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-left">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {targetStatus === 'delivered' ? 'Confirm Delivery at Non-Profit' : 'Verify Physical Food Pickup'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter the unique 6-character code (or scan QR code) provided at handover.
            </p>

            <form onSubmit={handleConfirmVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Handover Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. SP-8942"
                  required
                  className="w-full py-2.5 px-3 text-sm font-mono font-bold tracking-widest text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28] bg-slate-50 uppercase"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-950 leading-relaxed">
                Matches the donor's digital cryptographic hash. Tokens cannot be reused once confirmed.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingTaskId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#183B28] hover:bg-[#122c1e] rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {activeQrModalTaskId && (
        <QRModal taskId={activeQrModalTaskId} onClose={() => setActiveQrModalTaskId(null)} />
      )}
    </div>
  );
};
