import React, { useState, useEffect, useRef } from 'react';
import { speakText } from '../utils/speech';
import { Cpu, Wifi, RefreshCw, Send, Terminal, ArrowRight, ShieldCheck, Zap, Volume2, Key, AlertTriangle } from 'lucide-react';

const VirtualIoT = () => {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  
  // Simulation states
  const [selectedSlot, setSelectedSlot] = useState('P1');
  const [distance, setDistance] = useState(25.0); // in cm
  const [autoTransmit, setAutoTransmit] = useState(true);
  const [transmitting, setTransmitting] = useState(false);
  const [servoAngle, setServoAngle] = useState(0); // 0 = closed, 90 = open
  const [wifiBlinking, setWifiBlinking] = useState(false);
  
  // New Expanded Components States
  const [oledMessage, setOledMessage] = useState('SYSTEM OK\nFREE SPACES: 0');
  const [ledColor, setLedColor] = useState('#10b981'); // Green by default
  const [buzzerActive, setBuzzerActive] = useState(false);
  const [activeCardUid, setActiveCardUid] = useState('');
  
  // Console & Network logs
  const [serialLogs, setSerialLogs] = useState([
    '--- NodeMCU ESP8266 Advanced IoT Gateway Boot ---',
    '[System] Initializing Wi-Fi module...',
    '[WiFi] Connecting to SSID: Smart_Cities_AP...',
    '[WiFi] Connected! IP Address Assigned: 192.168.1.15',
    '[OLED] SSD1306 I2C Screen initialized (SDA->D2, SCL->D1)',
    '[Neopixel] WS2812B Status Ring ready on Pin D4 (GPIO2)',
    '[RFID] RC522 SPI Module initialized (SDA->D3, SCK->D5, MOSI->D7, MISO->D6)',
    '[Buzzer] Active Security Buzzer armed on Pin D8 (GPIO15)',
    '[Servo] Gate Control calibrated to 0° (Closed) on Pin D0 (GPIO16)',
    '[NodeMCU] All hardware nodes connected. Transmitting sensor loops...'
  ]);
  
  const [httpRequest, setHttpRequest] = useState(null);
  const [httpResponse, setHttpResponse] = useState(null);

  const consoleEndRef = useRef(null);
  const transmitTimeoutRef = useRef(null);

  // Fetch slots on load to get counts and lists
  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/slots');
      const data = await res.json();
      setSlots(data || []);
      setLoadingSlots(false);
      
      const freeCount = (data || []).filter(s => s.status === 'available').length;
      setOledMessage(`SYSTEM ACTIVE\nFREE SLOTS: ${freeCount}`);
    } catch (error) {
      console.error('Failed to load slots for simulator:', error);
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    // Trigger initial telemetry check-in on load
    setTimeout(() => {
      transmitTelemetry(25.0);
    }, 500);
  }, []);

  // Update Neopixel Color based on distance & slot status
  useEffect(() => {
    const isOccupied = distance <= 15.0;
    if (isOccupied) {
      setLedColor('#f43f5e'); // Red
    } else {
      // Find if selected slot is reserved in database
      const slotObj = slots.find(s => s.slot_number === selectedSlot);
      if (slotObj && slotObj.status === 'reserved') {
        setLedColor('#f59e0b'); // Orange/Yellow for reservation
      } else {
        setLedColor('#10b981'); // Green
      }
    }
    
    // OLED text update
    const freeCount = slots.filter(s => s.status === 'available').length;
    if (distance <= 5.0) {
      setOledMessage(`WARNING!\nCRASH ALERT!`);
      setBuzzerActive(true);
    } else if (isOccupied) {
      setOledMessage(`SLOT: ${selectedSlot}\nSTATUS: OCCUPIED`);
      setBuzzerActive(false);
    } else {
      setOledMessage(`SLOT: ${selectedSlot}\nSTATUS: VACANT`);
      setBuzzerActive(false);
    }
  }, [distance, selectedSlot, slots]);

  // Scroll console to bottom
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs]);

  // Append logs helper
  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setSerialLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Debounced transmission for dragging the slider
  const debouncedTransmit = (val) => {
    if (transmitTimeoutRef.current) {
      clearTimeout(transmitTimeoutRef.current);
    }
    transmitTimeoutRef.current = setTimeout(() => {
      transmitTelemetry(val);
    }, 300);
  };

  // Run telemetry request
  const transmitTelemetry = async (targetDistance) => {
    const distVal = parseFloat(targetDistance);
    const isOccupied = distVal <= 15.0;
    
    setTransmitting(true);
    setWifiBlinking(true);

    const payload = {
      slot_number: selectedSlot,
      distance_cm: distVal
    };

    const reqHeaders = 
`POST /api/iot/slot-update HTTP/1.1
Host: 127.0.0.1:5000
Content-Type: application/json
Content-Length: ${JSON.stringify(payload).length}
User-Agent: ESP8266-AdvancedGateway/2.0`;

    setHttpRequest({
      headers: reqHeaders,
      body: JSON.stringify(payload, null, 2)
    });

    addLog(`[Sensor] Distance reading: ${distVal.toFixed(1)} cm`);
    addLog(`[LED] Neopixel state commanded: ${isOccupied ? 'RED' : 'GREEN'}`);
    
    if (distVal <= 5.0) {
      addLog(`[Buzzer] Pin D8 HIGH! Warning buzzer sounding! 🚨`);
      speakText(`Warning! Vehicle too close to sensor boundaries.`);
    }

    try {
      const response = await fetch('/api/iot/slot-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      const resHeaders = 
`HTTP/1.1 ${response.status} ${response.statusText}
Content-Type: application/json
Server: Werkzeug Flask API`;

      setHttpResponse({
        headers: resHeaders,
        body: JSON.stringify(data, null, 2)
      });

      if (data.success) {
        addLog(`[WiFi] Telemetry HTTP 200 OK.`);
        
        // Simulating the barrier lift logic based on detection
        if (isOccupied && servoAngle === 0) {
          setServoAngle(90);
          addLog(`[Servo] Barrier open command. Pin D0 rotated to 90°`);
          speakText(`Slot ${selectedSlot} occupied. Entry gate open.`);
        } else if (!isOccupied && servoAngle === 90) {
          setServoAngle(0);
          addLog(`[Servo] Barrier close command. Pin D0 returned to 0°`);
          speakText(`Slot ${selectedSlot} is now clear. Gate closed.`);
        }
        fetchSlots();
      } else {
        addLog(`[WiFi Error] server rejected payload: ${data.message}`);
      }
    } catch (error) {
      console.error(error);
      addLog(`[WiFi Error] Connection failed. Check if local backend is online!`);
    } finally {
      setTransmitting(false);
      setTimeout(() => setWifiBlinking(false), 800);
    }
  };

  // Simulate RFID scan card
  const handleRfidTap = async (cardType) => {
    setWifiBlinking(true);
    const uid = cardType === 'VIP' ? 'F3 9A D8 22' : '4A 1B B0 E5';
    setActiveCardUid(uid);
    
    addLog(`[RFID] Card Scanned! UID: ${uid}`);
    addLog(`[RFID] Querying access token for Card Category: ${cardType}...`);

    setOledMessage(`CARD DETECTED\nUID: ${uid}`);
    speakText(`RF ID card detected. Authenticating user...`);

    // Simulate entry check-in via API
    try {
      // Pick a random plate and checkin
      const mockPlate = `MH12RF${Math.floor(1000 + Math.random() * 9000)}`;
      addLog(`[WiFi] Authenticating check-in for vehicle: ${mockPlate}...`);

      const response = await fetch('/api/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_number: mockPlate,
          vehicle_type: 'Car',
          owner_name: cardType === 'VIP' ? 'VIP Customer' : 'Regular Member',
          phone: '9876543210',
          is_vip: cardType === 'VIP'
        })
      });

      const data = await response.json();
      if (data.success) {
        setOledMessage(`ACCESS GRANTED\nSLOT: ${data.assigned_slot}`);
        addLog(`[RFID Auth] Access Granted! Assigned Slot: ${data.assigned_slot}`);
        addLog(`[Servo] Opening entrance gate. Servo rotating to 90°`);
        setServoAngle(90);
        speakText(`Welcome, access granted. Please park at Slot ${data.assigned_slot}.`);
        
        // Lower gate after 5 seconds
        setTimeout(() => {
          setServoAngle(0);
          addLog(`[Servo] Timeout reached. Lowering barrier. Servo returning to 0°`);
        }, 5000);
        fetchSlots();
      } else {
        setOledMessage(`ACCESS DENIED\n${data.message || 'Error'}`);
        addLog(`[RFID Auth] Access Denied: ${data.message || 'Unknown verification error'}`);
      }
    } catch (e) {
      addLog(`[WiFi Error] Failed to connect to entry endpoint.`);
    } finally {
      setTimeout(() => setWifiBlinking(false), 800);
      setTimeout(() => setActiveCardUid(''), 3000);
    }
  };

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    setDistance(val);
    if (autoTransmit) {
      debouncedTransmit(val);
    }
  };

  const handleSliderRelease = () => {
    // Handled by debouncedTransmit on change!
  };

  const handleManualTransmit = () => {
    transmitTelemetry(distance);
  };

  const handleSlotChange = (e) => {
    const nextSlot = e.target.value;
    setSelectedSlot(nextSlot);
    addLog(`Target sensor node switched to slot: ${nextSlot}`);
    // Trigger telemetry immediately for the new slot
    transmitTelemetry(distance);
  };

  const clearLogs = () => {
    setSerialLogs([`[Console Reset] NodeMCU Serial buffer flushed.`]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="animate-slide-up">
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-3">
          Advanced IoT Sandbox & Circuit Simulator
          <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/15">
            <Cpu size={12} className="animate-pulse" />
            <span>Full Hardware Node Active</span>
          </span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Interactive schematic visualization of NodeMCU pins wiring including Ultrasonic Sensor, RFID Reader, OLED Display, Neopixels, and Buzzer.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left Side: Hardware Circuit & Slider Controls */}
        <div className="space-y-6">
          {/* Virtual Schematic Board */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden bg-slate-900/30">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 glow-blue animate-pulse" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ESP8266 Node Breadboard</span>
            </div>
            
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
              <Zap size={14} className="text-indigo-400" />
              Interactive Circuit Wiring Schematic
            </h4>

            {/* SVG Circuit Diagram */}
            <div className="w-full bg-slate-950/70 border border-white/5 rounded-2xl p-4 flex items-center justify-center relative min-h-[360px] overflow-hidden">
              
              {/* Visual Buzzer Alarm Overlay */}
              {buzzerActive && (
                <div className="absolute inset-0 border-2 border-red-500/30 bg-red-500/5 animate-pulse pointer-events-none z-10 flex items-center justify-center">
                  <div className="bg-red-600/90 text-white font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-xl shadow-lg border border-red-500 flex items-center gap-1">
                    <AlertTriangle size={12} className="animate-bounce" />
                    Buzzer Sounding 🚨
                  </div>
                </div>
              )}

              <svg viewBox="0 0 600 380" className="w-full max-w-xl h-auto">
                {/* Wires Layout */}
                {/* VCC Red lines */}
                <path d="M 100 220 L 95 220 L 95 50 L 210 50 L 210 70 M 210 50 L 310 50 L 310 60 M 95 220 L 95 150 L 55 150 L 55 135 L 65 135 M 95 220 L 95 210 L 310 210 L 310 180 L 320 180 M 310 210 L 450 210 L 450 250 L 460 250 L 460 240" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray={transmitting ? "5 3" : ""} />
                
                {/* GND Black lines */}
                <path d="M 100 280 L 90 280 L 90 40 L 200 40 L 200 70 M 200 40 L 340 40 L 340 60 M 90 280 L 90 290 L 50 290 L 50 140 L 65 140 M 90 280 L 90 290 L 190 290 L 190 270 M 90 280 L 90 295 L 300 295 L 300 200 L 320 200 M 300 295 L 440 295 L 440 250 L 470 250 L 470 240" fill="none" stroke="#475569" strokeWidth="2" />

                {/* OLED Connections (SCL -> D1, SDA -> D2) */}
                <path d="M 115 220 L 115 130 L 220 130 L 220 70" fill="none" stroke="#eab308" strokeWidth="1.5" /> {/* SCL */}
                <path d="M 130 220 L 130 140 L 230 140 L 230 70" fill="none" stroke="#a855f7" strokeWidth="1.5" /> {/* SDA */}

                {/* Neopixel LED (D4 -> Signal) */}
                <path d="M 160 220 L 160 190 L 320 190" fill="none" stroke="#06b6d4" strokeWidth="1.5" />

                {/* Buzzer Connections (D8 -> Signal) */}
                <path d="M 160 280 L 160 300 L 180 300 L 180 270" fill="none" stroke="#fb7185" strokeWidth="1.5" />

                {/* RFID Reader Connections SPI (SCK -> D5, MISO -> D6, MOSI -> D7, SDA -> D3) */}
                <path d="M 145 220 L 145 120 L 430 120 L 430 260 L 510 260 L 510 240" fill="none" stroke="#0ea5e9" strokeWidth="1.5" /> {/* SDA (SS) */}
                <path d="M 115 280 L 115 340 L 500 340 L 500 240" fill="none" stroke="#ec4899" strokeWidth="1.5" /> {/* SCK */}
                <path d="M 130 280 L 130 350 L 480 350 L 480 240" fill="none" stroke="#22c55e" strokeWidth="1.5" /> {/* MISO */}
                <path d="M 145 280 L 145 360 L 490 360 L 490 240" fill="none" stroke="#f97316" strokeWidth="1.5" /> {/* MOSI */}

                {/* Servo Gate D0 wire */}
                <path d="M 175 220 L 175 160 L 65 160 L 65 130" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Ultrasonic Sensor HC-SR04 Connections (Trig -> TX, Echo -> RX) */}
                <path d="M 190 280 L 190 310 L 280 310 L 280 90 L 320 90 L 320 60" fill="none" stroke="#818cf8" strokeWidth="1.5" /> {/* Trig */}
                <path d="M 175 280 L 175 320 L 290 320 L 290 80 L 330 80 L 330 60" fill="none" stroke="#60a5fa" strokeWidth="1.5" /> {/* Echo */}

                {/* NodeMCU Board */}
                <g transform="translate(80, 200)">
                  <rect width="130" height="90" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="2.5" className="glow-indigo" />
                  <rect x="5" y="30" width="12" height="30" rx="2" fill="#475569" />
                  <text x="65" y="45" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">ESP8266</text>
                  <text x="65" y="58" fill="#3b82f6" fontSize="8" fontWeight="extrabold" textAnchor="middle">NodeMCU</text>
                  
                  {/* Pin Dots */}
                  <circle cx="20" cy="20" r="3" fill="#f59e0b" /> <text x="17" y="12" fill="#64748b" fontSize="6" fontFamily="monospace">3V3</text>
                  <circle cx="35" cy="20" r="3" fill="#3b82f6" /> <text x="32" y="12" fill="#64748b" fontSize="6" fontFamily="monospace">D1</text>
                  <circle cx="50" cy="20" r="3" fill="#3b82f6" /> <text x="47" y="12" fill="#64748b" fontSize="6" fontFamily="monospace">D2</text>
                  <circle cx="65" cy="20" r="3" fill="#3b82f6" /> <text x="62" y="12" fill="#64748b" fontSize="6" fontFamily="monospace">D3</text>
                  <circle cx="80" cy="20" r="3" fill="#3b82f6" /> <text x="77" y="12" fill="#64748b" fontSize="6" fontFamily="monospace">D4</text>
                  <circle cx="95" cy="20" r="3" fill="#3b82f6" /> <text x="92" y="12" fill="#64748b" fontSize="6" fontFamily="monospace">D0</text>
                  
                  <circle cx="20" cy="80" r="3" fill="#334155" /> <text x="16" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">GND</text>
                  <circle cx="35" cy="80" r="3" fill="#3b82f6" /> <text x="32" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">D5</text>
                  <circle cx="50" cy="80" r="3" fill="#3b82f6" /> <text x="47" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">D6</text>
                  <circle cx="65" cy="80" r="3" fill="#3b82f6" /> <text x="62" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">D7</text>
                  <circle cx="80" cy="80" r="3" fill="#3b82f6" /> <text x="77" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">D8</text>
                  <circle cx="95" cy="80" r="3" fill="#3b82f6" /> <text x="92" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">RX</text>
                  <circle cx="110" cy="80" r="3" fill="#3b82f6" /> <text x="107" y="75" fill="#64748b" fontSize="6" fontFamily="monospace">TX</text>
                  
                  <circle cx="115" cy="45" r="4" fill={wifiBlinking ? "#60a5fa" : "#1e3a8a"} className={wifiBlinking ? "animate-ping" : ""} />
                  <circle cx="115" cy="45" r="3.5" fill={wifiBlinking ? "#3b82f6" : "#1e40af"} />
                </g>

                {/* 1. I2C OLED Display (SSD1306) */}
                <g transform="translate(190, 20)">
                  <rect width="65" height="50" rx="4" fill="#111827" stroke="#4b5563" strokeWidth="1.5" />
                  <rect x="5" y="5" width="55" height="30" fill="#000000" stroke="#1f2937" />
                  
                  {/* OLED Simulated message */}
                  <text x="32" y="15" fill="#eab308" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {oledMessage.split('\n')[0]}
                  </text>
                  <text x="32" y="27" fill="#60a5fa" fontSize="5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {oledMessage.split('\n')[1] || ''}
                  </text>
                  
                  <text x="32" y="44" fill="#9ca3af" fontSize="5" textAnchor="middle">SSD1306 OLED</text>
                </g>

                {/* 2. Ultrasonic Sensor (HC-SR04) */}
                <g transform="translate(300, 20)">
                  <rect width="60" height="40" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <circle cx="17" cy="20" r="10" fill="#475569" stroke="#94a3b8" />
                  <circle cx="17" cy="20" r="6" fill="#1e293b" />
                  <circle cx="43" cy="20" r="10" fill="#475569" stroke="#94a3b8" />
                  <circle cx="43" cy="20" r="6" fill="#1e293b" />
                  <text x="30" y="36" fill="#cbd5e1" fontSize="5" textAnchor="middle" fontFamily="monospace">HC-SR04</text>
                </g>

                {/* 3. WS2812B RGB Neopixel LED */}
                <g transform="translate(320, 175)">
                  <circle cx="15" cy="15" r="14" fill="#111827" stroke="#374151" strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="8" fill={ledColor} style={{ filter: `drop-shadow(0 0 6px ${ledColor})` }} />
                  <text x="15" y="37" fill="#9ca3af" fontSize="6" textAnchor="middle">RGB LED</text>
                </g>

                {/* 4. Active Buzzer Alarm */}
                <g transform="translate(170, 240)">
                  <circle cx="15" cy="15" r="12" fill="#1f2937" stroke="#374151" strokeWidth="1.5" />
                  <circle cx="15" cy="15" r="8" fill="#111827" />
                  <line x1="11" y1="15" x2="19" y2="15" stroke="#4b5563" strokeWidth="2" />
                  <line x1="15" y1="11" x2="15" y2="19" stroke="#4b5563" strokeWidth="2" />
                  <text x="15" y="35" fill="#9ca3af" fontSize="6" textAnchor="middle">BUZZER</text>
                </g>

                {/* 5. SG90 Servo Gate motor */}
                <g transform="translate(15, 120)">
                  <rect width="50" height="30" rx="3" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                  <g transform={`translate(25, -5) rotate(${servoAngle})`}>
                    <line x1="-15" y1="0" x2="15" y2="0" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="3.5" fill="#475569" />
                  </g>
                  <text x="25" y="20" fill="#f8fafc" fontSize="7" textAnchor="middle" fontWeight="bold">SERVO</text>
                </g>

                {/* 6. RC522 RFID Card Reader */}
                <g transform="translate(450, 180)">
                  <rect width="70" height="60" rx="5" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  {/* antenna coil grid */}
                  <rect x="8" y="8" width="54" height="34" rx="3" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="35" y="28" fill="#64748b" fontSize="6" textAnchor="middle" fontWeight="bold">RFID-RC522</text>
                  <text x="35" y="52" fill="#94a3b8" fontSize="6" textAnchor="middle" fontFamily="monospace">SPI PORT</text>

                  {/* Active Card Scan Highlight */}
                  {activeCardUid && (
                    <rect x="5" y="5" width="60" height="50" rx="4" fill="none" stroke="#60a5fa" strokeWidth="2" className="animate-pulse" />
                  )}
                </g>

                {/* Virtual Car Sensor Detector representation */}
                {distance <= 15.0 && (
                  <g transform="translate(370, 20)" className="slot-enter">
                    <rect width="40" height="20" rx="4" fill="#ef4444" opacity="0.8" />
                    <text x="20" y="12" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">CAR</text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Telemetry Sensor & RFID Card Controller */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl bg-slate-900/10 space-y-5">
            {/* Header tab switcher */}
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-4">
              Advanced Telemetry Controls
            </h4>

            {/* Split controls (Sensor vs RFID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Telemetry controls */}
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Zap size={11} className="text-indigo-400" /> Slot Ultrasonic Node
                </p>

                <div className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center text-xs">
                    <select
                      value={selectedSlot}
                      onChange={handleSlotChange}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/5 text-[10px] text-white font-bold"
                    >
                      {slots.map(slot => (
                        <option key={slot.id} value={slot.slot_number}>
                          Slot {slot.slot_number}
                        </option>
                      ))}
                    </select>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border
                      ${distance <= 15.0 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/25 glow-rose' 
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/25'
                      }
                    `}>
                      {distance <= 15.0 ? 'Occupied' : 'Vacant'}
                    </span>
                  </div>

                  <div className="text-center py-1">
                    <span className="text-3xl font-mono font-black text-white text-glow-indigo">
                      {distance.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 ml-1">cm</span>
                  </div>

                  <input
                    type="range"
                    min="2.0"
                    max="50.0"
                    step="0.5"
                    value={distance}
                    onChange={handleSliderChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  
                  <button
                    onClick={handleManualTransmit}
                    disabled={transmitting}
                    className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 font-bold text-[10px] uppercase tracking-wider transition-all"
                  >
                    Transmit Telemetry
                  </button>
                </div>
              </div>

              {/* RFID Card Tap controls */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Key size={11} className="text-blue-400" /> RFID RC522 Reader Module
                </p>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Tap card to simulate dynamic gate entry checkout. Auto-authenticates and allocates slots.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleRfidTap('VIP')}
                    disabled={transmitting}
                    className="py-3.5 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-slate-900 border border-violet-500/20 hover:border-violet-500/40 text-violet-300 font-bold text-xs uppercase tracking-wider transition-all text-center flex flex-col items-center gap-1.5 active:scale-[0.98]"
                  >
                    <span>💳 VIP CARD</span>
                    <span className="text-[8px] font-mono text-slate-500">UID: F3 9A D8 22</span>
                  </button>

                  <button
                    onClick={() => handleRfidTap('REGULAR')}
                    disabled={transmitting}
                    className="py-3.5 rounded-2xl bg-gradient-to-tr from-blue-600/30 to-slate-900 border border-blue-500/20 hover:border-blue-500/40 text-blue-300 font-bold text-xs uppercase tracking-wider transition-all text-center flex flex-col items-center gap-1.5 active:scale-[0.98]"
                  >
                    <span>💳 REGULAR CARD</span>
                    <span className="text-[8px] font-mono text-slate-500">UID: 4A 1B B0 E5</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Serial Monitor console & REST inspector */}
        <div className="space-y-6">
          {/* Serial Monitor console */}
          <div className="glass-panel p-5 rounded-3xl border border-white/5 shadow-xl bg-slate-900/30 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal size={14} className="text-indigo-400" />
                NodeMCU Serial Terminal Monitor
              </h4>
              <button
                onClick={clearLogs}
                className="text-[9px] font-bold text-slate-500 hover:text-slate-300 uppercase bg-slate-950/60 hover:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-white/5 transition-all"
              >
                Clear Console
              </button>
            </div>

            {/* Vintage CRT screen console logs */}
            <div className="w-full h-64 bg-slate-950 border border-white/10 rounded-2xl p-4 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-1.5 shadow-inner select-all relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15 pointer-events-none" />
              {serialLogs.map((log, index) => (
                <div key={index} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>

          {/* REST API HTTP request / response Inspector */}
          <div className="glass-panel p-5 rounded-3xl border border-white/5 shadow-xl bg-slate-900/30 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
              REST HTTP Request/Response Inspector
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Request Block */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Outgoing Request Payload</p>
                <div className="w-full h-52 bg-slate-950 border border-white/5 rounded-2xl p-3 overflow-y-auto font-mono text-[9px] text-indigo-300 space-y-2 shadow-inner">
                  {httpRequest ? (
                    <>
                      <pre className="text-slate-400 font-bold border-b border-white/5 pb-2 mb-2 select-all">{httpRequest.headers}</pre>
                      <pre className="text-emerald-400 font-semibold select-all">{httpRequest.body}</pre>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold italic">
                      Awaiting telemetry transmission...
                    </div>
                  )}
                </div>
              </div>

              {/* Response Block */}
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Server Response Payload</p>
                <div className="w-full h-52 bg-slate-950 border border-white/5 rounded-2xl p-3 overflow-y-auto font-mono text-[9px] text-indigo-300 space-y-2 shadow-inner">
                  {httpResponse ? (
                    <>
                      <pre className="text-slate-400 font-bold border-b border-white/5 pb-2 mb-2 select-all">{httpResponse.headers}</pre>
                      <pre className="text-indigo-400 font-semibold select-all">{httpResponse.body}</pre>
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-[10px] uppercase font-bold italic">
                      Awaiting response...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .wire-flow {
          stroke-dasharray: 6 4;
          animation: flow-pulse 1.8s linear infinite;
        }
        @keyframes flow-pulse {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
};

export default VirtualIoT;
