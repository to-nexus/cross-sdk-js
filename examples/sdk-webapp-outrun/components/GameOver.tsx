
import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { ScoreRecord } from '../types';

interface GameOverProps {
  score: number;
  onRestart: () => void;
  leaderboard: ScoreRecord[];
}

const GameOver: React.FC<GameOverProps> = ({ score, onRestart, leaderboard }) => {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 z-30 backdrop-blur-md"
      style={{
        paddingTop: 'var(--safe-area-top, 0px)',
        paddingBottom: 'var(--safe-area-bottom, 0px)',
        paddingLeft: 'var(--safe-area-left, 0px)',
        paddingRight: 'var(--safe-area-right, 0px)'
      }}
    >
      <div className="text-center mb-8">
        <h2 className="text-6xl font-black text-white italic tracking-tighter neon-text-red mb-2" style={{ fontFamily: 'Orbitron' }}>
          SYSTEM FAILURE
        </h2>
        <div className="flex items-center justify-center gap-2 text-red-200 text-xl">
          <AlertTriangle /> ENERGY DEPLETED <AlertTriangle />
        </div>
      </div>

      <div className="bg-black/80 border border-red-500 p-6 rounded-lg w-full max-w-md mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Total Distance</p>
          <p className="text-5xl font-bold text-white">{(score / 1000).toFixed(2)} km</p>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 border-b border-cyan-900 pb-2 mb-3 text-sm font-bold uppercase tracking-wider">
            Recent Logs
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {leaderboard.slice(0, 5).map((record, idx) => (
              <div key={idx} className="flex justify-between text-sm text-slate-300 font-mono">
                <span>{idx + 1}. {new Date(record.date).toLocaleDateString()}</span>
                <span className={idx === 0 ? "text-yellow-400 font-bold" : ""}>
                  {(record.distance / 1000).toFixed(2)} km
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> REBOOT SYSTEM
        </button>
      </div>
    </div>
  );
};

export default GameOver;
