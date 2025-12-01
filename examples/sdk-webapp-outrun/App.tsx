
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import MainMenu from './components/MainMenu';
import GameOver from './components/GameOver';
import PauseMenu from './components/PauseMenu';
import { GameState, ScoreRecord } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [energy, setEnergy] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([]);

  // Load leaderboard on mount
  useEffect(() => {
    const saved = localStorage.getItem('neon-outrun-leaderboard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Simple migration check: if old data has timeSurvived but no distance, map it
        const migrated = parsed.map((record: any) => ({
          date: record.date,
          distance: record.distance !== undefined ? record.distance : (record.timeSurvived || 0) * 100 // Approximation for legacy
        }));
        setLeaderboard(migrated);
      } catch (e) {
        console.error("Failed to load leaderboard", e);
      }
    }
  }, []);

  // Handle Window Focus/Blur for auto-pause
  useEffect(() => {
    const handleBlur = () => {
      if (gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  const handleStart = () => {
    setGameState(GameState.PLAYING);
  };

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
    
    // Update Leaderboard with DISTANCE
    const newRecord: ScoreRecord = {
      date: new Date().toISOString(),
      distance: score
    };
    
    const newLeaderboard = [...leaderboard, newRecord]
      .sort((a, b) => b.distance - a.distance)
      .slice(0, 10); // Keep top 10

    setLeaderboard(newLeaderboard);
    localStorage.setItem('neon-outrun-leaderboard', JSON.stringify(newLeaderboard));
  };

  const handleRestart = () => {
    // Go back to Main Menu instead of restarting immediately
    setGameState(GameState.MENU);
  };

  const handleResume = () => {
    setGameState(GameState.PLAYING);
  }

  const getBestScore = () => {
    if (leaderboard.length === 0) return 0;
    return leaderboard[0].distance;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {/* Background Music / Sound Effects could be mounted here */}

      {/* Game Layer */}
      <GameCanvas 
        gameState={gameState} 
        setEnergy={setEnergy} 
        setScore={setScore}
        onGameOver={handleGameOver}
      />

      {/* UI Overlay Layer */}
      {gameState === GameState.PLAYING && (
        <HUD energy={energy} score={score} />
      )}

      {gameState === GameState.MENU && (
        <MainMenu onStart={handleStart} highScore={getBestScore()} />
      )}

      {gameState === GameState.PAUSED && (
        <PauseMenu onResume={handleResume} />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOver 
          score={score} 
          onRestart={handleRestart} 
          leaderboard={leaderboard} 
        />
      )}
      
      {/* Scanline Effect Overlay for that CRT feel */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[url('https://media.istockphoto.com/id/175432655/photo/close-up-of-a-crt-monitor.jpg?s=1024x1024&w=is&k=20&c=KdkXUu7Y4xN1Pdx_lK9s0_2rP9z55_7k6_3z3_1_1')] bg-cover mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
    </div>
  );
};

export default App;
