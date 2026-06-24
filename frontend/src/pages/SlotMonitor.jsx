import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { speakText } from '../utils/speech';
import { 
  RotateCw, 
  Search, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  X,
  Clock,
  User,
  Phone,
  Tag,
  CreditCard,
  QrCode,
  Zap,
  Bookmark,
  Check
} from 'lucide-react';
import SlotGrid from '../components/SlotGrid';

const SlotMonitor = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Keep a mutable ref of the selected slot to prevent stale closures in polling interval
  const selectedSlotRef = useRef(selectedSlot);
  selectedSlotRef.current = selectedSlot;
  
  // Checkout States
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [showQrModal, setShowQrModal] = useState(false);
  const [billingDetails, setBillingDetails] = useState(null);

  // Reservation States
  const [reserveOwner, setReserveOwner] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveLoading, setReserveLoading] = useState(false);

  // Activate Reservation States
  const [activatePlate, setActivatePlate] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);

  // Slot CRUD States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [newSlotFloor, setNewSlotFloor] = useState('Ground Floor');
  const [newSlotType, setNewSlotType] = useState('normal');
  const [newSlotVehicle, setNewSlotVehicle] = useState('all');
  const [newSlotRate, setNewSlotRate] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Slot States
  const [isEditing, setIsEditing] = useState(false);
  const [editFloor, setEditFloor] = useState('');
  const [editType, setEditType] = useState('normal');
  const [editVehicle, setEditVehicle] = useState('all');
  const [editRate, setEditRate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Submit slot creation
  const handleCreateSlotSubmit = async (e) => {
    e.preventDefault();
    if (!newSlotNumber.trim()) return;

    setCreateLoading(true);
    try {
      const response = await fetch('/api/slots/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: newSlotNumber.trim().toUpperCase(),
          floor: newSlotFloor,
          slot_type: newSlotType,
          allowed_vehicle: newSlotVehicle,
          custom_rate: newSlotRate.trim() ? parseFloat(newSlotRate) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        speakText(`Slot ${newSlotNumber} created successfully on ${newSlotFloor}.`);
        setShowAddModal(false);
        setNewSlotNumber('');
        setNewSlotFloor('Ground Floor');
        setNewSlotType('normal');
        setNewSlotVehicle('all');
        setNewSlotRate('');
        fetchSlots();
      } else {
        alert(data.message || 'Failed to create slot.');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to slot manager.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Submit slot config update
  const handleEditSlotSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setEditLoading(true);
    try {
      const response = await fetch('/api/slots/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: selectedSlot.slot_number,
          floor: editFloor,
          slot_type: editType,
          allowed_vehicle: editVehicle,
          custom_rate: editRate.trim() ? parseFloat(editRate) : null
        })
      });

      const data = await response.json();
      if (data.success) {
        speakText(`Slot ${selectedSlot.slot_number} updated successfully.`);
        setIsEditing(false);
        fetchSlots();
      } else {
        alert(data.message || 'Failed to update slot.');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to slot manager.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete parking slot
  const handleDeleteSlot = async (slotNum) => {
    if (!window.confirm(`Are you sure you want to permanently delete slot ${slotNum}?`)) return;

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/slots/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_number: slotNum })
      });

      const data = await response.json();
      if (data.success) {
        speakText(`Slot ${slotNum} deleted successfully.`);
        handleCloseModal();
        fetchSlots();
      } else {
        alert(data.message || 'Failed to delete slot.');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to slot manager.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (selectedFloor !== 'All') queryParams.append('floor', selectedFloor);
      if (selectedStatus !== 'All') queryParams.append('status', selectedStatus.toLowerCase());
      if (searchQuery) queryParams.append('search', searchQuery);

      const res = await fetch(`/api/slots?${queryParams.toString()}`);
      const data = await res.json();
      setSlots(data);
      
      // Update selected slot if details modal is open
      const currentSelected = selectedSlotRef.current;
      if (currentSelected) {
        const updated = data.find(s => s.id === currentSelected.id);
        if (updated) setSelectedSlot(updated);
      }
    } catch (error) {
      console.error('Failed to fetch slot details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 20000);
    return () => clearInterval(interval);
  }, [selectedFloor, selectedStatus, searchQuery]);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  const handleCloseModal = () => {
    setSelectedSlot(null);
    setBillingDetails(null);
    setShowQrModal(false);
    setReserveOwner('');
    setReservePhone('');
    setActivatePlate('');
    setIsEditing(false);
  };

  // Reserve slot handler
  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    setReserveLoading(true);
    try {
      const res = await fetch('/api/slots/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: selectedSlot.slot_number,
          owner_name: reserveOwner,
          phone: reservePhone
        })
      });
      const data = await res.json();
      if (data.success) {
        speakText(`Slot ${selectedSlot.slot_number} reserved successfully.`);
        handleCloseModal();
        fetchSlots();
      } else {
        speakText(`Reservation failed. ${data.message || ''}`);
        alert(data.message || 'Reservation failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Reservation connection error.');
    } finally {
      setReserveLoading(false);
    }
  };

  // Activate reserved vehicle checkin handler
  const handleActivateReservedSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot || !activatePlate) return;

    setActivateLoading(true);
    try {
      const res = await fetch('/api/slots/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_number: selectedSlot.slot_number,
          vehicle_number: activatePlate.toUpperCase()
        })
      });
      const data = await res.json();
      if (data.success) {
        speakText(`Check in activated. Slot ${selectedSlot.slot_number} is now occupied.`);
        handleCloseModal();
        fetchSlots();
      } else {
        speakText(`Check in activation failed. ${data.message || ''}`);
        alert(data.message || 'Check-in activation failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Activation connection error.');
    } finally {
      setActivateLoading(false);
    }
  };

  // Cancel reservation handler
  const handleCancelReservation = async () => {
    if (!selectedSlot) return;
    if (!window.confirm(`Are you sure you want to cancel the reservation for ${selectedSlot.slot_number}?`)) return;

    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/slots/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_number: selectedSlot.slot_number })
      });
      const data = await res.json();
      if (data.success) {
        speakText(`Reservation for slot ${selectedSlot.slot_number} has been canceled.`);
        handleCloseModal();
        fetchSlots();
      } else {
        speakText(`Cancellation failed. ${data.message || ''}`);
        alert(data.message || 'Cancellation failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Cancellation connection error.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Direct checkout handler from slots details modal
  const handleDirectCheckout = async (overrideMethod = null) => {
    if (!selectedSlot || !selectedSlot.vehicle_id) return;
    
    const currentMethod = overrideMethod || paymentMethod;

    try {
      setCheckoutLoading(true);
      
      // Calculate final billing details if not already loaded
      let currentBill = billingDetails;
      if (!currentBill) {
        const calcRes = await fetch('/api/exit/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicle_number: selectedSlot.vehicle_number })
        });
        const calcData = await calcRes.json();
        
        if (!calcData.success) {
          alert(calcData.message || 'Billing calculation error');
          setCheckoutLoading(false);
          return;
        }
        currentBill = calcData;
        setBillingDetails(calcData);
      }

      // Open QR Code modal if UPI is chosen
      if (currentMethod === 'UPI' && !showQrModal && !overrideMethod) {
        setShowQrModal(true);
        setCheckoutLoading(false);
        return;
      }

      // Process checkout
      const checkRes = await fetch('/api/exit/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: currentBill.vehicle_id,
          amount: currentBill.amount,
          payment_method: currentMethod
        })
      });
      
      const checkData = await checkRes.json();
      if (checkData.success) {
        speakText(`Checkout complete. Slot ${selectedSlot.slot_number} released.`);
        handleCloseModal();
        fetchSlots();
      } else {
        speakText(`Checkout failed. ${checkData.message || ''}`);
        alert(checkData.message || 'Checkout failed');
      }
    } catch (e) {
      console.error(e);
      alert('Checkout transaction error.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Helper: calculate live elapsed hours and amount
  const calculateLiveFee = (entryTimeStr) => {
    if (!entryTimeStr) return { hours: 0, amount: 0 };
    const ent = new Date(entryTimeStr.replace(/-/g, '/'));
    const diffMs = new Date() - ent;
    const hours = Math.max(0.1, round(diffMs / 3600000, 2));
    
    // Check occupancy based dynamic rates
    let currentMultiplier = 1.0;
    const occupiedCount = slots.filter(s => s.status === 'occupied').length;
    const totalCount = slots.length;
    const occPct = (occupiedCount / totalCount) * 100;
    
    if (occPct >= 50.0 && occPct < 80.0) {
      currentMultiplier = 1.5;
    } else if (occPct >= 80.0) {
      currentMultiplier = 2.0;
    }
    
    const baseRate = (selectedSlot && selectedSlot.custom_rate !== null && selectedSlot.custom_rate !== undefined) 
      ? selectedSlot.custom_rate 
      : 20;
    const activeRate = baseRate * currentMultiplier;
    const parking_amount = round(hours * activeRate, 2);
    
    return { 
      hours, 
      parking_amount, 
      rate: activeRate, 
      multiplier: currentMultiplier,
      label: currentMultiplier === 2.0 ? 'Surge' : currentMultiplier === 1.5 ? 'Peak' : 'Normal'
    };
  };

  const round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  };

  // QR Code generator helpers
  const getUpiUrl = () => {
    if (!billingDetails) return '';
    const pa = 'smartparking@okaxis';
    const pn = 'Smart Parking System';
    const am = billingDetails.amount;
    const tn = `Parking_Slot_${billingDetails.slot_number}`;
    return `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
  };

  const getQrUrl = () => {
    const upi = getUpiUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
  };

  // Check if selected slot belongs to EV or VIP range dynamically
  const isSelectedSlotEv = selectedSlot && selectedSlot.slot_type === 'ev';
  const isSelectedSlotVip = selectedSlot && selectedSlot.slot_type === 'vip';

  // Calculate live EV stats
  const evLiveStats = (entryTimeStr) => {
    const liveStats = calculateLiveFee(entryTimeStr);
    const energyKwh = round(liveStats.hours * 7.2, 2);
    const chargingFee = round(energyKwh * 10.0, 2);
    const batteryPct = Math.min(100, Math.round(20 + liveStats.hours * 25));
    const totalAmount = round(liveStats.parking_amount + chargingFee, 2);
    
    return {
      ...liveStats,
      energyKwh,
      chargingFee,
      batteryPct,
      totalAmount
    };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Parking Layout Monitor</h2>
          <p className="text-sm text-slate-400 mt-1">Live status representation of all {slots.length} parking terminals.</p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200"
          >
            + Add Slot
          </button>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/15">
            <CheckCircle2 size={12} />
            <span>Available: {slots.filter(s => s.status === 'available').length}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-rose-400 font-bold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/15">
            <AlertCircle size={12} />
            <span>Occupied: {slots.filter(s => s.status === 'occupied').length}</span>
          </span>
        </div>
      </div>

      {/* Filter Bar Panel */}
      <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Floor selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <Layers size={16} className="text-slate-500 mr-2 shrink-0" />
          {['All', 'Ground Floor', 'First Floor', 'Second Floor'].map((floor) => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`
                px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 shrink-0
                ${selectedFloor === floor 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white bg-white/5 border border-transparent hover:border-white/5'}
              `}
            >
              {floor === 'All' ? 'All Floors' : floor}
            </button>
          ))}
        </div>

        {/* Filter status tabs */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            {['All', 'Available', 'Occupied'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`
                  px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200
                  ${selectedStatus === status 
                    ? 'bg-slate-800 text-white shadow-inner' 
                    : 'text-slate-500 hover:text-slate-300'}
                `}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search slot or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl glass-input"
            />
          </div>
        </div>
      </div>

      {/* Slots grid container */}
      {loading && slots.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Syncing sensor terminals...</p>
        </div>
      ) : slots.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 rounded-2xl">
          <p className="font-semibold text-sm">No slots match the current filters.</p>
        </div>
      ) : (
        <SlotGrid slots={slots} onSlotClick={handleSlotClick} />
      )}

      {/* Details Modal */}
      {selectedSlot && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md glass-panel border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden slot-enter">
            {/* Background Glow */}
            <div className={`absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none 
              ${selectedSlot.status === 'reserved'
                ? 'bg-warning-500'
                : selectedSlot.status === 'occupied' 
                  ? (isSelectedSlotEv ? 'bg-violet-500' : 'bg-rose-500') 
                  : 'bg-emerald-500'}`} 
            />

            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Slot Details:</span>
                  <span className={`px-2 py-0.5 rounded-md text-xs 
                    ${selectedSlot.status === 'reserved'
                      ? 'bg-warning-500/20 text-warning-400 border border-warning-500/10'
                      : selectedSlot.status === 'occupied' 
                        ? (isSelectedSlotEv ? 'bg-violet-500/20 text-violet-400 border border-violet-500/10' : 'bg-rose-500/20 text-rose-400') 
                        : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {selectedSlot.slot_number} {isSelectedSlotEv && "⚡"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">{selectedSlot.floor}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {selectedSlot.status === 'occupied' ? (
                <>
                  {/* Occupant Details Card */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parked Vehicle Info</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <Tag size={16} className="text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Plate No</p>
                          <p className="text-xs font-bold text-white">{selectedSlot.vehicle_number}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <Tag size={16} className="text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Veh Type</p>
                          <p className="text-xs font-bold text-white">{selectedSlot.vehicle_type}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <User size={16} className="text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Owner</p>
                          <p className="text-xs font-bold text-white truncate">{selectedSlot.owner_name || 'Driver'}</p>
                        </div>
                      </div>

                      <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                        <Phone size={16} className="text-indigo-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">Phone</p>
                          <p className="text-xs font-bold text-white">{selectedSlot.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/40 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Clock size={16} className="text-indigo-400" />
                        <div className="flex-1 flex justify-between text-xs font-semibold">
                          <span>Check-in time:</span>
                          <span className="text-white">{selectedSlot.entry_time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-slate-400">
                        <Clock size={16} className="text-indigo-400" />
                        <div className="flex-1 flex justify-between text-xs font-semibold">
                          <span>Elapsed stay:</span>
                          <span className="text-white">{calculateLiveFee(selectedSlot.entry_time).hours} Hours</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EV Telemetry Board */}
                  {isSelectedSlotEv && (
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl space-y-3 slot-enter">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wide">
                        <Zap size={14} className="animate-pulse" />
                        <span>EV charging telemetry</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Charge Status</p>
                          <p className="text-white mt-0.5">{evLiveStats(selectedSlot.entry_time).batteryPct === 100 ? 'Fully Charged' : 'Charging...'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Battery level</p>
                          <p className="text-white mt-0.5">{evLiveStats(selectedSlot.entry_time).batteryPct}%</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Power consumed</p>
                          <p className="text-white mt-0.5">{evLiveStats(selectedSlot.entry_time).energyKwh} kWh</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Charge Rate</p>
                          <p className="text-white mt-0.5">7.2 kW/hr</p>
                        </div>
                        
                        {/* Animated battery progress bar */}
                        <div className="space-y-1.5 pt-1 col-span-2">
                          <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                            <span>Battery progress</span>
                            <span className="text-blue-400">{evLiveStats(selectedSlot.entry_time).batteryPct}%</span>
                          </div>
                          <div className="w-full h-3 bg-slate-950 rounded-full border border-white/5 overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ev-charge-bar-flow"
                              style={{ width: `${evLiveStats(selectedSlot.entry_time).batteryPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Widget */}
                  <div className="border-t border-white/5 pt-4 space-y-4">
                    <div className="flex flex-col bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Tariff Mode</p>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border
                              ${calculateLiveFee(selectedSlot.entry_time).label === 'Surge'
                                ? 'bg-rose-500/20 text-rose-400 border-rose-500/35 glow-rose'
                                : calculateLiveFee(selectedSlot.entry_time).label === 'Peak'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/35 glow-amber'
                                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35'
                              }
                            `}>
                              {calculateLiveFee(selectedSlot.entry_time).label} ({calculateLiveFee(selectedSlot.entry_time).multiplier}x)
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Tariff: ₹{calculateLiveFee(selectedSlot.entry_time).rate}/hr</p>
                        </div>
                        <p className="text-sm font-bold text-white">
                          ₹{evLiveStats(selectedSlot.entry_time).parking_amount}
                        </p>
                      </div>

                      {/* EV Pricing row */}
                      {isSelectedSlotEv && (
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-300 border-t border-white/5 pt-2">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold">EV charging cost</p>
                            <p className="text-[9px] text-blue-400 font-bold mt-0.5">Rate: ₹10/kWh</p>
                          </div>
                          <p className="text-sm font-bold text-white">
                            + ₹{evLiveStats(selectedSlot.entry_time).chargingFee}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center border-t border-white/10 pt-2 font-black text-white">
                        <span className="text-xs uppercase tracking-wider text-indigo-400">Total Net Cost</span>
                        <span className="text-xl text-glow-indigo">
                          ₹{isSelectedSlotEv ? evLiveStats(selectedSlot.entry_time).totalAmount : evLiveStats(selectedSlot.entry_time).parking_amount}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Checkout Payment Method</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['UPI', 'Credit Card', 'Cash'].map((method) => (
                          <button
                            key={method}
                            onClick={() => setPaymentMethod(method)}
                            className={`
                              py-2 rounded-xl text-xs font-bold border transition-all duration-200
                              ${paymentMethod === method 
                                ? 'bg-indigo-600 border-indigo-500 text-white' 
                                : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}
                            `}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDirectCheckout()}
                      disabled={checkoutLoading}
                      className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-rose-900/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {checkoutLoading ? (
                        <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      ) : (
                        <>
                          <CreditCard size={16} />
                          <span>{paymentMethod === 'UPI' ? 'Generate QR & Pay' : 'Process Checkout & Release'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : selectedSlot.status === 'reserved' ? (
                /* RESERVED STATE DETAILS & CHECK-IN FORM */
                <div className="space-y-6">
                  {/* Reservation details */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-warning-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-warning-400 font-bold text-xs uppercase tracking-wide">
                      <Bookmark size={14} />
                      <span>Advance Reservation Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-300">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Reserved By</p>
                        <p className="text-white mt-0.5">{selectedSlot.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase font-bold">Contact Phone</p>
                        <p className="text-white mt-0.5">{selectedSlot.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Checkin form */}
                  <form onSubmit={handleActivateReservedSubmit} className="space-y-4 pt-3 border-t border-white/5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Arrived Vehicle check-in</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">License Plate Number</label>
                      <input 
                        type="text"
                        placeholder="e.g. MH09AB1234"
                        value={activatePlate}
                        onChange={(e) => setActivatePlate(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 text-xs rounded-xl glass-input font-bold tracking-wider"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancelReservation}
                        disabled={checkoutLoading}
                        className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs uppercase tracking-wider border border-rose-500/20 transition-all duration-200"
                      >
                        Cancel Booking
                      </button>
                      
                      <button
                        type="submit"
                        disabled={activateLoading || !activatePlate}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200"
                      >
                        {activateLoading ? 'Checking in...' : 'Activate Check-In'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : isEditing ? (
                /* EDIT CONFIG FORM */
                <form onSubmit={handleEditSlotSubmit} className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Edit Slot Configuration</h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Floor Assignment</label>
                    <select
                      value={editFloor}
                      onChange={(e) => setEditFloor(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="Ground Floor">Ground Floor</option>
                      <option value="First Floor">First Floor</option>
                      <option value="Second Floor">Second Floor</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Slot Category</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="normal">Normal Slot</option>
                      <option value="ev">EV Charging Dock</option>
                      <option value="vip">VIP Prime Parking</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Restriction</label>
                    <select
                      value={editVehicle}
                      onChange={(e) => setEditVehicle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    >
                      <option value="all">Allow All Vehicles</option>
                      <option value="car">Cars Only</option>
                      <option value="bike">Bikes Only</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Custom Rate (Rs/hr) - Optional</label>
                    <input
                      type="number"
                      placeholder="e.g. 40 (Leave empty for default Rs 20/hr)"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl glass-input font-semibold"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-colors"
                    >
                      {editLoading ? 'Saving...' : 'Save Config'}
                    </button>
                  </div>
                </form>
              ) : (
                /* VACANT SLOT - SHOW RESERVATION FORM */
                <div className="space-y-6">
                  <div className="text-center py-4 border-b border-white/5">
                    <div className={`w-12 h-12 rounded-full border flex items-center justify-center text-xl mx-auto shadow-inner ${isSelectedSlotEv ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : isSelectedSlotVip ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                      {isSelectedSlotEv ? "⚡" : isSelectedSlotVip ? "★" : "✓"}
                    </div>
                    <h4 className="text-sm font-bold text-white mt-3">{isSelectedSlotEv ? 'EV Charging Terminal Vacant' : isSelectedSlotVip ? 'VIP Prime Slot Vacant' : 'Slot is vacant'}</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">This terminal is free. You can check-in a vehicle or reserve it in advance.</p>
                  </div>

                  {/* Reservation form */}
                  <form onSubmit={handleReserveSubmit} className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Bookmark size={14} className="text-indigo-400" />
                      <span>Reserve this slot</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Customer Name</label>
                        <input 
                          type="text"
                          placeholder="e.g. Aarav Patil"
                          value={reserveOwner}
                          onChange={(e) => setReserveOwner(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Contact Phone</label>
                        <input 
                          type="tel"
                          placeholder="e.g. 9876543210"
                          value={reservePhone}
                          onChange={(e) => setReservePhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider border border-white/10 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={reserveLoading || !reserveOwner || !reservePhone}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Bookmark size={12} />
                        <span>{reserveLoading ? 'Reserving...' : 'Reserve Slot'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Edit & Delete Slot Admin Controls */}
                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditFloor(selectedSlot.floor);
                        setEditType(selectedSlot.slot_type || 'normal');
                        setEditVehicle(selectedSlot.allowed_vehicle || 'all');
                        setEditRate(selectedSlot.custom_rate !== null && selectedSlot.custom_rate !== undefined ? selectedSlot.custom_rate.toString() : '');
                        setIsEditing(true);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-xs uppercase tracking-wider border border-indigo-500/20 transition-all duration-200"
                    >
                      Edit Config
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(selectedSlot.slot_number)}
                      disabled={checkoutLoading}
                      className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white font-bold text-xs uppercase tracking-wider border border-rose-500/20 transition-all duration-200"
                    >
                      Delete Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* UPI QR Payment Modal overlay */}
      {showQrModal && billingDetails && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-55 p-4">
          <div className="w-full max-w-sm glass-panel border border-white/10 rounded-3xl shadow-2xl p-6 relative slot-enter text-center space-y-5">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={14} className="text-indigo-400 animate-pulse" />
                <span>UPI QR Checkout</span>
              </h4>
              <button 
                onClick={() => { setShowQrModal(false); setBillingDetails(null); }}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* QR Code Graphic */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto glow-indigo">
              <img 
                src={getQrUrl()} 
                alt="UPI Payment QR Code" 
                className="w-44 h-44"
              />
            </div>

            {/* Invoice Meta */}
            <div className="text-xs space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Transaction Value</p>
              <p className="text-xl font-black text-white">₹{billingDetails.amount}</p>
              <p className="text-[10px] text-slate-400 mt-2">VPA: <span className="font-mono text-indigo-300 select-all">smartparking@okaxis</span></p>
              <p className="text-[9px] text-slate-500">Scan QR to pay for slot {billingDetails.slot_number}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <button
                onClick={() => handleDirectCheckout('UPI')}
                disabled={checkoutLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
              >
                {checkoutLoading ? 'Verifying payment...' : 'Simulate Payment Success'}
              </button>
              
              <button
                onClick={() => { setShowQrModal(false); setBillingDetails(null); }}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider transition-all duration-200"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Add Slot Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm glass-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden slot-enter">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-900/30 to-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                  <span className="font-black text-sm">+</span>
                </div>
                <div>
                  <h3 className="text-xs font-black text-white tracking-wide">ADD NEW PARKING SLOT</h3>
                  <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Configure a new parking terminal</p>
                </div>
              </div>
              <button
                onClick={() => { 
                  setShowAddModal(false); 
                  setNewSlotNumber('');
                  setNewSlotFloor('Ground Floor');
                  setNewSlotType('normal');
                  setNewSlotVehicle('all');
                  setNewSlotRate('');
                }}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body / Form */}
            <form onSubmit={handleCreateSlotSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Slot Number / Code</label>
                <input
                  type="text"
                  placeholder="e.g. P101 or VIP-1"
                  value={newSlotNumber}
                  onChange={(e) => setNewSlotNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input font-bold tracking-wider"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Floor Assignment</label>
                <select
                  value={newSlotFloor}
                  onChange={(e) => setNewSlotFloor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="Ground Floor">Ground Floor</option>
                  <option value="First Floor">First Floor</option>
                  <option value="Second Floor">Second Floor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Slot Category</label>
                <select
                  value={newSlotType}
                  onChange={(e) => setNewSlotType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="normal">Normal Slot</option>
                  <option value="ev">EV Charging Dock</option>
                  <option value="vip">VIP Prime Parking</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Vehicle Restriction</label>
                <select
                  value={newSlotVehicle}
                  onChange={(e) => setNewSlotVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
                >
                  <option value="all">Allow All Vehicles</option>
                  <option value="car">Cars Only</option>
                  <option value="bike">Bikes Only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Custom Rate (Rs/hr) - Optional</label>
                <input
                  type="number"
                  placeholder="e.g. 40 (Leave empty for default Rs 20/hr)"
                  value={newSlotRate}
                  onChange={(e) => setNewSlotRate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { 
                    setShowAddModal(false); 
                    setNewSlotNumber('');
                    setNewSlotFloor('Ground Floor');
                    setNewSlotType('normal');
                    setNewSlotVehicle('all');
                    setNewSlotRate('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newSlotNumber}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-colors"
                >
                  {createLoading ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      <style>{`
        @keyframes charge-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ev-charge-bar-flow {
          background-size: 200% 200%;
          animation: charge-flow 2.5s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default SlotMonitor;
