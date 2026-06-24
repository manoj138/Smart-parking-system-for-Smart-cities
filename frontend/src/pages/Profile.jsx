import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Key, Clock, Award } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 pb-12 max-w-3xl">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Admin Profile</h2>
        <p className="text-sm text-slate-400 mt-1">Management credentials and privilege settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* User Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl text-center flex flex-col items-center gap-4 relative overflow-hidden md:col-span-1">
          {/* Background Gradient Circle */}
          <div className="absolute -left-10 -top-10 w-24 h-24 rounded-full bg-indigo-600/10 blur-xl" />
          
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-600/20">
            👮
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-sans">{user?.name || 'System Admin'}</h4>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15 inline-block mt-2">
              {user?.role || 'Administrator'}
            </span>
          </div>
          
          <div className="w-full border-t border-white/5 pt-4 text-left space-y-3.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-indigo-400 shrink-0" />
              <span className="truncate">{user?.email || 'admin@smartparking.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-indigo-400 shrink-0" />
              <span>Full Privileges</span>
            </div>
          </div>
        </div>

        {/* Security / System logs */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl md:col-span-2 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Shield size={18} className="text-indigo-400" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Access privileges</h4>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <Award size={16} className="text-emerald-400" />
                <div className="flex-1">
                  <p className="font-bold text-white uppercase tracking-wider text-[9px] text-slate-400">Database Administration</p>
                  <p className="text-slate-400 mt-0.5">Authorized to modify slots schemas and clean payments tables.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <Key size={16} className="text-indigo-400" />
                <div className="flex-1">
                  <p className="font-bold text-white uppercase tracking-wider text-[9px] text-slate-400">Gate Automation Controller</p>
                  <p className="text-slate-400 mt-0.5">Permissions set to manual override on gate motors and loop sensor loops.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change password mock */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Credentials Management</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs" 
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs" 
                  disabled
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-medium">To modify system administrator accounts password, adjust backend database triggers in app database.py configuration.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
