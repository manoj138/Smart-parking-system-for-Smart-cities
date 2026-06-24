import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, Zap, Info, User, Phone, Tag, Clock, 
  Sparkles, MapPin, Activity, CheckCircle, ArrowRight 
} from 'lucide-react';
import { speakText } from '../utils/speech';

const DriverBook = () => {
  const navigate = useNavigate();

  // Form Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Car');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingHours, setBookingHours] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState('');

  // Live Stats & Settings
  const [slots, setSlots] = useState([]);
  const [baseRate, setBaseRate] = useState(20);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Fetch initial slots and settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch slots
        const slotsRes = await fetch('/api/slots');
        const slotsData = await slotsRes.json();
        setSlots(slotsData || []);

        // Fetch settings
        const settingsRes = await fetch('/api/settings');
        const settingsData = await settingsRes.json();
        if (settingsData && settingsData.rate_per_hour) {
          setBaseRate(settingsData.rate_per_hour);
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute live occupancy metrics
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(s => s.status === 'occupied').length;
  const occupancyRate = totalSlots > 0 ? (occupiedSlots / totalSlots) * 100 : 0;

  // Determine multiplier
  let multiplier = 1.0;
  let multiplierLabel = 'Normal (1.0x)';
  let multiplierColor = 'text-emerald-400';
  if (occupancyRate >= 50.0 && occupancyRate < 80.0) {
    multiplier = 1.5;
    multiplierLabel = 'Peak Demand (1.5x)';
    multiplierColor = 'text-amber-400';
  } else if (occupancyRate >= 80.0) {
    multiplier = 2.0;
    multiplierLabel = 'Surge Rate (2.0x)';
    multiplierColor = 'text-rose-400 animate-pulse';
  }

  // Calculate fees
  const activeRate = baseRate * multiplier;
  const parkingFee = Math.round(bookingHours * activeRate);
  
  // EV specific math: 7.2 kW charging speed * ₹10/kWh
  const evChargingRate = 10.0;
  const evPowerKw = 7.2;
  const energyKwh = vehicleType === 'EV' ? bookingHours * evPowerKw : 0;
  const chargingFee = vehicleType === 'EV' ? Math.round(energyKwh * evChargingRate) : 0;
  const totalEstimatedCost = parkingFee + chargingFee;

  // Filter slots dynamically by slot_type from the database
  const availableSlots = slots.filter(slot => {
    if (slot.status !== 'available') return false;
    const isEv = slot.slot_type === 'ev';
    const isVip = slot.slot_type === 'vip';
    
    if (vehicleType === 'EV') {
      return isEv;
    } else {
      // Normal bookings can only use regular, non-EV, non-VIP slots
      return !isEv && !isVip;
    }
  });

  // Auto-select a slot if current selected slot is not in the filtered available list
  useEffect(() => {
    if (availableSlots.length > 0) {
      // Keep selected if still available, else pick first available
      const exists = availableSlots.some(s => s.slot_number === selectedSlot);
      if (!exists) {
        setSelectedSlot(availableSlots[0].slot_number);
      }
    } else {
      setSelectedSlot('');
    }
  }, [vehicleType, slots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !vehicleNumber || !ownerName || !phone) {
      alert('Please fill out all details and select an available slot.');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch('/api/slots/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: selectedSlot,
          owner_name: ownerName,
          phone: phone,
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType
        })
      });

      const data = await response.json();
      if (data.success) {
        speakText(`Booking confirmed. Slot ${selectedSlot} is reserved for you. Please print your digital ticket.`);
        // Redirect to print voucher page
        navigate(`/ticket/${selectedSlot}`);
      } else {
        speakText(`Booking failed. ${data.message || ''}`);
        alert(data.message || 'Booking reservation failed.');
      }
    } catch (error) {
      console.error('Booking submission error:', error);
      alert('Failed to submit booking reservation.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading Booking Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
            <Sparkles size={12} className="animate-pulse" />
            <span>Smart City Public Parking Portal</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Book Your Parking Space
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Reserve smart slots instantly, estimate dynamic rates based on occupancy, and print your digital entry pass.
          </p>
        </div>

        {/* Info Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Current Occupancy</span>
              <span className="text-lg font-extrabold text-white">{occupancyRate.toFixed(1)}%</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity size={18} />
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Rate Multiplier</span>
              <span className={`text-lg font-extrabold ${multiplierColor}`}>{multiplierLabel}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Info size={18} />
            </div>
          </div>
          <div className="glass-panel p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block">Live Base Cost</span>
              <span className="text-lg font-extrabold text-white">₹{activeRate}/hour</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock size={18} />
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Reservation Details Form */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <User className="text-indigo-400" size={20} />
              <span>Enter Driver Details</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Vehicle registration & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Plate Number</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-3 text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. MH09AB1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs font-semibold uppercase tracking-wider"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Type</label>
                  <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
                    {['Car', 'SUV', 'Bike', 'EV'].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setVehicleType(type)}
                        className={`
                          py-1.5 rounded-lg text-[10px] font-bold transition-all duration-200
                          ${vehicleType === type 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white'}
                        `}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Driver Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="e.g. Manoj Chougule"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-500" size={16} />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Booking Hours Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Duration Of Parking</span>
                  <span className="text-indigo-400">{bookingHours} Hours</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-white/5">
                  <Clock size={16} className="text-slate-500" />
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={bookingHours}
                    onChange={(e) => setBookingHours(parseInt(e.target.value))}
                    className="flex-1 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold w-12 text-right">{bookingHours} hrs</span>
                </div>
              </div>

              {/* Slot Picker Grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Available Space ({vehicleType === 'EV' ? 'EV Docks Only' : 'Standard Slots'})
                  </label>
                  {vehicleType === 'EV' && (
                    <span className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1">
                      <Zap size={10} className="animate-pulse" />
                      <span>EV Charging Docks</span>
                    </span>
                  )}
                </div>

                {availableSlots.length > 0 ? (
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 bg-slate-950/50 p-4 rounded-2xl border border-white/5 max-h-48 overflow-y-auto">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot === slot.slot_number;
                      return (
                        <button
                          type="button"
                          key={slot.slot_number}
                          onClick={() => setSelectedSlot(slot.slot_number)}
                          className={`
                            py-2 rounded-xl text-xs font-bold transition-all duration-200 border flex flex-col items-center justify-center gap-0.5
                            ${isSelected 
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105' 
                              : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-950/40'}
                          `}
                        >
                          <MapPin size={10} />
                          <span>{slot.slot_number}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-dashed border-white/5">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No Available slots for {vehicleType}s</p>
                    <p className="text-[10px] text-slate-600 mt-1">Please try modifying vehicle type or wait for checkout.</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={bookingLoading || !selectedSlot}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {bookingLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <span>Confirm Reservation</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Pricing Invoice Summary Panel */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Invoice Estimates */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4 mb-4 flex items-center justify-between">
                <span>Reservation Invoice Estimate</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-[9px] text-indigo-400 font-bold border border-indigo-500/20 uppercase tracking-widest">Pre-Booking</span>
              </h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Selected Space</span>
                  <span className="text-white font-bold tracking-wider">{selectedSlot || 'Not Selected'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Duration</span>
                  <span className="text-white font-bold">{bookingHours} Hours</span>
                </div>
                
                {/* Dynamic Base Calc */}
                <div className="flex justify-between items-center text-xs border-t border-white/5 pt-3">
                  <span className="text-slate-400">Base Parking Rate</span>
                  <span className="text-white font-semibold">₹{baseRate} / hr</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Demand Multiplier</span>
                  <span className={`font-semibold ${multiplierColor}`}>{multiplierLabel}</span>
                </div>

                <div className="flex justify-between items-center text-xs bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                  <span className="text-slate-400 font-medium">Estimated Parking Fee</span>
                  <span className="text-white font-bold text-glow-indigo">₹{parkingFee}</span>
                </div>

                {/* EV Power tariff splits if category EV */}
                {vehicleType === 'EV' && (
                  <div className="space-y-2 border-t border-dashed border-white/5 pt-3">
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[10px] uppercase">
                      <Zap size={10} className="animate-pulse" />
                      <span>EV Charging Dock Surcharges</span>
                    </div>
                    <div className="text-[10px] text-slate-500 italic">
                      Equipped with 7.2 kW charging socket. Electrical grids charge at ₹10.0/kWh.
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Energy Consumption</span>
                      <span className="text-white font-semibold">{energyKwh.toFixed(1)} kWh</span>
                    </div>
                    <div className="flex justify-between items-center text-xs bg-blue-950/20 p-2.5 rounded-xl border border-blue-500/10 text-blue-400">
                      <span className="font-medium">Charging Subtotal</span>
                      <span className="font-bold">₹{chargingFee}</span>
                    </div>
                  </div>
                )}

                {/* Total Billing Estimate */}
                <div className="border-t border-white/10 pt-4 mt-6 flex justify-between items-end">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Estimated Total</span>
                    <span className="text-xs text-slate-400 italic">Pay on exit gate</span>
                  </div>
                  <span className="text-3xl font-black text-emerald-400 text-glow-success">
                    ₹{totalEstimatedCost}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Instructions Panel */}
            <div className="glass-panel p-6 rounded-3xl border border-white/5 text-xs text-slate-400 space-y-4">
              <h5 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Info size={14} className="text-indigo-400" />
                <span>Important Rules</span>
              </h5>
              <ul className="list-disc pl-4 space-y-2 leading-relaxed">
                <li>Your booking ticket voucher contains a secure scan QR code to scan at the gate check-in scanner.</li>
                <li>IoT loop sensors at the assigned slot will verify your arrival. The system auto-activates your check-in when you park.</li>
                <li>In case of EV Charging docks, the billing multiplier is logged live. Unused charges are discarded.</li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default DriverBook;
