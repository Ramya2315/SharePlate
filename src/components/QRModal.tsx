import React, { useEffect, useState } from 'react';
import { X, Check, Copy, QrCode } from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from '../contexts/ToastContext.tsx';

interface QRModalProps {
  taskId: string;
  onClose: () => void;
}

export const QRModal: React.FC<QRModalProps> = ({ taskId, onClose }) => {
  const [data, setData] = useState<{
    code: string;
    qrDataUrl: string;
    status: string;
    instructions: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchQr = async () => {
      try {
        const res = await api.getPickupQr(taskId);
        setData(res);
      } catch (err: any) {
        showToast(err.message || 'Failed to load QR code', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchQr();
  }, [taskId]);

  const handleCopyCode = () => {
    if (data?.code) {
      navigator.clipboard.writeText(data.code);
      setCopied(true);
      showToast('Pickup verification code copied to clipboard', 'info');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 bg-emerald-50 text-[#183B28] rounded-xl flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Pickup Handover Verification</h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          Present this secure code to the assigned volunteer or recipient upon physical food transfer.
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-3 border-[#183B28] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Generating cryptographic token...</p>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs mb-4">
              <img
                src={data.qrDataUrl}
                alt="Pickup Verification QR Code"
                className="w-48 h-48 rounded-lg object-contain"
              />
            </div>

            <div className="w-full bg-slate-50 rounded-xl p-3 border border-slate-200 mb-4 flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold text-left">
                  Verification Code
                </span>
                <span className="text-xl font-bold font-mono tracking-widest text-[#183B28]">
                  {data.code}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                title="Copy Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed text-left bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100">
              {data.instructions}
            </p>
          </div>
        ) : (
          <div className="text-xs text-rose-600 py-6">Could not load QR code.</div>
        )}
      </div>
    </div>
  );
};
