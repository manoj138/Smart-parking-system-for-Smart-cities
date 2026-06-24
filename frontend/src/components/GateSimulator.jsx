import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CircleDot, Car, Bike } from 'lucide-react';

const GateSimulator = ({ 
  gateName = 'Entry Gate', 
  gateStatus = 'CLOSED', 
  sensorTriggered = false,
  vehicleType = 'Car'
}) => {
  const isOpen = gateStatus === 'OPEN';
  const [showExhaust, setShowExhaust] = useState(false);
  const [prevOpen, setPrevOpen] = useState(isOpen);

  // Show exhaust puff when gate transitions from CLOSED→OPEN (vehicle departs)
  useEffect(() => {
    if (!prevOpen && isOpen) {
      setShowExhaust(false);
      // Small delay so it fires after car starts moving
      const t = setTimeout(() => {
        setShowExhaust(true);
        setTimeout(() => setShowExhaust(false), 1000);
      }, 600);
      return () => clearTimeout(t);
    }
    setPrevOpen(isOpen);
  }, [isOpen]);

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[270px]">
      {/* Background Glow */}
      <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-2xl opacity-20 transition-colors duration-700 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      {/* Animated background grid lines */}
      <div className="absolute inset-0 opacity-[0.03] animate-bg-grid pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 relative z-10">
        <h4 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
          {/* Live indicator */}
          <span className={`relative flex h-2.5 w-2.5`}>
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 ${isOpen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          </span>
          {gateName}
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all duration-500 ${isOpen ? 'bg-emerald-500/25 text-emerald-400' : 'bg-rose-500/25 text-rose-400'}`}>
          {gateStatus}
        </span>
      </div>

      {/* Visual Barrier Graphic Container */}
      <div className="my-4 flex items-end gap-4 relative pl-4 h-32 overflow-hidden bg-slate-950/30 rounded-xl border border-white/5">

        {/* Scrolling road dashes at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none">
          {/* Road surface */}
          <div className="absolute inset-0 bg-slate-800/60" />
          {/* Dashed center line */}
          <div className="absolute bottom-2.5 left-0 flex gap-0" style={{ width: '200%' }}>
            <div
              className="flex gap-3"
              style={{
                animation: isOpen ? 'road-scroll 0.5s linear infinite' : 'none',
                width: '200%'
              }}
            >
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-8 h-1 bg-amber-400/60 rounded-full shrink-0" />
              ))}
            </div>
          </div>
          {/* Road edge lines */}
          <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />
        </div>

        {/* Traffic Light Pole */}
        <div className="absolute right-4 top-2 flex flex-col items-center z-20">
          <div className="w-3 h-16 bg-slate-700/80 rounded-full border border-slate-600/50" />
          <div className="w-5 h-10 bg-slate-800 rounded-md border border-slate-600/50 -mt-2 flex flex-col items-center justify-center gap-1 p-1">
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${!isOpen ? 'bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.7)]' : 'bg-red-900/30'}`} />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-900/30" />
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${isOpen ? 'bg-green-400 shadow-[0_0_8px_2px_rgba(74,222,128,0.7)]' : 'bg-green-900/30'}`} />
          </div>
        </div>

        {/* Gate Assembly Group (Pillar & Bar) */}
        <div className="relative flex items-center h-20 w-6 shrink-0 z-10 mt-4">
          {/* Gate Post (Fixed Pillar) */}
          <div className="w-6 h-20 bg-gradient-to-b from-slate-600 to-slate-700 rounded-md border border-slate-600 flex flex-col items-center justify-start pt-2 shadow-md relative z-10">
            <div className={`w-3 h-3 rounded-full border-2 transition-all duration-500 ${isOpen ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
            {/* Pillar stripes */}
            <div className="w-full h-px bg-yellow-400/30 mt-2" />
            <div className="w-full h-px bg-yellow-400/30 mt-1.5" />
          </div>

          {/* Gate Boom Barrier (The Bar) */}
          <div className="absolute left-3 top-8 w-44 h-5 pointer-events-none z-0">
            <div 
              className={`h-3 rounded-r-full shadow-lg gate-bar relative overflow-hidden
                ${isOpen ? 'gate-open' : 'gate-closed'}`}
              style={{ width: '140px' }}
            >
              {/* Striped pattern on boom barrier */}
              <div className="absolute inset-0 rounded-r-full"
                style={{
                  background: 'repeating-linear-gradient(90deg, #F59E0B 0px, #F59E0B 12px, #1E293B 12px, #1E293B 24px)'
                }}
              />
              {/* Barrier glow */}
              <div className={`absolute inset-0 rounded-r-full transition-opacity duration-500 ${isOpen ? 'opacity-0' : 'opacity-100'}`}
                style={{ boxShadow: 'inset 0 0 6px rgba(245,158,11,0.3)' }}
              />
            </div>
            {/* Barrier shadow on ground */}
            <div
              className={`absolute -bottom-1 left-0 h-1 bg-black/30 rounded-full blur-sm transition-all duration-1000`}
              style={{ width: isOpen ? '10px' : '120px', opacity: isOpen ? 0.1 : 0.5 }}
            />
          </div>
        </div>

        {/* Animated Vehicle */}
        {sensorTriggered && (
          <div 
            className={`absolute bottom-6 left-14 flex items-center z-20 
              ${isOpen ? 'vehicle-anim-depart' : 'vehicle-anim-arrive'}`}
          >
            {/* Headlight Beam */}
            <div 
              className={`absolute left-5 w-14 h-7 rounded-full blur-sm transition-opacity duration-300 pointer-events-none
                ${isOpen ? 'opacity-0' : 'opacity-100 animate-pulse'}`}
              style={{ 
                background: 'radial-gradient(ellipse at left, rgba(253,224,71,0.35), transparent 70%)',
                clipPath: 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)',
              }} 
            />
            {/* Tail Light */}
            <div 
              className={`absolute -left-2 top-1 w-2 h-2 bg-red-500 rounded-full blur-[1px]
                ${isOpen ? 'opacity-60 animate-pulse' : 'opacity-20'}`} 
            />
            {/* Vehicle Body */}
            <div className="relative">
              {vehicleType === 'Bike' ? (
                <Bike className={`${isOpen ? 'text-emerald-400' : 'text-amber-400'} drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]`} size={26} />
              ) : (
                <Car className={`${isOpen ? 'text-emerald-400' : 'text-indigo-400'} drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]`} size={26} />
              )}
              {/* Wheel roll */}
              {isOpen && <div className="absolute -bottom-1 left-1 w-1.5 h-1.5 bg-slate-400/50 rounded-full" style={{ animation: 'spin 0.3s linear infinite' }} />}
            </div>

            {/* Exhaust puffs */}
            {showExhaust && (
              <>
                <div className="absolute -left-4 top-1 w-3 h-3 bg-slate-500/40 rounded-full exhaust-puff-1" />
                <div className="absolute -left-6 top-2 w-2 h-2 bg-slate-500/30 rounded-full exhaust-puff-2" />
                <div className="absolute -left-3 top-0 w-4 h-4 bg-slate-400/20 rounded-full exhaust-puff-3" />
              </>
            )}
          </div>
        )}
        
        {/* Loop Sensor */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-7 flex flex-col items-center space-y-1 z-10">
          <span className="text-[7px] text-slate-500 font-bold uppercase tracking-wider">SENSOR</span>
          <div className={`
            relative flex items-center justify-center p-1.5 rounded-full border transition-all duration-300
            ${sensorTriggered 
              ? 'bg-amber-500/20 border-amber-400/50 text-amber-400' 
              : 'bg-slate-900/40 border-white/5 text-slate-500'}
          `}>
            {sensorTriggered && (
              <span className="absolute inset-0 rounded-full border border-amber-400 animate-ping opacity-50" />
            )}
            {sensorTriggered ? <ShieldAlert size={12} /> : <Shield size={12} />}
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="text-[10px] text-slate-500 font-semibold flex items-center justify-between border-t border-white/5 pt-2 relative z-10">
        <span>TYPE: SECURE BOOM BARRIER</span>
        <span className={`font-bold tracking-wider transition-colors duration-300 ${sensorTriggered ? 'text-amber-400' : 'text-slate-400'}`}>
          {sensorTriggered ? `${vehicleType.toUpperCase()} DETECTED` : 'NO VEHICLE'}
        </span>
      </div>

      {/* Local Styles */}
      <style>{`
        @keyframes vehicle-arrive {
          0%   { transform: translateX(-130px) scale(0.9); opacity: 0; }
          60%  { transform: translateX(-18px) scale(1.03); opacity: 1; }
          100% { transform: translateX(-22px) scale(1); opacity: 1; }
        }
        @keyframes vehicle-depart {
          0%   { transform: translateX(-22px) scale(1); opacity: 1; }
          30%  { transform: translateX(10px) scale(1.02); opacity: 1; }
          100% { transform: translateX(200px) scale(0.88); opacity: 0; }
        }
        .vehicle-anim-arrive {
          animation: vehicle-arrive 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .vehicle-anim-depart {
          animation: vehicle-depart 1.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes road-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-60px); }
        }

        @keyframes exhaust-puff {
          0%   { transform: scale(0.4) translateX(0); opacity: 0.7; }
          50%  { transform: scale(1.2) translateX(-8px) translateY(-4px); opacity: 0.3; }
          100% { transform: scale(2) translateX(-16px) translateY(-8px); opacity: 0; }
        }
        .exhaust-puff-1 { animation: exhaust-puff 0.7s ease-out forwards; }
        .exhaust-puff-2 { animation: exhaust-puff 0.9s ease-out 0.1s forwards; }
        .exhaust-puff-3 { animation: exhaust-puff 1.1s ease-out 0.2s forwards; }
      `}</style>
    </div>
  );
};

export default GateSimulator;
