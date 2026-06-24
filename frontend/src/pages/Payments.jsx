import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Calendar, RefreshCw, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payments');
      const data = await res.json();
      setPayments(data);
    } catch (e) {
      console.error('Failed to load transaction history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filter & Search Logic
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      payment.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.owner_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesMethod = 
      filterMethod === 'All' || 
      payment.payment_method === filterMethod;
      
    return matchesSearch && matchesMethod;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Payment Ledger</h2>
          <p className="text-sm text-slate-400 mt-1">Audit log of all parking fees and payment checkouts.</p>
        </div>
        <button 
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/10 hover:border-white/20 transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Payment Method Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Calendar size={16} className="text-slate-500 mr-2 shrink-0" />
          {['All', 'UPI', 'Google Pay', 'PhonePe', 'Paytm', 'Credit Card', 'Cash'].map((method) => (
            <button
              key={method}
              onClick={() => { setFilterMethod(method); setCurrentPage(1); }}
              className={`
                px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0
                ${filterMethod === method 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'}
              `}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search plate or owner..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-white/5 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Txn ID</th>
                <th className="p-4">Plate No</th>
                <th className="p-4">Owner Name</th>
                <th className="p-4">Veh Category</th>
                <th className="p-4">Method</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-2" />
                    <span>Syncing ledger data...</span>
                  </td>
                </tr>
              ) : paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-slate-500">
                    No transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-slate-400">#TXN{1000 + payment.id}</td>
                    <td className="p-4 font-bold text-white tracking-wider">{payment.vehicle_number}</td>
                    <td className="p-4 truncate max-w-[120px]">{payment.owner_name || 'Driver'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-white/5 font-semibold text-[10px] text-slate-400">
                        {payment.vehicle_type}
                      </span>
                    </td>
                    <td className="p-4">{payment.payment_method}</td>
                    <td className="p-4 text-slate-400">{payment.created_at}</td>
                    <td className="p-4 text-right font-bold text-white text-glow-indigo">₹{payment.amount}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[9px] tracking-wide border border-emerald-500/10">
                        {payment.payment_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between bg-slate-900/20 text-xs">
            <span className="text-slate-500 font-semibold">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} logs
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-slate-300 px-2">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;
