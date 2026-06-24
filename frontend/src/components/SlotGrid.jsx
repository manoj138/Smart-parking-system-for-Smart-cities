import React, { useRef } from 'react';
import { Car, User, Zap, Bike, Star } from 'lucide-react';

const SlotGrid = ({ slots, onSlotClick }) => {
  const prevStatusRef = useRef({});

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {slots.map((slot, index) => {
        const isOccupied = slot.status === 'occupied';
        const isReserved = slot.status === 'reserved';
        
        // Detect status change for flash effect
        const prevStatus = prevStatusRef.current[slot.id];
        const justFreed = prevStatus === 'occupied' && slot.status === 'available';
        prevStatusRef.current[slot.id] = slot.status;

        const isEvSlot = slot.slot_type === 'ev';
        const isVipSlot = slot.slot_type === 'vip';

        // Map correct vehicle icon based on dynamic categories
        const isBike = slot.vehicle_type === 'Bike';
        let IconComponent = isEvSlot ? Zap : (isVipSlot ? Star : (isBike ? Bike : Car));

        // Color and styles based on EV, VIP, Reserved, and Occupancy status
        let cardClass = '';
        let statusDotClass = '';
        let textLabel = '';

        if (isEvSlot) {
          if (isOccupied) {
            cardClass = 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/25 hover:border-violet-500/50 shadow-lg shadow-violet-950/10';
            statusDotClass = 'bg-violet-500 animate-pulse glow-rose';
          } else if (isReserved) {
            cardClass = 'bg-warning-500/10 hover:bg-warning-500/20 border-warning-500/25 hover:border-warning-500/50 shadow-lg shadow-warning-950/10 text-warning-400';
            statusDotClass = 'bg-warning-500 animate-pulse glow-amber';
            textLabel = 'EV RESERVED';
          } else {
            cardClass = 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/25 hover:border-blue-500/50 shadow-lg shadow-blue-950/10';
            statusDotClass = 'bg-blue-500 glow-indigo';
            textLabel = 'EV READY';
          }
        } else if (isVipSlot) {
          if (isOccupied) {
            cardClass = 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/25 hover:border-amber-500/50 shadow-lg shadow-amber-950/10 text-amber-300';
            statusDotClass = 'bg-amber-500 animate-pulse glow-amber';
          } else if (isReserved) {
            cardClass = 'bg-amber-600/10 hover:bg-amber-600/20 border-amber-600/25 hover:border-amber-600/50 shadow-lg shadow-amber-950/10 text-amber-400';
            statusDotClass = 'bg-amber-600 animate-pulse glow-amber';
            textLabel = 'VIP RESERVED';
          } else {
            cardClass = 'bg-amber-500/5 hover:bg-amber-500/15 border-amber-500/20 hover:border-amber-500/40 shadow-lg shadow-amber-950/5 text-amber-200';
            statusDotClass = 'bg-amber-400 glow-amber';
            textLabel = 'VIP READY';
          }
        } else {
          if (isOccupied) {
            cardClass = 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/25 hover:border-rose-500/50 shadow-lg shadow-rose-950/10';
            statusDotClass = 'bg-rose-500 animate-pulse glow-rose';
          } else if (isReserved) {
            cardClass = 'bg-warning-500/10 hover:bg-warning-500/20 border-warning-500/25 hover:border-warning-500/50 shadow-lg shadow-warning-950/10 text-warning-400';
            statusDotClass = 'bg-warning-500 animate-pulse glow-amber';
            textLabel = 'RESERVED';
          } else {
            cardClass = 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/25 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/10';
            statusDotClass = 'bg-emerald-500 glow-emerald';
            textLabel = 'VACANT';
          }
        }

        // Stagger delay: groups of 6 per row, max 400ms
        const staggerDelay = `${Math.min(index * 28, 400)}ms`;
        
        return (
          <div 
            key={slot.id}
            onClick={() => onSlotClick && onSlotClick(slot)}
            className={`
              slot-card-3d relative p-4 rounded-xl cursor-pointer border select-none
              slot-card-enter transition-all duration-300
              ${cardClass}
              ${justFreed ? 'animate-status-flash' : ''}
            `}
            style={{ animationDelay: staggerDelay, animationFillMode: 'both' }}
          >
            {/* Slot Header */}
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md 
                ${isReserved 
                  ? 'bg-warning-500/20 text-warning-400 border border-warning-500/10'
                  : isEvSlot 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/10' 
                    : isVipSlot
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10'
                      : isOccupied 
                        ? 'bg-rose-500/20 text-rose-400' 
                        : 'bg-emerald-500/20 text-emerald-400'
                }
              `}>
                {slot.slot_number} {isEvSlot && '⚡'} {isVipSlot && '★'}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${statusDotClass}`} />
            </div>

            {/* Slot Content */}
            <div className="flex flex-col items-center justify-center py-2 space-y-1 overflow-hidden">
              <IconComponent 
                size={32} 
                className={`
                  ${isOccupied || isReserved ? 'slot-vehicle-parked' : 'animate-vacant-breathe'}
                  ${isEvSlot && isOccupied ? 'ev-charging-pulse' : ''}
                  ${isReserved
                    ? 'text-warning-400/90'
                    : isEvSlot 
                      ? isOccupied 
                        ? 'text-violet-400/90' 
                        : 'text-blue-400/70' 
                      : isVipSlot
                        ? isOccupied
                          ? 'text-amber-400/90'
                          : 'text-amber-500/70'
                        : isOccupied 
                          ? 'text-rose-400/90' 
                          : 'text-slate-700/60'
                  }
                `} 
              />
              {isOccupied ? (
                <div className="text-center w-full">
                  <p className="text-xs font-bold text-slate-200 tracking-wide truncate">{slot.vehicle_number}</p>
                  <p className={`text-[9px] font-medium truncate flex items-center justify-center gap-1 ${isEvSlot ? 'text-violet-400/70' : isVipSlot ? 'text-amber-400/70' : 'text-rose-400/70'}`}>
                    <User size={8} /> {slot.owner_name || 'Driver'}
                  </p>
                </div>
              ) : isReserved ? (
                <div className="text-center w-full">
                  <p className="text-xs font-bold text-warning-400 tracking-wide truncate reserved-shimmer">RESERVED</p>
                  <p className="text-[9px] text-slate-400 font-medium truncate flex items-center justify-center gap-1">
                    <User size={8} /> {slot.owner_name || 'VIP'}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">{textLabel}</p>
              )}
            </div>
            
            {/* Floor label */}
            <div className="absolute bottom-1 right-2 text-[8px] text-slate-600 font-bold uppercase tracking-wider">
              {slot.floor === 'Ground Floor' ? 'GND' : slot.floor === 'First Floor' ? 'FLR 1' : 'FLR 2'}
            </div>

            {/* Vacant slot subtle breathing overlay */}
            {!isOccupied && !isReserved && (
              <div className="absolute inset-0 rounded-xl pointer-events-none vacant-glow-breathe" />
            )}
          </div>
        );
      })}

      {/* Local Styles for Grid Card Animations */}
      <style>{`
        /* Slot card staggered entry */
        @keyframes slot-card-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .slot-card-enter {
          animation: slot-card-enter 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        /* Car park bounce on occupy */
        @keyframes slot-park-in {
          0%   { transform: translateY(-25px) scale(0.8); opacity: 0; }
          60%  { transform: translateY(4px) scale(1.05); opacity: 1; }
          80%  { transform: translateY(-3px) scale(0.98); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .slot-vehicle-parked {
          animation: slot-park-in 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        /* EV charging glow pulse */
        @keyframes ev-active-pulse {
          0%   { filter: drop-shadow(0 0 2px rgba(167,139,250,0.3)); transform: scale(1); }
          50%  { filter: drop-shadow(0 0 10px rgba(167,139,250,0.85)); transform: scale(1.08); }
          100% { filter: drop-shadow(0 0 2px rgba(167,139,250,0.3)); transform: scale(1); }
        }
        .ev-charging-pulse {
          animation: ev-active-pulse 1.8s ease-in-out infinite;
        }

        /* Vacant slot subtle icon breathe */
        @keyframes vacant-breathe {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.55; transform: scale(1.04); }
        }
        .animate-vacant-breathe {
          animation: vacant-breathe 3.5s ease-in-out infinite;
        }

        /* Vacant slot glow breathe overlay */
        @keyframes vacant-glow {
          0%, 100% { opacity: 0; }
          50%       { opacity: 0.04; }
        }
        .vacant-glow-breathe {
          background: radial-gradient(ellipse at center, rgba(16,185,129,0.3) 0%, transparent 70%);
          animation: vacant-glow 4s ease-in-out infinite;
        }

        /* Reserved label shimmer */
        @keyframes reserved-shimmer {
          0%   { background-position: -150% center; }
          100% { background-position: 150% center; }
        }
        .reserved-shimmer {
          background: linear-gradient(90deg, #F59E0B 30%, #FDE68A 50%, #F59E0B 70%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: reserved-shimmer 2.5s linear infinite;
        }

        /* Status flash - green ring when slot freed */
        @keyframes status-flash {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.8); }
          70%  { box-shadow: 0 0 0 14px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .animate-status-flash {
          animation: status-flash 1s ease-out 1;
        }

        /* 3D hover tilt */
        .slot-card-3d {
          transform-style: preserve-3d;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .slot-card-3d:hover {
          transform: perspective(500px) rotateX(-5deg) rotateY(4deg) translateY(-5px) scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default SlotGrid;
