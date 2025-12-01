import React from 'react'

import { AlertTriangle, Home, RotateCcw } from 'lucide-react'

import { ScoreRecord } from '../types'

interface GameOverProps {
  score: number
  onRestart: () => void
  onMenu: () => void
  leaderboard: ScoreRecord[]
}

const GameOver: React.FC<GameOverProps> = ({ score, onRestart, onMenu, leaderboard }) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 z-30 backdrop-blur-md">
      <div className="text-center mb-8">
        <h2
          className="text-6xl font-black text-white italic tracking-tighter neon-text-red mb-2"
          style={{ fontFamily: 'Orbitron' }}
        >
          SYSTEM FAILURE
        </h2>
        <div className="flex items-center justify-center gap-2 text-red-200 text-xl">
          <AlertTriangle /> ENERGY DEPLETED <AlertTriangle />
        </div>
      </div>

      <div className="bg-black/80 border border-red-500 p-6 rounded-lg w-full max-w-md mx-4 shadow-2xl">
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Survival Time</p>
          <p className="text-5xl font-bold text-white">{score.toFixed(2)}s</p>
        </div>

        <div className="mb-6">
          <h3 className="text-cyan-400 border-b border-cyan-900 pb-2 mb-3 text-sm font-bold uppercase tracking-wider">
            Recent Logs
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {leaderboard.slice(0, 5).map((record, idx) => (
              <div key={idx} className="flex justify-between text-sm text-slate-300 font-mono">
                <span>
                  {idx + 1}. {new Date(record.date).toLocaleDateString()}
                </span>
                <span className={idx === 0 ? 'text-yellow-400 font-bold' : ''}>
                  {record.timeSurvived.toFixed(2)}s
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 flex flex-col gap-3">
          {/* <button
            onClick={onRestart}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-8 rounded transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> REBOOT SYSTEM
          </button> */}
          <button
            onClick={onMenu}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameOver
