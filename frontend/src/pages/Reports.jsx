import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Download, 
  RefreshCw, 
  Car, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Clock,
  Layers
} from 'lucide-react';
import MetricCard from '../components/MetricCard';

const Reports = () => {
  const location = useLocation();
  const isDaily = location.pathname.includes('/reports/daily');
  
  // Format dates for pickers
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStr = todayStr.substring(0, 7);

  const [dateValue, setDateValue] = useState(isDaily ? todayStr : thisMonthStr);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync date selector when route changes
  useEffect(() => {
    setDateValue(isDaily ? todayStr : thisMonthStr);
  }, [location.pathname]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const repType = isDaily ? 'daily' : 'monthly';
      const res = await fetch(`/api/reports?type=${repType}&date=${dateValue}`);
      const data = await res.json();
      setReportData(data);
    } catch (e) {
      console.error('Failed to load report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [isDaily, dateValue]);

  // Client-Side CSV Exporter
  const handleExportCSV = () => {
    if (!reportData || !reportData.logs || reportData.logs.length === 0) return;
    
    // Headers
    const headers = ['ID', 'Vehicle Number', 'Category', 'Owner', 'Check-In Time', 'Check-Out Time', 'Slot Number', 'Fee (₹)', 'Method'];
    
    // Rows
    const rows = reportData.logs.map(log => [
      log.id,
      log.vehicle_number,
      log.vehicle_type,
      log.owner_name || 'Driver',
      log.entry_time,
      log.exit_time || 'Parked',
      log.slot_number,
      log.amount || '0',
      log.payment_method || 'N/A'
    ]);

    // Build content
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SmartParking_${isDaily ? 'Daily' : 'Monthly'}_Report_${dateValue}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
            {isDaily ? 'Daily Operations Report' : 'Monthly Management Report'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isDaily ? 'Audit dashboard for daily traffic and fees.' : 'Summary reports for month-wise trends and capacity.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Picker */}
          <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-xl border border-white/5">
            <Calendar size={14} className="text-slate-500" />
            <input 
              type={isDaily ? 'date' : 'month'} 
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="bg-transparent text-xs text-white border-none outline-none font-bold uppercase tracking-wider cursor-pointer"
            />
          </div>

          <button 
            onClick={handleExportCSV}
            disabled={loading || !reportData?.logs?.length}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl border border-indigo-500/20 disabled:opacity-30 disabled:pointer-events-none transition-all duration-200"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard 
          title="Total entries" 
          value={reportData?.entries || 0} 
          icon={ArrowUpRight} 
          subtext="Gate check-ins" 
          color="indigo" 
        />
        <MetricCard 
          title="Total exits" 
          value={reportData?.exits || 0} 
          icon={ArrowDownRight} 
          subtext="Gate releases" 
          color="emerald" 
        />
        <MetricCard 
          title="Gross Revenue" 
          value={`₹${reportData?.revenue || 0}`} 
          icon={DollarSign} 
          subtext="Processed payments" 
          color="amber" 
        />
        <MetricCard 
          title="Peak Hour" 
          value={reportData?.peak_hour || 'N/A'} 
          icon={Clock} 
          subtext="Busy hour indicator" 
          color="indigo" 
        />
        <MetricCard 
          title="Most Used Floor" 
          value={reportData?.most_used_floor?.split(' ')[0] || 'N/A'} 
          icon={Layers} 
          subtext="Highest occupancy floor" 
          color="emerald" 
        />
      </div>

      {/* Logs Table Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-indigo-400" />
            <span>Operations Audit Logs</span>
          </h4>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900 border border-white/5 px-2.5 py-1 rounded-lg">
            {reportData?.logs?.length || 0} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">ID</th>
                <th className="p-4">Plate No</th>
                <th className="p-4">Owner Name</th>
                <th className="p-4">Veh Category</th>
                <th className="p-4">Slot</th>
                <th className="p-4">Check-In</th>
                <th className="p-4">Check-Out</th>
                <th className="p-4 text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                    <span>Compiling statistics report...</span>
                  </td>
                </tr>
              ) : !reportData?.logs || reportData.logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500">
                    No access log entries recorded for this date query.
                  </td>
                </tr>
              ) : (
                reportData.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 text-slate-500 font-mono">#{log.id}</td>
                    <td className="p-4 font-bold text-white tracking-wider">{log.vehicle_number}</td>
                    <td className="p-4 truncate max-w-[120px]">{log.owner_name || 'Driver'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 font-semibold text-[10px] text-slate-400">
                        {log.vehicle_type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-200">{log.slot_number}</td>
                    <td className="p-4 text-slate-400">{log.entry_time}</td>
                    <td className="p-4 text-slate-400">{log.exit_time || <span className="text-emerald-400 font-bold uppercase text-[9px] px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/15">Parked</span>}</td>
                    <td className="p-4 text-right font-bold text-white text-glow-indigo">
                      {log.amount ? `₹${log.amount}` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
