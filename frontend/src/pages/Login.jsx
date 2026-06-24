import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, Mail, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    
    if (!result.success) {
      setError(result.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Animated Moving Grid Background */}
      <div className="absolute inset-0 animate-bg-grid opacity-100 pointer-events-none" />

      {/* Floating Neon Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl animate-float-slow" />

      {/* Floating particles */}
      {[
        { top: '10%', left: '8%',  size: 3, dur: '8s',  delay: '0s' },
        { top: '80%', left: '90%', size: 4, dur: '10s', delay: '1s' },
        { top: '40%', left: '92%', size: 2, dur: '7s',  delay: '2s' },
        { top: '65%', left: '6%',  size: 3, dur: '9s',  delay: '0.5s' },
        { top: '25%', left: '50%', size: 2, dur: '12s', delay: '3s' },
      ].map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-indigo-400/30 animate-particle pointer-events-none"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size, '--duration': p.dur, animationDelay: p.delay, filter: 'blur(1px)' }}
        />
      ))}

      {/* Login Card Container */}
      <div
        className="w-full max-w-md p-8 rounded-3xl glass-panel border border-white/10 shadow-2xl relative z-10 mx-4 animate-slide-up"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="text-center mb-8 animate-scale-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl mx-auto mb-4 animate-float relative overflow-hidden">
            <img src="/logo.png" alt="Smart Parking Logo" className="w-full h-full object-cover" />
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl border border-indigo-400/30 animate-ping opacity-20" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight uppercase animate-gradient-text">
            Smart Parking
          </h2>
          <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-live-dot inline-block" />
            Smart Cities Gateway
          </p>
          <p className="text-sm text-slate-400 mt-3 font-medium">Welcome back! Sign in to manage parking nodes.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger-500/10 border border-danger-500/25 flex items-start gap-3 text-danger-500 text-xs font-semibold animate-slide-up">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2 animate-slide-up stagger-2" style={{ animationFillMode: 'both' }}>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Username or Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-500 z-10" size={18} />
              <input 
                type="text"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2 animate-slide-up stagger-3" style={{ animationFillMode: 'both' }}>
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Forgot Password?</a>
            </div>
            <div className="relative">
              <Key className="absolute left-4 top-3.5 text-slate-500 z-10" size={18} />
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl glass-input text-sm"
                required
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between animate-slide-up stagger-4" style={{ animationFillMode: 'both' }}>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500/50 focus:ring-offset-0 focus:ring-2"
              />
              <span className="text-xs font-medium text-slate-400 hover:text-slate-300">Remember me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-shimmer w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-indigo-600/35 hover:shadow-indigo-500/40 border border-indigo-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed animate-slide-up stagger-5"
            style={{ animationFillMode: 'both' }}
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <Sparkles size={15} className="text-indigo-200" />
                <span>Log In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Hint */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center animate-slide-up stagger-6" style={{ animationFillMode: 'both' }}>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Demo Credentials: <span className="text-indigo-400 font-mono select-all">admin</span> / <span className="text-indigo-400 font-mono select-all">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
