import React, { useState } from 'react';
import AnimatedNumber from './AnimatedNumber';

const MetricCard = ({ title, value, icon: Icon, subtext, color = 'indigo', index = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    indigo: {
      text: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/10 hover:border-indigo-500/30',
      glow: 'shadow-indigo-600/5',
      hoverGlow: 'hover:shadow-indigo-500/20',
      ringColor: 'rgba(99,102,241,0.6)',
      pulse: '#6366F1'
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/10 hover:border-emerald-500/30',
      glow: 'shadow-emerald-600/5',
      hoverGlow: 'hover:shadow-emerald-500/20',
      ringColor: 'rgba(16,185,129,0.6)',
      pulse: '#10B981'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/10 hover:border-rose-500/30',
      glow: 'shadow-rose-600/5',
      hoverGlow: 'hover:shadow-rose-500/20',
      ringColor: 'rgba(244,63,94,0.6)',
      pulse: '#F43F5E'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/10 hover:border-amber-500/30',
      glow: 'shadow-amber-600/5',
      hoverGlow: 'hover:shadow-amber-500/20',
      ringColor: 'rgba(245,158,11,0.6)',
      pulse: '#F59E0B'
    }
  };

  const theme = colorMap[color] || colorMap.indigo;
  const delay = `${index * 0.08}s`;

  return (
    <div
      className={`
        glass-card p-6 rounded-2xl shadow-xl flex items-center justify-between border
        ${theme.border} ${theme.glow} ${theme.hoverGlow}
        animate-slide-up hover:shadow-lg
        transition-all duration-300 cursor-default select-none
      `}
      style={{ animationDelay: delay, animationFillMode: 'both' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left: text content */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">{title}</p>
        <h3 className={`text-2xl font-bold text-white tracking-tight ${theme.text} transition-all duration-300`}
          style={{ textShadow: isHovered ? `0 0 20px ${theme.pulse}55` : 'none' }}
        >
          <AnimatedNumber value={value} />
        </h3>
        {subtext && (
          <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
            {/* Live dot */}
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-live-dot"
              style={{ backgroundColor: theme.pulse, flexShrink: 0 }}
            />
            {subtext}
          </p>
        )}
      </div>

      {/* Right: floating icon */}
      <div
        className={`
          relative w-13 h-13 rounded-xl ${theme.bg} flex items-center justify-center
          ${theme.text} border border-white/5 shadow-inner p-3
          transition-transform duration-300
        `}
        style={{
          transform: isHovered ? 'translateY(-6px) scale(1.08)' : 'translateY(0) scale(1)',
          boxShadow: isHovered ? `0 8px 24px -8px ${theme.pulse}60` : undefined
        }}
      >
        {/* Pulse ring on hover */}
        {isHovered && (
          <span
            className="absolute inset-0 rounded-xl animate-ping opacity-20"
            style={{ backgroundColor: theme.pulse }}
          />
        )}
        <Icon size={22} className={isHovered ? 'animate-float' : ''} />
      </div>

      {/* Bottom shimmer line on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl transition-all duration-500"
        style={{
          background: isHovered
            ? `linear-gradient(90deg, transparent, ${theme.pulse}88, transparent)`
            : 'transparent'
        }}
      />
    </div>
  );
};

export default MetricCard;
