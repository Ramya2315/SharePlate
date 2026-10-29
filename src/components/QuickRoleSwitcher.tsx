import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { UserRole } from '../types/index.ts';
import { ShieldCheck, UtensilsCrossed, Building2, Truck } from 'lucide-react';

interface QuickRoleSwitcherProps {
  onRoleSwitched?: (role: UserRole) => void;
}

export const QuickRoleSwitcher: React.FC<QuickRoleSwitcherProps> = ({ onRoleSwitched }) => {
  const { user, quickDemoLogin } = useAuth();
  const { showToast } = useToast();

  const roles: { role: UserRole; label: string; icon: any; desc: string }[] = [
    { role: 'provider', label: 'Provider', icon: UtensilsCrossed, desc: 'Green Harvest Bakery' },
    { role: 'ngo', label: 'NGO Recipient', icon: Building2, desc: 'Hope Community Kitchen' },
    { role: 'volunteer', label: 'Volunteer', icon: Truck, desc: 'Alex Rivera' },
    { role: 'admin', label: 'Platform Admin', icon: ShieldCheck, desc: 'Eleanor Vance' },
  ];

  const handleSwitch = async (role: UserRole) => {
    try {
      await quickDemoLogin(role);
      showToast(`Switched active session to Demo ${role.toUpperCase()}`, 'success');
      if (onRoleSwitched) onRoleSwitched(role);
    } catch (err: any) {
      showToast(err.message || 'Failed to switch demo role', 'error');
    }
  };

  return (
    <div className="bg-[#F2ECE4] border-b border-[#E3DACD] py-2 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-semibold text-[#183B28]">Demo Role Switcher:</span>
          <span className="hidden sm:inline text-slate-500">Instant evaluation presets for testing all 4 platform roles</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {roles.map(({ role, label, icon: Icon, desc }) => {
            const isActive = user?.role === role;
            return (
              <button
                key={role}
                onClick={() => handleSwitch(role)}
                title={desc}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#183B28] text-white shadow-xs font-semibold'
                    : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
