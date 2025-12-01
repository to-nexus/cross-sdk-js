import React, { useEffect, useState } from 'react'

import CROSSxWebApp, { type IWebApp } from '@to-nexus/webapp'

import GameCanvas from './components/GameCanvas'
import GameOver from './components/GameOver'
import HUD from './components/HUD'
import MainMenu from './components/MainMenu'
import PauseMenu from './components/PauseMenu'
import { GameState, ScoreRecord } from './types'

interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU)
  const [energy, setEnergy] = useState<number>(100)
  const [score, setScore] = useState<number>(0)
  const [leaderboard, setLeaderboard] = useState<ScoreRecord[]>([])
  const [webApp, setWebApp] = useState<IWebApp | null>(null)
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  })

  // Initialize WebApp and request fullscreen
  useEffect(() => {
    try {
      // Initialize WebApp
      const app = CROSSxWebApp
      setWebApp(app)

      // Request fullscreen
      app.requestFullScreen({ isExpandSafeArea: true })

      // Notify WebApp that app is ready
      app.ready()

      // Get safe area insets
      app
        .getSafeAreaInsets()
        .then(insets => {
          setSafeAreaInsets(insets)
          console.log('[Outrun] Safe area insets:', insets)
        })
        .catch(error => {
          console.error('[Outrun] Error getting safe area insets:', error)
        })

      // Handle view closed event
      app.on('viewClosed', () => {
        console.log('[Outrun] View closed')
        setGameState(GameState.MENU)
      })

      // Handle view backgrounded event
      app.on('viewBackgrounded', () => {
        console.log('[Outrun] View backgrounded')
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.PAUSED)
        }
      })

      console.log('[Outrun] WebApp initialized successfully')
      console.log('[Outrun] WebApp version:', app.version)
    } catch (error) {
      console.error('[Outrun] Failed to initialize WebApp:', error)
    }
  }, [])

  // Load leaderboard on mount
  useEffect(() => {
    const saved = localStorage.getItem('neon-outrun-leaderboard')
    if (saved) {
      setLeaderboard(JSON.parse(saved))
    }
  }, [])

  // Handle Window Focus/Blur for auto-pause
  useEffect(() => {
    const handleBlur = () => {
      if (gameState === GameState.PLAYING) {
        setGameState(GameState.PAUSED)
      }
    }

    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('blur', handleBlur)
    }
  }, [gameState])

  const handleStart = () => {
    setGameState(GameState.PLAYING)
  }

  const handleMenu = () => {
    setGameState(GameState.MENU)
  }

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER)

    // Update Leaderboard
    const newRecord: ScoreRecord = {
      date: new Date().toISOString(),
      timeSurvived: score
    }

    const newLeaderboard = [...leaderboard, newRecord]
      .sort((a, b) => b.timeSurvived - a.timeSurvived)
      .slice(0, 10) // Keep top 10

    setLeaderboard(newLeaderboard)
    localStorage.setItem('neon-outrun-leaderboard', JSON.stringify(newLeaderboard))
  }

  const handleRestart = () => {
    setGameState(GameState.PLAYING)
  }

  const handleResume = () => {
    setGameState(GameState.PLAYING)
  }

  const getBestScore = () => {
    if (leaderboard.length === 0) return 0
    return leaderboard[0].timeSurvived
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
        webApp={webApp}
      />

      {/* UI Overlay Layer */}
      {gameState === GameState.PLAYING && (
        <HUD energy={energy} score={score} safeAreaInsets={safeAreaInsets} />
      )}

      {gameState === GameState.MENU && (
        <MainMenu onStart={handleStart} highScore={getBestScore()} />
      )}

      {gameState === GameState.PAUSED && <PauseMenu onResume={handleResume} />}

      {gameState === GameState.GAME_OVER && (
        <GameOver
          score={score}
          onRestart={handleRestart}
          onMenu={handleMenu}
          leaderboard={leaderboard}
        />
      )}

      {/* Scanline Effect Overlay for that CRT feel */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-10 bg-[url('https://media.istockphoto.com/id/175432655/photo/close-up-of-a-crt-monitor.jpg?s=1024x1024&w=is&k=20&c=KdkXUu7Y4xN1Pdx_lK9s0_2rP9z55_7k6_3z3_1_1')] bg-cover mix-blend-overlay"></div>
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>
    </div>
  )
}

export default App
