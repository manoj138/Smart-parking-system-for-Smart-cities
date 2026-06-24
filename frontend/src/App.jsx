import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SlotMonitor from './pages/SlotMonitor';
import EntryGate from './pages/EntryGate';
import ExitGate from './pages/ExitGate';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import DriverBook from './pages/DriverBook';
import BookingTicket from './pages/BookingTicket';
import VirtualIoT from './pages/VirtualIoT';

// Import Components
import Sidebar from './components/Sidebar';

// Loading Screen
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Verifying Admin Session...</p>
  </div>
);

// Protected Layout Route wrapper
const AppLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // If not logged in, force Login screen
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-hidden">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto pl-64 transition-all duration-300">
        
        {/* Top Header Indicator bar */}
        <header className="sticky top-0 bg-slate-950/60 backdrop-blur-md border-b border-white/5 px-8 py-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse glow-emerald" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Smart IoT Networks: <span className="text-emerald-400">ACTIVE</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span>Admin Control Panel</span>
            <span className="text-slate-600">|</span>
            <span>Server: 127.0.0.1</span>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/slots" element={<SlotMonitor />} />
            <Route path="/entry" element={<EntryGate />} />
            <Route path="/exit" element={<ExitGate />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reports/daily" element={<Reports />} />
            <Route path="/reports/monthly" element={<Reports />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/iot" element={<VirtualIoT />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/book" element={<DriverBook />} />
          <Route path="/ticket/:slotNumber" element={<BookingTicket />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
