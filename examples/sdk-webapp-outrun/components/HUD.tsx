
import React from 'react';
import { Battery, Zap } from 'lucide-react';

interface HUDProps {
  energy: number;
  score: number;
}

const HUD: React.FC<HUDProps> = ({ energy, score }) => {
  // Color calculation for health bar
  let barColor = 'bg-cyan-500';
  if (energy < 50) barColor = 'bg-yellow-500';
  if (energy < 25) barColor = 'bg-red-500';

  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
      
      {/* Energy Gauge */}
      <div className="flex flex-col gap-1 w-1/3 max-w-[200px]">
        <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm neon-text">
          <Zap className="w-4 h-4 fill-current" /> Shield
        </div>
        <div className="h-4 w-full bg-slate-800/80 border border-slate-600 skew-x-[-10deg] overflow-hidden rounded-sm relative">
           {/* Grid pattern overlay */}
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')] opacity-20"></div>
          <div 
            className={`h-full ${barColor} transition-all duration-300 ease-out shadow-[0_0_10px_currentColor]`}
            style={{ width: `${Math.max(0, energy)}%` }}
          />
        </div>
        <div className="text-right text-xs text-slate-400 font-mono">{energy}/100</div>
      </div>

      {/* Score / Odometer */}
      <div className="flex flex-col items-end">
        <div className="text-pink-500 font-bold uppercase tracking-wider text-sm neon-text-red mb-1">
          Distance
        </div>
        <div className="text-4xl font-mono text-white font-black italic">
          {(score / 1000).toFixed(2)}<span className="text-lg opacity-50 not-italic">km</span>
        </div>
      </div>
    </div>
  );
};

export default HUD;
