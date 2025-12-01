
import React from 'react';
import { Play, Trophy, Truck } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
  highScore: number;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm text-cyan-400">
      <div className="text-center mb-8 animate-pulse">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter neon-text mb-2 text-white" style={{ fontFamily: 'Orbitron' }}>
          NEON
          <span className="text-pink-500 neon-text-red ml-4">OUTRUN</span>
        </h1>
        <p className="text-sm md:text-lg tracking-widest uppercase opacity-80 mt-4">Cybernetic High-Speed Survival</p>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 p-8 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6 border-b border-cyan-900 pb-4">
          <span className="flex items-center gap-2 text-yellow-400">
            <Trophy className="w-5 h-5" /> BEST DIST
          </span>
          <span className="text-2xl font-bold">{(highScore / 1000).toFixed(2)} km</span>
        </div>

        <div className="space-y-4 mb-8 text-sm text-slate-300">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2"><Truck className="w-4 h-4"/> Transport Truck</span>
            <span className="text-red-400">-20 Energy</span>
          </div>
          <div className="flex justify-between items-center">
            <span>🌵 Cactus</span>
            <span className="text-red-400">-30 Energy</span>
          </div>
          <div className="flex justify-between items-center">
            <span>🚶 Jaywalker</span>
            <span className="text-red-400">-35 Energy</span>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full group relative px-8 py-4 bg-transparent overflow-hidden rounded-md border border-cyan-500 text-cyan-400 font-bold transition-all hover:bg-cyan-500 hover:text-black hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 w-0 bg-cyan-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
          <span className="relative flex items-center justify-center gap-3 text-xl tracking-widest">
            START ENGINE <Play className="w-5 h-5 fill-current" />
          </span>
        </button>
      </div>
      
      <div className="mt-8 text-xs text-slate-500 text-center">
        <p>CONTROLS</p>
        <p className="mt-1">Desktop: Arrow Keys / A-D (Tap to switch lanes)</p>
        <p>Mobile: Tap Left / Right sides to switch lanes</p>
      </div>
    </div>
  );
};

export default MainMenu;
