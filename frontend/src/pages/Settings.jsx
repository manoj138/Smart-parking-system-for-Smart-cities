import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw, Cpu, HelpCircle, CheckCircle, Volume2 } from 'lucide-react';
import { speakText } from '../utils/speech';

const Settings = () => {
  const [rate, setRate] = useState(20);
  const [simulatorActive, setSimulatorActive] = useState(true);
  const [simulationInterval, setSimulationInterval] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceGender, setVoiceGender] = useState('female');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      const data = await res.json();
      
      setRate(data.rate_per_hour);
      setSimulatorActive(data.simulator_active);
      setSimulationInterval(data.simulation_interval);

      // Load voice settings from localStorage
      const vEnabled = localStorage.getItem('smart_parking_voice_enabled') !== 'false';
      const vGender = localStorage.getItem('smart_parking_voice_gender') || 'female';
      setVoiceEnabled(vEnabled);
      setVoiceGender(vGender);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    try {
      // Save voice settings to localStorage
      localStorage.setItem('smart_parking_voice_enabled', voiceEnabled.toString());
      localStorage.setItem('smart_parking_voice_gender', voiceGender);

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rate_per_hour: parseFloat(rate),
          simulator_active: simulatorActive,
          simulation_interval: parseInt(simulationInterval)
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('System configurations updated successfully.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(data.message || 'Update failed.');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to connect to configurations api.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = () => {
    // Temporarily save options to localStorage so speakText works immediately on click
    localStorage.setItem('smart_parking_voice_enabled', voiceEnabled.toString());
    localStorage.setItem('smart_parking_voice_gender', voiceGender);
    speakText("Welcome to the Smart Parking System. This is a voice announcement test.");
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Syncing system flags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Settings Panel</h2>
        <p className="text-sm text-slate-400 mt-1">Configure pricing scales, loop sensors, and background simulation speeds.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/25 flex items-center gap-3 text-success-500 text-xs font-semibold slot-enter">
          <CheckCircle size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl space-y-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-2">
          <SettingsIcon size={18} className="text-indigo-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">System Settings</h4>
        </div>

        {/* Hourly Rate */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Parking Tariff Rate (₹/hr)</label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">₹</span>
            <input 
              type="number"
              min="0"
              step="1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-32 px-3 py-2 rounded-xl glass-input text-xs font-bold"
              required
            />
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">Adjusts base pricing rates applied upon checkout. Changing this value does not alter current historical logs.</p>
        </div>

        {/* Simulator Toggle */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Background IoT Simulation</label>
              <p className="text-[10px] text-slate-500 mt-1">Simulate physical vehicle entries and exits on sensor loops automatically.</p>
            </div>
            
            {/* Toggle switch */}
            <button
              type="button"
              onClick={() => setSimulatorActive(!simulatorActive)}
              className={`
                w-12 h-6 rounded-full p-1 transition-all duration-300 outline-none
                ${simulatorActive ? 'bg-indigo-600' : 'bg-slate-800 border border-white/5'}
              `}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${simulatorActive ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Simulator Speed */}
        {simulatorActive && (
          <div className="space-y-2 pt-4 border-t border-white/5 slot-enter">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Simulation Interval (Seconds)</label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                min="3"
                max="300"
                value={simulationInterval}
                onChange={(e) => setSimulationInterval(e.target.value)}
                className="w-32 px-3 py-2 rounded-xl glass-input text-xs font-bold"
                required
              />
              <span className="text-xs text-slate-500 font-semibold">Seconds</span>
            </div>
            <p className="text-[10px] text-slate-500">Determines how fast the daemon thread triggers vehicle check-ins and check-outs. Minimum: 3 seconds.</p>
          </div>
        )}

        {/* Voice Announcements Settings */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Voice Announcements</label>
              <p className="text-[10px] text-slate-500 mt-1">Enable vocal assistance for gate authorizations, parking warnings, and check-outs.</p>
            </div>
            
            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`
                w-12 h-6 rounded-full p-1 transition-all duration-300 outline-none
                ${voiceEnabled ? 'bg-indigo-600' : 'bg-slate-800 border border-white/5'}
              `}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${voiceEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {voiceEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 slot-enter">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Announcer Voice</label>
                <select
                  value={voiceGender}
                  onChange={(e) => setVoiceGender(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold text-white bg-slate-900 border border-white/5"
                >
                  <option value="female">Female Announcer (Recommended)</option>
                  <option value="male">Male Announcer (Professional)</option>
                  <option value="default">System Default Voice</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 hover:border-white/10 font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2"
                >
                  <Volume2 size={14} className="text-indigo-400" />
                  <span>Test Voice</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-white/5 flex">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Save size={14} />
                <span>Save configurations</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
