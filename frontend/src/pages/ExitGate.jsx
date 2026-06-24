import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, Search, CheckCircle, CreditCard, Tag, Clock, User, ShieldAlert, Check, X, QrCode, Volume2, Sparkles, Car, Camera } from 'lucide-react';
import GateSimulator from '../components/GateSimulator';
import { speakText } from '../utils/speech';

const ExitGate = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('slot'); // slot / vehicle
  const [loading, setLoading] = useState(false);
  const [billDetails, setBillDetails] = useState(null);
  
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [checkoutResult, setCheckoutResult] = useState(null);

  // Scanner state variables
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const qrScannerRef = useRef(null);

  // Load html5-qrcode script dynamically
  useEffect(() => {
    if (window.Html5Qrcode) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Fetch occupied slots for simulator dropdown
  const fetchOccupiedSlots = async () => {
    try {
      const response = await fetch('/api/slots?status=occupied');
      const data = await response.json();
      setOccupiedSlots(data || []);
    } catch (error) {
      console.error("Error fetching occupied slots:", error);
    }
  };

  const openScanner = () => {
    setShowScannerModal(true);
    setScannerError('');
    fetchOccupiedSlots();
    // Start camera scanner after modal renders
    setTimeout(() => {
      startCameraScanner();
    }, 300);
  };

  const closeScanner = () => {
    stopCameraScanner();
    setShowScannerModal(false);
  };

  const startCameraScanner = () => {
    if (!window.Html5Qrcode) {
      setScannerError('Scanner library loading. Please try again.');
      return;
    }

    setScannerActive(true);
    setScannerError('');

    try {
      const html5QrCode = new window.Html5Qrcode("scanner-preview");
      qrScannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            return { width: Math.min(width - 40, 260), height: Math.min(height - 40, 160) };
          }
        },
        (decodedText) => {
          handleBarcodeScanned(decodedText);
        },
        () => {}
      ).catch(err => {
        console.error("Camera start error:", err);
        setScannerError(err.message || 'Camera access denied or device not found.');
        setScannerActive(false);
      });
    } catch (error) {
      console.error("Scanner init error:", error);
      setScannerError('Could not initialize camera scanner.');
      setScannerActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      qrScannerRef.current.stop().then(() => {
        qrScannerRef.current = null;
        setScannerActive(false);
      }).catch(err => {
        console.error("Failed to stop scanner:", err);
      });
    }
  };

  const handleBarcodeScanned = (slotStr) => {
    const formatted = slotStr.trim().toUpperCase();
    setSearchType('slot');
    setSearchQuery(formatted);
    closeScanner();
    triggerAutoSearch(formatted);
  };

  const triggerAutoSearch = async (slotNum) => {
    setLoading(true);
    setBillDetails(null);
    setCheckoutResult(null);

    try {
      const response = await fetch('/api/exit/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_number: slotNum })
      });

      const data = await response.json();
      if (data.success) {
        setBillDetails(data);
        setActiveVehicleType(data.vehicle_type || 'Car');
        speakText(`Receipt found for vehicle ${data.vehicle_number}. Total amount due is ${data.amount} rupees.`);
      } else {
        speakText(`Billing error. ${data.message || 'No active parking session found.'}`);
        alert(data.message || 'No active parking session found.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to billing module.');
    } finally {
      setLoading(false);
    }
  };

  // Physical barcode scanner hook (keyboard emulation)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      const now = Date.now();
      if (now - lastKeyTime > 55) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        const finalCode = buffer.trim().toUpperCase();
        const slotRegex = /^P\d{1,3}$/;
        if (slotRegex.test(finalCode)) {
          handleBarcodeScanned(finalCode);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // QR Modal States
  const [showQrModal, setShowQrModal] = useState(false);

  // Gate Simulator States
  const [gateStatus, setGateStatus] = useState('CLOSED');
  const [sensorTriggered, setSensorTriggered] = useState(false);
  const [activeVehicleType, setActiveVehicleType] = useState('Car');

  // Celebration states
  const [showCelebration, setShowCelebration] = useState(false);
  const [showFarewell, setShowFarewell] = useState(false);
  const [speakAnim, setSpeakAnim] = useState(false);

  // Fetch bill details
  const handleCalculateBill = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;

    setLoading(true);
    setBillDetails(null);
    setCheckoutResult(null);

    try {
      const payload = {};
      if (searchType === 'slot') {
        payload.slot_number = searchQuery.toUpperCase();
      } else {
        payload.vehicle_number = searchQuery.toUpperCase();
      }

      const response = await fetch('/api/exit/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        setBillDetails(data);
        setActiveVehicleType(data.vehicle_type || 'Car');
        speakText(`Receipt found for vehicle ${data.vehicle_number}. Total amount due is ${data.amount} rupees.`);
      } else {
        speakText(`Billing error. ${data.message || 'No active parking session found.'}`);
        alert(data.message || 'No active parking session found.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to billing module.');
    } finally {
      setLoading(false);
    }
  };

  // Submit payment and checkout
  const handleCheckoutSubmit = async (overrideMethod = null) => {
    if (!billDetails) return;

    const currentMethod = overrideMethod || paymentMethod;

    // Trigger QR Code display first if UPI is chosen and modal is not shown
    if (currentMethod === 'UPI' && !showQrModal && !overrideMethod) {
      setShowQrModal(true);
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/exit/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: billDetails.vehicle_id,
          amount: billDetails.amount,
          payment_method: currentMethod
        })
      });

      const data = await response.json();
      if (data.success) {
        setCheckoutResult(data);

        // Animations
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);

        setShowFarewell(true);
        setTimeout(() => setShowFarewell(false), 2500);

        setSpeakAnim(true);
        speakText(`Payment received. Exit gate opening. Thank you, drive safe!`);
        setTimeout(() => setSpeakAnim(false), 3000);
        
        // Trigger Gate Opening
        setSensorTriggered(true);
        setGateStatus('OPEN');

        // Reset
        setBillDetails(null);
        setSearchQuery('');
        setShowQrModal(false);

        // Close Gate after 5 seconds
        setTimeout(() => {
          setGateStatus('CLOSED');
          setSensorTriggered(false);
        }, 5000);
      } else {
        alert(data.message || 'Checkout failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Checkout network error.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Build UPI URI for QR generation
  const getUpiUrl = () => {
    if (!billDetails) return '';
    const pa = 'smartparking@okaxis';
    const pn = 'Smart Parking System';
    const am = billDetails.amount;
    const tn = `Parking_Slot_${billDetails.slot_number}`;
    return `upi://pay?pa=${pa}&pn=${encodeURIComponent(pn)}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
  };

  const getQrUrl = () => {
    const upi = getUpiUrl();
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upi)}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="animate-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-3">
          Smart Checkout Portal
          {speakAnim && (
            <span className="flex items-center gap-1 text-emerald-400 animate-slide-in-right">
              <Volume2 size={18} className="animate-bounce" />
              <span className="text-xs font-normal normal-case text-slate-400">Broadcasting...</span>
            </span>
          )}
        </h2>
        <p className="text-sm text-slate-400 mt-1">Vehicle check-out terminal with automated tariff calculation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Billing Module */}
        <div className="space-y-6 animate-slide-in-left" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          
          {/* Query Form */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-5">
              <Search size={18} className="text-indigo-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Search active session</h4>
            </div>

            <form onSubmit={handleCalculateBill} className="space-y-4">
              <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/5 max-w-xs">
                <button
                  type="button"
                  onClick={() => { setSearchType('slot'); setSearchQuery(''); }}
                  className={`
                    flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    ${searchType === 'slot' ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  By Slot
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchType('vehicle'); setSearchQuery(''); }}
                  className={`
                    flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                    ${searchType === 'vehicle' ? 'bg-slate-800 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}
                  `}
                >
                  By Plate
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={searchType === 'slot' ? 'e.g. P12' : 'e.g. MH09AB1234'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 pr-10 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-xl glass-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={openScanner}
                    className="absolute right-2.5 top-2.5 p-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-white/5 transition-all"
                    title="Scan Ticket Barcode"
                  >
                    <Camera size={15} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
                >
                  {loading ? 'Processing...' : 'Find Bill'}
                </button>
              </div>
            </form>
          </div>

          {/* Receipt Panel */}
          {billDetails && (
            <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl bg-slate-900/20 animate-receipt-drop space-y-6">
              {/* Receipt Header */}
              <div className="border-b border-dashed border-white/10 pb-4 text-center">
                <h4 className="text-xs font-black tracking-widest text-slate-500 uppercase">SMART PARKING RECEIPT</h4>
                <p className="text-xl font-bold text-white mt-2 font-mono tracking-wider">
                  {billDetails.vehicle_number} {billDetails.is_ev && "⚡"}
                </p>
                <p className="text-[9px] text-slate-400 uppercase font-semibold mt-1">Slot Terminal: {billDetails.slot_number}</p>
              </div>

              {/* Grid details */}
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Owner</span>
                  <span className="font-semibold text-white">{billDetails.owner_name || 'Driver'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Vehicle Category</span>
                  <span className="font-semibold text-white">{billDetails.vehicle_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Check-in</span>
                  <span className="font-semibold text-white">{billDetails.entry_time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Check-out</span>
                  <span className="font-semibold text-white">{billDetails.exit_time}</span>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-3">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Stay Duration</span>
                  <span className="font-semibold text-white">{billDetails.duration_hours} Hours</span>
                </div>
                
                {/* Cost splits inside receipt */}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Tariff Mode</span>
                  <div className="flex items-center gap-1.5">
                    {billDetails.rate_label && (
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border
                        ${billDetails.rate_label === 'Surge' 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/35 glow-rose' 
                          : billDetails.rate_label === 'Peak'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/35 glow-amber'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/35 glow-emerald'
                        }
                      `}>
                        {billDetails.rate_label} ({billDetails.rate_multiplier}x)
                      </span>
                    )}
                    <span className="font-semibold text-white">₹{billDetails.hourly_rate}/hr</span>
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Parking Cost</span>
                  <span className="font-semibold text-white">₹{billDetails.parking_fee}</span>
                </div>

                {/* EV Specific breakdowns */}
                {billDetails.is_ev && (
                  <div className="flex justify-between items-center bg-blue-500/5 p-3 rounded-xl border border-blue-500/10 text-xs slot-enter">
                    <div>
                      <p className="text-[10px] text-blue-400 font-bold uppercase">EV Charging Tariff</p>
                      <p className="text-[9px] text-slate-500 font-medium mt-0.5">{billDetails.energy_kwh} kWh @ ₹10/kWh</p>
                    </div>
                    <span className="font-bold text-white">+ ₹{billDetails.charging_fee}</span>
                  </div>
                )}

                {/* Final Bill Box */}
                <div className="flex justify-between items-center bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/10">
                  <div>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Net Amount</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Total Tariffs Combined</p>
                  </div>
                  <p className="text-2xl font-black text-white text-glow-indigo">
                    ₹{billDetails.amount}
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3.5 border-t border-white/5 pt-5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checkout Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Credit Card', 'Cash'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        py-2 rounded-xl text-xs font-bold border transition-all duration-200
                        ${paymentMethod === method 
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}
                      `}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleCheckoutSubmit()}
                  disabled={checkoutLoading}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {checkoutLoading ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>
                      <CreditCard size={14} />
                      <span>{paymentMethod === 'UPI' ? 'Generate QR & Pay' : 'Process Pay & Release'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Exit Gate Simulator */}
        <div className="space-y-6 animate-slide-in-right" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <GateSimulator 
            gateName="Primary Exit Gate" 
            gateStatus={gateStatus} 
            sensorTriggered={sensorTriggered} 
            vehicleType={activeVehicleType}
          />

          {/* Success Overlay card */}
          {checkoutResult && (
            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 shadow-xl animate-receipt-drop space-y-4 relative overflow-hidden">
              {/* Farewell float */}
              {showFarewell && (
                <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none z-20">
                  <span className="text-emerald-400 font-bold text-sm animate-farewell flex items-center gap-2">
                    <Car size={16} />
                    Drive Safe! 🚗💨
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 text-emerald-400">
                <CheckCircle size={22} className={`glow-emerald ${showCelebration ? 'animate-checkmark-pop' : ''}`} />
                <h4 className="font-bold text-sm uppercase tracking-wider">Payment Received</h4>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-xs font-semibold text-slate-300">{checkoutResult.message}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Check size={14} />
                  <span>Exit Gate: OPEN</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold italic text-center">
                Barrier auto-closes in {gateStatus === 'OPEN' ? 'a few' : '0'} seconds...
              </p>
            </div>
          )}
        </div>

      </div>

      {/* UPI QR Payment Modal */}
      {showQrModal && billDetails && createPortal(
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm glass-panel border border-white/10 rounded-3xl shadow-2xl p-6 relative slot-enter text-center space-y-5">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={14} className="text-indigo-400 animate-pulse" />
                <span>UPI QR Checkout</span>
              </h4>
              <button 
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto glow-indigo">
              <img 
                src={getQrUrl()} 
                alt="UPI Payment QR Code" 
                className="w-44 h-44"
              />
            </div>

            {/* Merchant Details */}
            <div className="text-xs space-y-1">
              <p className="text-[10px] text-slate-500 uppercase font-bold">Transaction Value</p>
              <p className="text-xl font-black text-white">₹{billDetails.amount}</p>
              <p className="text-[10px] text-slate-400 mt-2">VPA: <span className="font-mono text-indigo-300 select-all">smartparking@okaxis</span></p>
              <p className="text-[9px] text-slate-500">Scan using any UPI App (GPay, PhonePe, Paytm)</p>
            </div>

            {/* Actions */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <button
                onClick={() => handleCheckoutSubmit('UPI')}
                disabled={checkoutLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
              >
                {checkoutLoading ? 'Verifying payment...' : 'Simulate Payment Success'}
              </button>
              
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold text-xs uppercase tracking-wider transition-all duration-200"
              >
                Cancel & Change Method
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* Barcode/QR Scanner Modal */}
      {showScannerModal && createPortal(
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm glass-panel border border-white/10 rounded-3xl shadow-2xl overflow-hidden slot-enter">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-indigo-900/30 to-slate-900">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                  <QrCode size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white tracking-wide">TICKET BARCODE SCANNER</h3>
                  <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">Scan entry ticket at exit gate</p>
                </div>
              </div>
              <button
                onClick={closeScanner}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Preview container */}
              <div className="relative aspect-video w-full rounded-2xl bg-slate-950 border border-white/5 overflow-hidden flex flex-col items-center justify-center">
                {scannerActive ? (
                  <div id="scanner-preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <QrCode size={28} className="text-slate-600 mx-auto animate-bounce" />
                    <p className="text-[10px] text-slate-400 font-bold">Initializing camera stream...</p>
                  </div>
                )}

                {/* Laser scan line animation */}
                {scannerActive && (
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-scanner-laser z-10 pointer-events-none" />
                )}

                {scannerError && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center space-y-3 z-20">
                    <ShieldAlert size={28} className="text-rose-500" />
                    <div>
                      <p className="text-xs font-bold text-white">Camera Scanner Unavailable</p>
                      <p className="text-[9px] text-slate-400 mt-1">{scannerError}</p>
                    </div>
                    <button
                      onClick={startCameraScanner}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-bold uppercase tracking-wider transition-colors"
                    >
                      Retry Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Simulator Section */}
              <div className="space-y-2.5 bg-slate-950/40 p-3.5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <Sparkles size={12} className="animate-spin-slow" />
                  <p className="text-[9px] font-black uppercase tracking-wider">Test Simulator (No Camera Required)</p>
                </div>
                <p className="text-[8px] text-slate-500 font-medium">Select an occupied slot to simulate scanning the barcode ticket:</p>

                <div className="flex gap-2">
                  <select
                    id="simulate-slot-select"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-white focus:outline-none focus:border-indigo-500 font-semibold"
                    defaultValue=""
                  >
                    <option value="" disabled>-- Select occupied slot --</option>
                    {occupiedSlots.map(slot => (
                      <option key={slot.id} value={slot.slot_number}>
                        Slot {slot.slot_number} - {slot.vehicle_number} ({slot.owner_name || 'Driver'})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const select = document.getElementById('simulate-slot-select');
                      if (select && select.value) {
                        handleBarcodeScanned(select.value);
                      } else {
                        alert("Please select a slot to simulate scanning!");
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    Simulate
                  </button>
                </div>
              </div>

              <div className="text-center bg-slate-950/20 py-2 rounded-xl border border-white/5">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Enterprise Auto-Detection Mode Active ⚡
                </p>
                <p className="text-[8px] text-slate-600 mt-0.5 px-2">
                  Scanning a physical ticket with a USB scanner will auto-fill the slot details.
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes scanner-laser {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .animate-scanner-laser {
          position: absolute;
          animation: scanner-laser 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default ExitGate;
