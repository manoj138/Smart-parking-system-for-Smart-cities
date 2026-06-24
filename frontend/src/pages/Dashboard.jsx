import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Car, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  RotateCw,
  Bell
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
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
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  LineChart, 
  Line 
} from 'recharts';

const COLORS = ['#6366F1', '#10B981', '#F43F5E', '#F59E0B'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [statsRes, analyticsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/analytics')
      ]);
      const statsData = await statsRes.json();
      const analyticsData = await analyticsRes.json();
      
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll stats & charts every 20 seconds for real-time sensor updates
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold tracking-wider uppercase">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative">

      {/* Floating Particles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {[
          { top: '8%',  left: '5%',  size: 4, dur: '7s',  delay: '0s'   },
          { top: '20%', left: '88%', size: 3, dur: '9s',  delay: '1s'   },
          { top: '55%', left: '12%', size: 5, dur: '11s', delay: '2s'   },
          { top: '70%', left: '75%', size: 3, dur: '8s',  delay: '0.5s' },
          { top: '35%', left: '50%', size: 4, dur: '13s', delay: '3s'   },
          { top: '85%', left: '35%', size: 2, dur: '6s',  delay: '1.5s' },
          { top: '15%', left: '65%', size: 3, dur: '10s', delay: '2.5s' },
          { top: '90%', left: '90%', size: 5, dur: '12s', delay: '0.8s' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-indigo-500/20 animate-particle"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              '--duration': p.dur,
              animationDelay: p.delay,
              filter: 'blur(1px)'
            }}
          />
        ))}
      </div>

      {/* Title Header */}
      <div className="flex justify-between items-center relative z-10 animate-slide-up">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-sans animate-gradient-text">
            Smart Cities Parking Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-live-dot"
            />
            Real-time telemetry and occupancy analytics dashboard.
          </p>
        </div>
        <button 
          onClick={fetchData}
          disabled={isRefreshing}
          className="btn-shimmer flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
        >
          <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Grid Cards Stats Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <MetricCard title="Total slots" value={stats?.total_slots} icon={Compass}
          subtext="Configured Capacity" color="indigo" index={0} />
        <MetricCard title="Occupied Slots" value={stats?.occupied_slots} icon={XCircle}
          subtext={`Occupancy: ${stats?.occupancy_percentage}%`} color="rose" index={1} />
        <MetricCard title="Available Slots" value={stats?.available_slots} icon={CheckCircle}
          subtext="Ready for incoming traffic" color="emerald" index={2} />
        <MetricCard title="Revenue Generated" value={`₹${stats?.today_revenue}`} icon={DollarSign}
          subtext={stats?.rate_label ? `Rate Mode: ${stats.rate_label} (${stats.rate_multiplier}x)` : "Total processed today"}
          color="amber" index={3} />
      </div>

      {/* Grid Cards Stats Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <MetricCard title="Vehicles Entered Today" value={stats?.today_entries} icon={Car}
          subtext="Check-ins recorded" color="indigo" index={4} />
        <MetricCard title="Vehicles Exited Today" value={stats?.today_exits} icon={Car}
          subtext="Check-outs complete" color="emerald" index={5} />
        <MetricCard title="Occupancy Percentage" value={`${stats?.occupancy_percentage}%`} icon={TrendingUp}
          subtext="Real-time capacity usage"
          color={stats?.occupancy_percentage > 85 ? 'rose' : stats?.occupancy_percentage > 60 ? 'amber' : 'emerald'}
          index={6} />
        <MetricCard title="Avg Parking Duration" value={`${stats?.avg_duration_hours} Hrs`} icon={Clock}
          subtext="Average vehicle stay length" color="indigo" index={7} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up relative z-10" style={{ animationDelay: '0.35s', animationFillMode: 'both' }}>
        
        {/* Weekly Revenue Trend Bar Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 lg:col-span-2">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Weekly Revenue Trend</h4>
            <p className="text-xs text-slate-500 mt-0.5">Billing collections for the past 7 days</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.weekly_revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]}>
                  {analytics?.weekly_revenue?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#10B981' : '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Type Split Pie Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/5">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Vehicle Type Split</h4>
            <p className="text-xs text-slate-500 mt-0.5">Active classification count</p>
          </div>
          <div className="h-64 flex flex-col justify-between">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.vehicle_types}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="vehicle_type"
                  >
                    {analytics?.vehicle_types?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend Labels */}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-400">
              {analytics?.vehicle_types?.map((item, idx) => (
                <div key={item.vehicle_type} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{item.vehicle_type}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Occupancy Rate Trend Area Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 lg:col-span-2">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Occupancy Rate Trend</h4>
            <p className="text-xs text-slate-500 mt-0.5">Weekly occupancy tracking percentage average</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.occupancy_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Notification Center */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col h-[360px] animate-slide-in-right" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 shrink-0">
            <Bell size={18} className="text-indigo-400 animate-bounce" />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Live Sensor Notifications</h4>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {stats?.recent_events && stats.recent_events.length > 0 ? (
              stats.recent_events.map((event, index) => {
                const isEntry = event.type === 'entry';
                return (
                  <div 
                    key={index}
                    className={`
                      p-3 rounded-xl border text-xs leading-relaxed flex flex-col gap-1
                      animate-slide-in-left
                      ${isEntry 
                        ? 'bg-indigo-500/10 border-indigo-500/10 text-indigo-200' 
                        : 'bg-emerald-500/10 border-emerald-500/10 text-emerald-200'}
                    `}
                    style={{ animationDelay: `${index * 0.07}s`, animationFillMode: 'both' }}
                  >
                    <div className="flex justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isEntry ? 'bg-indigo-400' : 'bg-emerald-400'} animate-live-dot`} />
                        {isEntry ? 'Gate check-in' : 'Gate check-out'}
                      </span>
                      <span className="text-slate-500 font-medium">{event.time.split(' ')[1]}</span>
                    </div>
                    <p className="font-semibold">{event.message}</p>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <AlertTriangle size={24} className="mb-2 text-slate-600" />
                <span>No gate notifications received. Start the simulator inside Settings!</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
