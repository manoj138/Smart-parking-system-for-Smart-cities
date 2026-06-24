import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle, Navigation, Printer, MessageCircle,
  Car, Zap, Bike, Star
} from 'lucide-react';

/* ─────────────────────────────────────────────────────
   SLOT INFO HELPER
   Given a slot string like "P45", returns slot metadata.
   ───────────────────────────────────────────────────── */
export const getSlotInfo = (slotStr, slotDetails = null) => {
  if (!slotStr) return {};
  
  if (slotDetails && slotDetails.floor) {
    const isEv = slotDetails.slotType === 'ev' || slotDetails.slot_type === 'ev' || slotDetails.isEv;
    const isVip = slotDetails.slotType === 'vip' || slotDetails.slot_type === 'vip' || slotDetails.isVip;
    const floor = slotDetails.floor;
    const floorCode = floor === 'Ground Floor' ? 'G' : floor === 'First Floor' ? '1' : '2';
    const section = isEv ? 'EV Charging Zone' : isVip ? 'VIP Prime Zone' : 'Regular Zone';
    
    let directions = [];
    if (floor === 'Ground Floor') {
      directions = [
        'Enter from main driveway, go straight',
        `Locate ${section} on Ground Floor`,
        `Find slot ${slotStr} — marked clearly 🅿️`,
        isEv ? '⚡ Plug in your EV charger if needed' : 'Park and engage handbrake'
      ];
    } else if (floor === 'First Floor') {
      directions = [
        'Proceed to ramp at end of Ground Floor',
        'Drive up to First Floor (Floor 1)',
        `Follow directions to ${section}`,
        `Find slot ${slotStr} — marked clearly 🅿️`,
        isEv ? '⚡ Plug in your EV charger if needed' : 'Park and engage handbrake'
      ];
    } else {
      directions = [
        'Take ramp / lift to Second Floor (Floor 2)',
        `Follow directions to ${section}`,
        `Find slot ${slotStr} — marked clearly 🅿️`,
        isEv ? '⚡ Plug in your EV charger if needed' : 'Park and engage handbrake'
      ];
    }
    
    return { floor, floorCode, section, directions, isEv, isVip };
  }

  // Fallback to static numbers if details are missing
  const num = parseInt(slotStr.replace(/[^0-9]/g, ''), 10) || 1;
  const isEv = num >= 91 && num <= 100;
  const isVip = num >= 81 && num <= 90;

  let floor, floorCode, section, directions;
  if (num <= 33) {
    floor = 'Ground Floor'; floorCode = 'G';
    section = num <= 17 ? 'Section A' : 'Section B';
    directions = [
      'Enter from main driveway, go straight',
      `Turn ${num <= 17 ? 'LEFT' : 'RIGHT'} into ${num <= 17 ? 'Section A' : 'Section B'}`,
      `Find slot ${slotStr} — marked in GREEN`,
      'Park and engage handbrake 🅿️',
    ];
  } else if (num <= 66) {
    floor = 'First Floor'; floorCode = '1';
    section = num <= 50 ? 'Section A' : 'Section B';
    directions = [
      'Proceed to ramp at end of Ground Floor',
      'Drive up to First Floor (Floor 1)',
      `Turn ${num <= 50 ? 'LEFT' : 'RIGHT'} into ${num <= 50 ? 'Section A' : 'Section B'}`,
      `Locate slot ${slotStr} — highlighted in GREEN 🅿️`,
    ];
  } else {
    floor = 'Second Floor'; floorCode = '2';
    section = isEv ? 'EV Charging Zone' : isVip ? 'VIP Prime Zone' : num <= 80 ? 'Section A' : 'Section B';
    directions = [
      'Take ramp / lift to Second Floor (Floor 2)',
      isEv
        ? '⚡ Head to EV Charging Zone (far-right area)'
        : isVip
          ? '★ Proceed to VIP Prime Zone (front-row area)'
          : `Turn ${num <= 80 ? 'LEFT' : 'RIGHT'} into ${num <= 80 ? 'Section A' : 'Section B'}`,
      `Find slot ${slotStr}${isEv ? ' — EV charger dock ready ⚡' : ' — marked in GREEN'}`,
      'Connect charger if EV, park and engage brake 🅿️',
    ];
  }

  return { floor, floorCode, section, directions, isEv, isVip, num };
};

/* ─────────────────────────────────────────────────────
   PRINT RECEIPT HELPER
   Opens a new popup window with a clean thermal-receipt
   style printout and auto-triggers the print dialog.
 ───────────────────────────────────────────────────── */
export const printParkingReceipt = ({ slotStr, vehicleNum, vehicleType, ownerName, entryTime, slotType, floor }) => {
  const { floor: resolvedFloor, section, isEv, isVip } = getSlotInfo(slotStr, { slotType, floor });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <title>Parking Ticket — ${slotStr}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Courier New',Courier,monospace;background:#fff;color:#000;
         width:300px;margin:0 auto;padding:20px 16px;font-size:11px;}
    .c{text-align:center;}
    .lbl{color:#555;font-weight:700;font-size:9px;letter-spacing:.5px;}
    .dash{border-top:1px dashed #bbb;margin:10px 0;}
    .solid{border-top:2px solid #000;margin:10px 0 6px;}
    table{width:100%;border-collapse:collapse;}
    td{padding:3px 0;vertical-align:top;}
    td:last-child{text-align:right;font-weight:700;}
    .slot-box{text-align:center;border:2px solid #000;border-radius:8px;padding:12px 8px;margin:10px 0;}
    .slot-num{font-size:52px;font-weight:900;letter-spacing:4px;line-height:1;}
    .slot-sub{font-size:10px;color:#333;margin-top:4px;font-weight:600;}
    .footer{text-align:center;font-size:8px;color:#888;}
  </style></head><body>
  <div class="c">
    <div style="font-size:13px;font-weight:900;letter-spacing:2px;">SMART PARKING SYSTEM</div>
    <div style="font-size:9px;color:#555;letter-spacing:1px;margin-top:3px;">Smart Cities — Parking Entry Receipt</div>
  </div>
  <div class="dash"></div>
  <table>
    <tr><td class="lbl">VEHICLE NO</td><td style="font-size:13px;font-weight:900;letter-spacing:1px;">${vehicleNum}</td></tr>
    <tr><td class="lbl">VEHICLE TYPE</td><td>${vehicleType}${isEv ? ' ⚡ EV' : ''}${isVip ? ' ★ VIP' : ''}</td></tr>
    ${ownerName ? `<tr><td class="lbl">OWNER</td><td>${ownerName}</td></tr>` : ''}
    <tr><td class="lbl">ENTRY TIME</td><td>${entryTime}</td></tr>
    <tr><td class="lbl">DATE</td><td>${new Date().toLocaleDateString('en-IN')}</td></tr>
  </table>
  <div class="dash"></div>
  <div class="slot-box">
    <div class="lbl" style="letter-spacing:2px;">ALLOCATED PARKING SLOT</div>
    <div class="slot-num">${slotStr}</div>
    <div class="slot-sub">${resolvedFloor} &nbsp;&middot;&nbsp; ${section}</div>
  </div>
  <div class="dash"></div>
  <div style="text-align:center;margin:12px 0;">
    <div class="lbl" style="letter-spacing:1px;font-size:8px;margin-bottom:4px;">TICKET BARCODE</div>
    <img src="https://barcode.tec-it.com/barcode.ashx?data=${slotStr}&code=Code128&translate-esc=true" alt="Barcode ${slotStr}" style="height:45px;max-width:100%;image-rendering:pixelated;" />
    <div style="font-size:9px;font-weight:700;margin-top:2px;letter-spacing:2px;">${slotStr}</div>
  </div>
  <div class="dash"></div>
  <table>
    <tr><td class="lbl">PARKING RATE</td><td>Rs.20 / hour</td></tr>
    ${isEv ? `<tr><td class="lbl">EV CHARGING</td><td>Rs.10 / kWh</td></tr>` : ''}
    <tr><td class="lbl">PAYMENT</td><td>At Exit Gate</td></tr>
  </table>
  <div class="solid"></div>
  <div class="footer">
    <div>Keep this ticket &middot; Present at Exit Gate for billing</div>
    <div style="margin-top:3px;">Smart Parking System for Smart Cities</div>
  </div>
  <script>window.onload=function(){window.print();setTimeout(function(){window.close();},800);};</script>
  </body></html>`;

  const pw = window.open('', '_blank', 'width=380,height=620,scrollbars=no,menubar=no,toolbar=no');
  if (pw) { pw.document.write(html); pw.document.close(); }
};

/* ─────────────────────────────────────────────────────
   PARKING GUIDANCE MODAL
   Props:
     ticketData: { slotStr, vehicleNum, vehicleType, ownerName, phone, entryTime }
     onClose: () => void

   Usage:
     import ParkingGuidanceModal from '../components/ParkingGuidanceModal';
     <ParkingGuidanceModal ticketData={...} onClose={() => setShow(false)} />
 ───────────────────────────────────────────────────── */
const ParkingGuidanceModal = ({ ticketData, onClose }) => {
  const { slotStr, vehicleNum, vehicleType, ownerName, phone, entryTime, slotType, floor: initialFloor } = ticketData;
  const { floor, section, directions, isEv, isVip } = getSlotInfo(slotStr, { slotType, floor: initialFloor });

  const [countdown, setCountdown] = useState(40);
  const timerRef = useRef(null);

  /* ── auto-close countdown ── */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timerRef.current); onClose(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [onClose]);

  const VehicleIcon = vehicleType === 'Bike' ? Bike : (vehicleType === 'EV' || isEv) ? Zap : isVip ? Star : Car;
  const countdownPct = (countdown / 40) * 100;

  const handlePrint = () => {
    clearInterval(timerRef.current);
    printParkingReceipt({ 
      slotStr, 
      vehicleNum, 
      vehicleType, 
      ownerName, 
      entryTime, 
      slotType, 
      floor 
    });
  };

  const handleWhatsApp = () => {
    const msg =
      `🅿️ *Smart Parking — Entry Ticket*\n\n` +
      `Vehicle: *${vehicleNum}*\nOwner: ${ownerName || 'Driver'}\n` +
      `Slot: *${slotStr}*\nFloor: ${floor}\nSection: ${section}\n` +
      `Entry: ${entryTime}\n\n` +
      `Directions:\n${directions?.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n` +
      `_Please show this at exit gate._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return createPortal(
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-3">
      <div
        className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        style={{ animation: 'pgm-reveal 0.55s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        {/* ── Countdown bar ── */}
        <div className="h-1 bg-slate-800 w-full">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-1000 ease-linear"
            style={{ width: `${countdownPct}%` }}
          />
        </div>

        {/* ── Header ── */}
        <div className={`px-6 py-4 border-b border-white/5 flex items-center justify-between
          ${isEv ? 'bg-gradient-to-r from-violet-900/30 to-slate-900' : isVip ? 'bg-gradient-to-r from-amber-900/30 to-slate-900' : 'bg-gradient-to-r from-indigo-900/30 to-slate-900'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg
              ${isEv ? 'bg-violet-600' : isVip ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              <VehicleIcon size={20} />
            </div>
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Smart Parking System</p>
              <h3 className="text-sm font-black text-white tracking-wide">PARKING ENTRY TICKET 🎫</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">

          {/* Vehicle info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 bg-slate-800/50 rounded-2xl p-3 border border-white/5">
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Vehicle No</p>
              <p className="text-lg font-black text-white tracking-widest mt-0.5 font-mono">{vehicleNum}</p>
              <p className="text-[9px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                <VehicleIcon size={9} className={isEv ? 'text-violet-400' : isVip ? 'text-amber-400' : 'text-indigo-400'} />
                {vehicleType} {isEv && '⚡'} {isVip && '★'}
                {ownerName && <> · {ownerName}</>}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-3 border border-white/5 flex flex-col items-center justify-center">
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Entry</p>
              <p className="text-xs font-bold text-white mt-0.5 text-center">{entryTime}</p>
            </div>
          </div>

          {/* Slot hero */}
          <div
            className={`rounded-2xl p-5 text-center border relative overflow-hidden
              ${isEv ? 'bg-violet-500/10 border-violet-500/30' : isVip ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-emerald-500/10 border-emerald-500/30'}`}
            style={{ animation: 'pgm-slot-pulse 2s ease-in-out infinite' }}
          >
            <div className={`absolute inset-0 opacity-5 ${isEv ? 'bg-violet-400' : isVip ? 'bg-amber-400' : 'bg-emerald-400'}`} />
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Your Allocated Slot
            </p>
            <p
              className={`text-5xl font-black tracking-wider ${isEv ? 'text-violet-300' : isVip ? 'text-amber-300' : 'text-emerald-300'}`}
              style={{ textShadow: isEv ? '0 0 30px rgba(167,139,250,0.6)' : isVip ? '0 0 30px rgba(245,158,11,0.6)' : '0 0 30px rgba(52,211,153,0.6)' }}
            >
              {slotStr} {isVip && '★'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <Navigation size={9} className="text-indigo-400" /> {floor}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-bold text-slate-300">{section}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleWhatsApp}
              className="btn-shimmer flex flex-col items-center gap-1 py-3 rounded-xl
                bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/20
                text-emerald-400 transition-all duration-200"
            >
              <MessageCircle size={16} />
              <span className="text-[9px] font-bold uppercase tracking-wider">WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-shimmer flex flex-col items-center gap-1 py-3 rounded-xl
                bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/20
                text-indigo-400 transition-all duration-200"
            >
              <Printer size={16} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Print</span>
            </button>
            <button
              onClick={onClose}
              className="btn-shimmer flex flex-col items-center gap-1 py-3 rounded-xl
                bg-slate-700/50 hover:bg-slate-700 border border-white/10
                text-white transition-all duration-200"
            >
              <CheckCircle size={16} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Got It!</span>
            </button>
          </div>

          <p className="text-center text-[9px] text-slate-600 font-semibold">
            Auto-closing in <span className="text-slate-400 font-bold">{countdown}s</span>
            {' '}· Please move vehicle promptly
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pgm-reveal {
          from { opacity:0; transform: scale(0.85) translateY(30px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes pgm-slot-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.0); }
          50%      { box-shadow: 0 0 20px 4px rgba(52,211,153,0.12); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default ParkingGuidanceModal;
