
import React from 'react';
import { Battery, Zap, Gauge } from 'lucide-react';

interface HUDProps {
  energy: number;
  score: number;
  speed: number;
}

const HUD: React.FC<HUDProps> = ({ energy, score, speed }) => {
  // Color calculation for health bar
  let barColor = 'bg-cyan-500';
  if (energy < 50) barColor = 'bg-yellow-500';
  if (energy < 25) barColor = 'bg-red-500';

  // Speed color calculation
  let speedColor = 'text-green-400';
  if (speed > 400) speedColor = 'text-yellow-400';
  if (speed > 600) speedColor = 'text-red-400';

  return (
    <div
      className="absolute left-0 w-full p-4 pointer-events-none z-10"
      style={{
        top: 'var(--safe-area-top, 0px)'
      }}
    >
      {/* Left side - Unified Status Panel */}
      <div className="flex flex-col gap-3 w-fit min-w-[240px]">
        {/* Distance Display */}
        <div className="flex items-center justify-between gap-4">
          <span className="text-pink-500 font-bold uppercase tracking-wider text-sm neon-text-red drop-shadow-[0_0_8px_rgba(255,0,102,0.8)]">
            Distance
          </span>
          <div className="text-3xl font-mono text-white font-black italic drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {(score / 1000).toFixed(2)}<span className="text-sm opacity-70 not-italic ml-1">km</span>
          </div>
        </div>

        {/* Speed Display */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gauge className={`w-5 h-5 ${speedColor} drop-shadow-[0_0_6px_currentColor]`} />
            <span className="text-xs text-slate-300 uppercase tracking-wider drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">Speed</span>
          </div>
          <div className={`text-2xl font-mono font-black italic ${speedColor} transition-colors duration-200 drop-shadow-[0_0_10px_currentColor]`}>
            {Math.round(speed)}<span className="text-xs opacity-70 not-italic ml-1">km/h</span>
          </div>
        </div>

        {/* Energy Gauge */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-xs neon-text drop-shadow-[0_0_6px_rgba(0,255,255,0.8)]">
              <Zap className="w-4 h-4 fill-current" /> Shield
            </div>
            <span className="text-xs text-slate-300 font-mono drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]">{energy}/100</span>
          </div>
          <div className="h-3 w-full bg-slate-800/60 border border-slate-600/50 skew-x-[-10deg] overflow-hidden rounded-sm relative backdrop-blur-sm">
             {/* Grid pattern overlay */}
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-20"></div>
            <div 
              className={`h-full ${barColor} transition-all duration-300 ease-out shadow-[0_0_10px_currentColor]`}
              style={{ width: `${Math.max(0, energy)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
