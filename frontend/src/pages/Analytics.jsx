import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, Layers, Zap, Clock, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  Legend 
} from 'recharts';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      const analyticsData = await res.json();
      setData(analyticsData);
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Compiling urban telemetry analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Smart City Analytics</h2>
          <p className="text-sm text-slate-400 mt-1">Deep analytics on parking demand, peak loads, and revenue efficiency.</p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
        >
          <RefreshCw size={14} />
          <span>Reload Metrics</span>
        </button>
      </div>

      {/* Advanced Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hourly Check-In Velocity (Line Chart) */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-indigo-400" size={16} />
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Hourly Load Velocity</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Vehicles check-ins grouped by hour (Today)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.hourly_entries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Line type="monotone" dataKey="entries" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1', strokeWidth: 1 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Revenue Collection (Area Chart) */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-emerald-400" size={16} />
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Revenue Accumulation</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Collections by day of the week</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.weekly_revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Index Trend (Bar Chart) */}
        <div className="glass-card p-6 rounded-3xl border border-white/5 shadow-xl lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="text-amber-400" size={16} />
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Occupancy Index Load Percentage</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Average load factors recorded over the past week</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.occupancy_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="rate" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
