import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Printer, ArrowLeft, CheckCircle, QrCode, 
  MapPin, Calendar, Clock, User, Phone, Tag, Zap, Star 
} from 'lucide-react';

const BookingTicket = () => {
  const { slotNumber } = useParams();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch slots to find reservation details
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await fetch('/api/slots');
        const data = await response.json();
        setSlots(data || []);
      } catch (error) {
        console.error('Error fetching slot details for ticket:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [slotNumber]);

  const activeSlot = slots.find(s => s.slot_number === slotNumber);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Generating Your Ticket...</p>
      </div>
    );
  }

  if (!activeSlot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 text-center space-y-4 max-w-sm">
          <p className="text-sm font-bold text-rose-400 uppercase tracking-wider">No Active Reservation Found</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            We couldn't locate any active reservation or parked vehicle on slot <span className="text-white font-mono">{slotNumber}</span>.
          </p>
          <Link 
            to="/book" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/5 text-xs font-bold transition-all duration-200"
          >
            <ArrowLeft size={14} />
            <span>Back to Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  // Generate QR Code data format
  const getTicketQrUrl = () => {
    const qrData = JSON.stringify({
      ticket_id: activeSlot.vehicle_id || 9999,
      slot: activeSlot.slot_number,
      plate: activeSlot.vehicle_number,
      owner: activeSlot.owner_name,
      time: activeSlot.entry_time
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  };

  const isEv = activeSlot && activeSlot.slot_type === 'ev';
  const isVip = activeSlot && activeSlot.slot_type === 'vip';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Dynamic Background Glows (Hidden in Print) */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none print:hidden" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none print:hidden" />

      {/* Action Bar (Hidden in Print) */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 print:hidden">
        <Link 
          to="/book" 
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          <span>New Reservation</span>
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200"
        >
          <Printer size={14} />
          <span>Print Ticket</span>
        </button>
      </div>

      {/* The Printable Ticket Card */}
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 print:border-slate-800 print:bg-white print:text-slate-950 print:shadow-none print:rounded-none print:p-4">
        
        {/* Ticket Header */}
        <div className="text-center space-y-2 border-b border-dashed border-slate-800 print:border-slate-300 pb-5">
          <div className="flex justify-center items-center gap-2 text-indigo-400 print:text-indigo-600">
            <CheckCircle size={24} className="animate-bounce" />
            <h2 className="text-lg font-black uppercase tracking-wider">Reservation Confirmed</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest print:text-slate-400">
            Smart City Parking Voucher
          </p>
        </div>

        {/* Big Slot Badge */}
        <div className="bg-slate-950/60 border border-white/5 py-4 px-6 rounded-2xl flex items-center justify-between print:bg-slate-100 print:border-slate-300">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block print:text-slate-500">Reserved Space</span>
            <span className="text-3xl font-black tracking-wide text-white font-mono print:text-slate-950">{slotNumber}</span>
          </div>
          {isEv ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 print:bg-blue-100 print:text-blue-700">
              <Zap size={14} className="animate-pulse" />
              <span>EV Dock</span>
            </div>
          ) : isVip ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 print:bg-amber-100 print:text-amber-700">
              <Star size={14} className="animate-pulse" />
              <span>VIP Space</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 print:bg-slate-200 print:text-slate-700">
              <MapPin size={14} />
              <span>Regular Slot</span>
            </div>
          )}
        </div>

        {/* Booking Parameters Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 bg-slate-950/20 p-3 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
              <Tag size={10} />
              <span>Vehicle No</span>
            </div>
            <p className="font-extrabold text-white font-mono tracking-wider print:text-slate-950">
              {activeSlot.vehicle_number}
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/20 p-3 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
              <Car size={10} />
              <span>Category</span>
            </div>
            <p className="font-bold text-white print:text-slate-950">
              {activeSlot.vehicle_type}
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/20 p-3 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200 col-span-2">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
              <User size={10} />
              <span>Driver Name</span>
            </div>
            <p className="font-bold text-white print:text-slate-950">
              {activeSlot.owner_name || 'Visitor Guest'}
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/20 p-3 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
              <Phone size={10} />
              <span>Contact</span>
            </div>
            <p className="font-bold text-white print:text-slate-950">
              {activeSlot.phone}
            </p>
          </div>

          <div className="space-y-1 bg-slate-950/20 p-3 rounded-xl border border-white/5 print:bg-slate-50 print:border-slate-200">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase font-bold">
              <Calendar size={10} />
              <span>Reserved At</span>
            </div>
            <p className="font-bold text-white print:text-slate-950 text-[10px]">
              {activeSlot.entry_time}
            </p>
          </div>
        </div>

        {/* Barcode Receipt Divider lines */}
        <div className="flex flex-col items-center justify-center py-4 border-t border-b border-dashed border-slate-800 print:border-slate-300">
          
          {/* QR Code */}
          <div className="bg-white p-3 rounded-xl shadow-inner inline-block my-2 border border-slate-200">
            <img 
              src={getTicketQrUrl()} 
              alt="Booking QR Code Pass" 
              className="w-36 h-36"
            />
          </div>
          
          <div className="text-center mt-2 space-y-1">
            <p className="text-[8px] font-mono tracking-widest text-slate-500 print:text-slate-400">
              TICKET-ID: SP-{activeSlot.vehicle_id || '9999'}
            </p>
            <p className="text-[9px] text-slate-400 print:text-slate-500 max-w-[280px]">
              Scan QR pass at the entrance terminal scanner to open the barrier.
            </p>
          </div>
        </div>

        {/* Footer Policy */}
        <div className="text-center text-[8px] text-slate-500 print:text-slate-400 leading-normal space-y-1">
          <p>This voucher guarantees reservation for the assigned space.</p>
          <p>IoT loop sensors will automatically check you in on vehicle arrival.</p>
        </div>

      </div>

      {/* Global CSS Inject for Print Overrides (Hidden in markup) */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: #020617 !important;
            font-size: 12px;
          }
          .min-h-screen {
            background: none !important;
            min-height: auto !important;
            padding: 0 !important;
          }
          /* Hide everything except the ticket container */
          header, sidebar, nav, button, a, .print\\:hidden {
            display: none !important;
          }
          /* Center the ticket */
          .w-full.max-w-md {
            margin: 0 auto !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

    </div>
  );
};

export default BookingTicket;
