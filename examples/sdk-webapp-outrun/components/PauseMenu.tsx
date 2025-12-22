import React from 'react';
import { Play, Pause } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
}

const PauseMenu: React.FC<PauseMenuProps> = ({ onResume }) => {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30 backdrop-blur-sm"
      style={{
        paddingTop: 'var(--safe-area-top, 0px)',
        paddingBottom: 'var(--safe-area-bottom, 0px)',
        paddingLeft: 'var(--safe-area-left, 0px)',
        paddingRight: 'var(--safe-area-right, 0px)'
      }}
    >
      <div className="bg-slate-900/90 border border-cyan-500/50 p-8 rounded-lg shadow-[0_0_30px_rgba(34,211,238,0.2)] max-w-sm w-full mx-4 text-center">
        <h2 className="text-4xl font-black text-white italic tracking-tighter neon-text mb-2" style={{ fontFamily: 'Orbitron' }}>
          PAUSED
        </h2>
        <p className="text-cyan-200/70 mb-8 text-sm uppercase tracking-widest">System Halted</p>

        <button
          onClick={onResume}
          className="w-full group relative px-8 py-4 bg-transparent overflow-hidden rounded-md border border-cyan-500 text-cyan-400 font-bold transition-all hover:bg-cyan-500 hover:text-black hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 w-0 bg-cyan-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
          <span className="relative flex items-center justify-center gap-3 text-xl tracking-widest">
            RESUME <Play className="w-5 h-5 fill-current" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default PauseMenu;
