import React, { useEffect, useState } from 'react'

import { useAppKit, useAppKitState, useDisconnect } from '@to-nexus/sdk/react'
import { LogOut, Play, Trophy, Truck, Wallet } from 'lucide-react'

interface MainMenuProps {
  onStart: () => void
  highScore: number
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, highScore }) => {
  // SDK hooks - useAppKitAccount 대신 useAppKitState 사용
  const appKit = useAppKit()
  const state = useAppKitState()
  const { disconnect } = useDisconnect()

  // state에서 연결 정보 추출 (안전하게)
  const isConnected = state?.open === false && state?.selectedNetworkId !== undefined
  const [accountInfo, setAccountInfo] = useState<{ address?: string; networkName?: string } | null>(
    null
  )

  // AccountController와 ChainController에서 직접 정보 가져오기
  useEffect(() => {
    if (!isConnected) return

    // AccountController와 ChainController를 동적으로 가져와서 사용
    import('@to-nexus/sdk/react').then(({ AccountController, ChainController }) => {
      const account = AccountController.state
      const chain = ChainController.state
      if (account.address) {
        setAccountInfo({
          address: account.address,
          networkName: chain.activeCaipNetwork?.name || 'Unknown Network'
        })
      }
    })
  }, [isConnected])

  const handleStartClick = () => {
    if (isConnected) {
      onStart()
    }
  }

  const handleConnect = () => {
    // AppKit 연결 모달 열기
    if (appKit) {
      appKit.connect('cross_wallet')
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setAccountInfo(null)
    } catch (e) {
      console.error('Disconnect error:', e)
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm text-cyan-400">
      <div className="text-center mb-8 animate-pulse">
        <h1
          className="text-6xl md:text-8xl font-black italic tracking-tighter neon-text mb-2 text-white"
          style={{ fontFamily: 'Orbitron' }}
        >
          NEON
          <span className="text-pink-500 neon-text-red ml-4">OUTRUN</span>
        </h1>
        <p className="text-sm md:text-lg tracking-widest uppercase opacity-80 mt-4">
          Cybernetic High-Speed Survival
        </p>
      </div>

      <div className="bg-slate-900/90 border border-cyan-500/30 p-8 rounded-lg shadow-[0_0_50px_rgba(0,255,255,0.1)] max-w-md w-full mx-4">
        {/* Wallet Connection Section - CROSS Wallet Only */}
        <div className="mb-6 pb-6 border-b border-cyan-900">
          {isConnected && accountInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-400">
                <Wallet className="w-5 h-5" />
                <span className="text-sm font-semibold">Connected to CROSSx</span>
              </div>
              <div className="bg-slate-800/50 p-3 rounded border border-green-500/30 space-y-2">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
                  <p className="text-sm font-mono text-green-400 break-all">
                    {accountInfo.address?.slice(0, 6)}...{accountInfo.address?.slice(-4)}
                  </p>
                </div>
                {accountInfo.networkName && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Network</p>
                    <p className="text-sm text-green-300 font-semibold">
                      {accountInfo.networkName}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full px-3 py-2 text-xs bg-slate-800 border border-red-500/30 text-red-400 rounded hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleConnect}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-md transition-all flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                Connect CROSSx Wallet
              </button>
              <p className="text-xs text-slate-400 text-center">
                Connect with CROSS Extension or QR Code to start playing
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6 border-b border-cyan-900 pb-4">
          <span className="flex items-center gap-2 text-yellow-400">
            <Trophy className="w-5 h-5" /> BEST DIST
          </span>
          <span className="text-2xl font-bold">{(highScore / 1000).toFixed(2)} km</span>
        </div>

        <div className="space-y-4 mb-8 text-sm text-slate-300">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4" /> Transport Truck
            </span>
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
          onClick={handleStartClick}
          disabled={!isConnected}
          className="w-full group relative px-8 py-4 bg-transparent overflow-hidden rounded-md border border-cyan-500 text-cyan-400 font-bold transition-all hover:bg-cyan-500 hover:text-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="absolute inset-0 w-0 bg-cyan-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-10"></div>
          <span className="relative flex items-center justify-center gap-3 text-xl tracking-widest">
            {!isConnected ? (
              'CONNECT WALLET FIRST'
            ) : (
              <>
                START ENGINE <Play className="w-5 h-5 fill-current" />
              </>
            )}
          </span>
        </button>
      </div>

      <div className="mt-8 text-xs text-slate-500 text-center">
        <p>CONTROLS</p>
        <p className="mt-1">Desktop: Arrow Keys / A-D (Tap to switch lanes)</p>
        <p>Mobile: Tap Left / Right sides to switch lanes</p>
      </div>
    </div>
  )
}

export default MainMenu
