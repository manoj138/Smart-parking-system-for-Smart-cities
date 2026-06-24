import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Car, 
  Maximize2, 
  LogIn, 
  LogOut, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings, 
  User, 
  ChevronDown, 
  ChevronRight,
  Shield,
  Cpu
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [parkingOpen, setParkingOpen] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(true);

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) => `
    flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
    ${isActive(path) 
      ? 'bg-indigo-600/95 text-white shadow-lg shadow-indigo-600/20 glow-indigo' 
      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'}
  `;

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-white/5 flex flex-col z-20">
      <div className="p-3 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
          <img src="/logo.png" alt="Smart Parking Logo" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SMART PARKING
          </h1>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* Main Section */}
        <div className="space-y-1">
          <Link to="/" className={linkClass('/')}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Parking Management Group */}
        <div className="space-y-1">
          <button 
            onClick={() => setParkingOpen(!parkingOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>Parking Management</span>
            {parkingOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {parkingOpen && (
            <div className="pl-3 mt-1 space-y-1 border-l border-white/5 ml-4">
              <Link to="/slots" className={linkClass('/slots')}>
                <Maximize2 size={16} />
                <span>Parking Slots</span>
              </Link>
              <Link to="/entry" className={linkClass('/entry')}>
                <LogIn size={16} />
                <span>Vehicle Entry</span>
              </Link>
              <Link to="/exit" className={linkClass('/exit')}>
                <LogOut size={16} />
                <span>Vehicle Exit</span>
              </Link>
            </div>
          )}
        </div>

        {/* Payments Section */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transactions</p>
          <Link to="/payments" className={linkClass('/payments')}>
            <CreditCard size={18} />
            <span>Payments</span>
          </Link>
        </div>

        {/* Reports Group */}
        <div className="space-y-1">
          <button 
            onClick={() => setReportsOpen(!reportsOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>Reports</span>
            {reportsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          
          {reportsOpen && (
            <div className="pl-3 mt-1 space-y-1 border-l border-white/5 ml-4">
              <Link to="/reports/daily" className={linkClass('/reports/daily')}>
                <FileText size={16} />
                <span>Daily Reports</span>
              </Link>
              <Link to="/reports/monthly" className={linkClass('/reports/monthly')}>
                <FileText size={16} />
                <span>Monthly Reports</span>
              </Link>
            </div>
          )}
        </div>

         {/* IoT Sandbox Section */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">IoT Sandbox</p>
          <Link to="/iot" className={linkClass('/iot')}>
            <Cpu size={18} />
            <span>Virtual IoT Node</span>
          </Link>
        </div>

        {/* Analytics Section */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Insights</p>
          <Link to="/analytics" className={linkClass('/analytics')}>
            <BarChart3 size={18} />
            <span>Analytics</span>
          </Link>
        </div>

       

        {/* System Settings & User */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</p>
          <Link to="/settings" className={linkClass('/settings')}>
            <Settings size={18} />
            <span>Settings</span>
          </Link>
          <Link to="/profile" className={linkClass('/profile')}>
            <User size={18} />
            <span>Profile</span>
          </Link>
        </div>
      </div>

      {/* Logged in User Indicator & Logout */}
      <div className="p-6 border-t border-white/5 bg-slate-950/40">
      
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl border border-rose-500/20 hover:border-rose-600 transition-all duration-200"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
