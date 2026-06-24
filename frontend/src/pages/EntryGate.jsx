import React, { useState } from 'react';
import { LogIn, CheckCircle, Cpu, User, Phone, Tag, Volume2, Sparkles, ArrowRight } from 'lucide-react';
import GateSimulator from '../components/GateSimulator';
import ParkingGuidanceModal, { getSlotInfo } from '../components/ParkingGuidanceModal';
import { speakText } from '../utils/speech';

/* ─── Confetti Burst ─── */
const ConfettiBurst = ({ active }) => {
  if (!active) return null;
  const colors = ['#6366F1', '#10B981', '#F59E0B', '#F43F5E', '#38BDF8', '#A78BFA', '#34D399'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-20">
      {Array.from({ length: 18 }).map((_, i) => {
        const angle = (i / 18) * 360;
        const dist = 40 + Math.random() * 50;
        const size = 4 + Math.random() * 5;
        const x = Math.cos((angle * Math.PI) / 180) * dist;
        const y = Math.sin((angle * Math.PI) / 180) * dist - 30;
        return (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-sm"
            style={{
              width: size, height: size,
              backgroundColor: colors[i % colors.length],
              animationDelay: `${(Math.random() * 0.3).toFixed(2)}s`,
              transform: 'translate(-50%, -50%)',
              '--tx': `${x}px`, '--ty': `${y}px`,
              animation: 'confetti-fall 0.9s ease-out forwards',
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translate(-50%,-50%) translate(0,0) rotate(0deg); opacity:1; }
          100% { transform: translate(-50%,-50%) translate(var(--tx),var(--ty)) rotate(540deg); opacity:0; }
        }
      `}</style>
    </div>
  );
};

/* ─── EntryGate Page ─── */
const EntryGate = () => {
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType]   = useState('Car');
  const [ownerName, setOwnerName]       = useState('');
  const [phone, setPhone]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [speakAnim, setSpeakAnim]       = useState(false);
  const [showModal, setShowModal]       = useState(false);
  const [ticketData, setTicketData]     = useState(null);

  // Gate simulation
  const [gateStatus, setGateStatus]           = useState('CLOSED');
  const [sensorTriggered, setSensorTriggered] = useState(false);
  const [anprScanning, setAnprScanning]       = useState(false);

  /* ── Handle check-in submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber) return;

    setAnprScanning(true);
    setLoading(true);
    setResult(null);

    // Save before reset
    const savedNum  = vehicleNumber;
    const savedName = ownerName;
    const savedType = vehicleType;
    const savedPhone = phone;

    try {
      const res  = await fetch('/api/entry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: vehicleNumber,
          vehicle_type:   vehicleType,
          owner_name:     ownerName,
          phone:          phone,
        }),
      });
      const data = await res.json();
      setAnprScanning(false);

      if (data.success) {
        setResult(data);

        // Build ticket data for modal
        const now = new Date();
        setTicketData({
          slotStr:     data.assigned_slot,
          vehicleNum:  savedNum,
          vehicleType: savedType,
          ownerName:   savedName,
          phone:       savedPhone,
          entryTime:   now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
          slotType:    data.slot_type,
          floor:       data.floor,
        });

        // Confetti
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1200);

        // Voice
        setSpeakAnim(true);
        speakText(`Welcome to Smart Parking. Slot ${data.assigned_slot} allocated on ${data.floor}. Please park safely.`);
        setTimeout(() => setSpeakAnim(false), 3500);

        // Show guidance modal
        setTimeout(() => setShowModal(true), 600);

        // Open gate
        setSensorTriggered(true);
        setGateStatus('OPEN');

        // Reset form
        setVehicleNumber('');
        setOwnerName('');
        setPhone('');

        // Close gate
        setTimeout(() => { setGateStatus('CLOSED'); setSensorTriggered(false); }, 5000);
      } else {
        speakText(`Check in failed. ${data.message || ''}`);
        alert(data.message || 'Entry check-in failed.');
      }
    } catch (err) {
      setAnprScanning(false);
      console.error('Checkin error:', err);
      alert('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Auto-fill sensor simulation ── */
  const handleAutoSensor = () => {
    const prefixes = ['MH09', 'MH12', 'MH02', 'DL03', 'KA51'];
    const names    = ['Karan Shinde', 'Sunita Patil', 'Rakesh Nair', 'Geeta Gupta', 'Tushar Deshmukh'];
    const types    = ['Car', 'SUV', 'Bike', 'EV'];
    const rand     = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    const chr      = (n) => String.fromCharCode(n);
    setVehicleNumber(`${prefixes[rand(0,4)]}${chr(65+rand(0,25))}${chr(65+rand(0,25))}${rand(1000,9999)}`);
    setOwnerName(names[rand(0,4)]);
    setVehicleType(types[rand(0,3)]);
    setPhone(`9${rand(100000000, 999999999)}`);
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Parking Guidance Modal (reusable component) ── */}
      {showModal && ticketData && (
        <ParkingGuidanceModal
          ticketData={ticketData}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* ── Title ── */}
      <div className="animate-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          Smart Check-In Portal
          {speakAnim && (
            <span className="flex items-center gap-1 text-indigo-400 animate-slide-in-right">
              <Volume2 size={18} className="animate-bounce" />
              <span className="text-xs font-normal normal-case text-slate-400">Broadcasting...</span>
            </span>
          )}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Vehicle check-in terminal with nearest-slot automatic allocation.
        </p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Registration Form */}
        <div
          className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden animate-slide-in-left"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <ConfettiBurst active={showConfetti} />
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-6">
            <LogIn className="text-indigo-400" size={18} />
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Vehicle Check-In Register</h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* License plate */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Vehicle Registration No
                {anprScanning && (
                  <span className="flex items-center gap-1 text-cyan-400 text-[9px] font-bold animate-pulse">
                    <Cpu size={9} /> ANPR SCANNING...
                  </span>
                )}
              </label>
              <div className={`relative ${anprScanning ? 'animate-scan' : ''}`}>
                <Tag className="absolute left-3 top-3 text-slate-500 z-10" size={16} />
                <input
                  type="text"
                  placeholder="e.g. MH09AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-semibold tracking-wider transition-all duration-300
                    ${anprScanning ? 'border-cyan-500/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]' : ''}`}
                  required
                />
              </div>
            </div>

            {/* Vehicle type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Category</label>
              <div className="grid grid-cols-4 gap-2">
                {['Car', 'SUV', 'Bike', 'EV'].map((type) => (
                  <button
                    key={type} type="button"
                    onClick={() => setVehicleType(type)}
                    className={`py-2.5 rounded-xl text-xs font-bold transition-all duration-200 btn-shimmer
                      ${vehicleType === type
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-white/5 hover:scale-105'}`}
                  >
                    {type === 'EV' ? '⚡ EV' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Owner name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Owner Name (Optional)</label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-slate-500" size={16} />
                <input type="text" placeholder="Enter Owner Name" value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Number (Optional)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-slate-500" size={16} />
                <input type="tel" placeholder="e.g. 9876543210" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs" />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex gap-4">
              <button type="button" onClick={handleAutoSensor}
                className="btn-shimmer flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                  bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider
                  border border-white/5 hover:border-white/10 active:scale-[0.98] transition-all duration-200"
              >
                <Cpu size={14} className="text-amber-400" />
                <span>Simulate Sensor</span>
              </button>

              <button type="submit" disabled={loading || !vehicleNumber}
                className="btn-shimmer flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white
                  font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20
                  active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading
                  ? <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <><Sparkles size={13} /><span>Authorize Entrance</span></>
                }
              </button>
            </div>
          </form>
        </div>

        {/* Gate Simulator + Result Card */}
        <div className="space-y-6 animate-slide-in-right" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <GateSimulator
            gateName="Primary Entry Gate"
            gateStatus={gateStatus}
            sensorTriggered={sensorTriggered}
            vehicleType={vehicleType}
          />

          {/* Compact result card (shown after modal is closed) */}
          {result && !showModal && (
            <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-xl animate-receipt-drop space-y-3 relative overflow-hidden">
              <ConfettiBurst active={showConfetti} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle size={18} className="glow-emerald animate-checkmark-pop" />
                  <h4 className="font-bold text-xs uppercase tracking-wider">Check-In Successful</h4>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-shimmer flex items-center gap-1 px-3 py-1.5 rounded-xl
                    bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/20
                    text-indigo-400 text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <ArrowRight size={11} /> View Ticket
                </button>
              </div>
              <div className="flex items-center gap-3 bg-slate-950/40 p-3 rounded-xl border border-white/5">
                <div className="text-center flex-1">
                  <p className="text-[8px] text-slate-500 uppercase font-bold">Slot</p>
                  <p className="text-xl font-black text-emerald-400 text-glow-success animate-number-glow">
                    {result.assigned_slot}
                  </p>
                </div>
                <div className="w-px h-8 bg-white/5" />
                <div className="flex-1">
                  <p className="text-[8px] text-slate-500 uppercase font-bold">Floor</p>
                  <p className="text-xs font-bold text-white mt-0.5">{getSlotInfo(result.assigned_slot).floor}</p>
                  <p className="text-[9px] text-slate-400">{getSlotInfo(result.assigned_slot).section}</p>
                </div>
              </div>
              <p className="text-[9px] text-slate-500 italic text-center">
                Gate auto-closes in {gateStatus === 'OPEN' ? 'a few' : '0'} seconds...
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EntryGate;
