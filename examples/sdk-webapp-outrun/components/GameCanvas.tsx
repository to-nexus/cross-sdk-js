import React, { useEffect, useRef } from 'react'

import type { IWebApp } from '@to-nexus/webapp'
import { Haptics } from '@to-nexus/webapp'

import { GameState, Obstacle, ObstacleType, Player } from '../types'

interface GameCanvasProps {
  gameState: GameState
  setEnergy: (energy: number) => void
  setScore: (score: number) => void
  onGameOver: () => void
  webApp?: IWebApp
}

interface SceneryObject {
  id: number
  type: 'PALM_TREE'
  x: number
  z: number
  scaleVar: number
  flip: boolean
}

type Renderable =
  | { type: 'OBSTACLE'; data: Obstacle; z: number }
  | { type: 'SCENERY'; data: SceneryObject; z: number }

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setEnergy,
  setScore,
  onGameOver,
  webApp
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Game Configuration Constants
  const SEGMENT_LENGTH = 200
  const RENDER_DISTANCE = 80
  const BASE_SPEED = 1500 // 증가: 1200 -> 1500
  const OBSTACLE_SPAWN_RATE_MS = 600 // 감소: 800 -> 600 (더 자주 등장)
  const SCENERY_SPAWN_RATE_MS = 100 // 감소: 150 -> 100
  // 3 distinct lanes: Left, Center, Right.
  // Coordinates are roughly -0.7, 0, 0.7 to fit trucks without overlap
  const LANES = [-0.7, 0, 0.7]

  // Refs
  const playerRef = useRef<Player>({ x: 0, lane: 1, speed: 0, maxSpeed: 1500, energy: 100 })
  const obstaclesRef = useRef<Obstacle[]>([])
  const sceneryRef = useRef<SceneryObject[]>([])

  const lastTimeRef = useRef<number>(0)
  const totalTimeRef = useRef<number>(0)
  const roadOffsetRef = useRef<number>(0)
  const lastSpawnTimeRef = useRef<number>(0)
  const lastScenerySpawnTimeRef = useRef<number>(0)
  const requestRef = useRef<number>(0)
  const isGameOverRef = useRef<boolean>(false)
  const prevGameStateRef = useRef<GameState>(GameState.MENU)

  // Input State
  // We use this to prevent holding down the key from cycling lanes too fast
  const keyStateRef = useRef<{ [key: string]: boolean }>({})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // --- HELPER FUNCTIONS ---

    const spawnObstacle = () => {
      // Pick a random lane: 0, 1, or 2
      const laneIndex = Math.floor(Math.random() * 3)
      const laneX = LANES[laneIndex]

      const r = Math.random()
      let type = ObstacleType.TRUCK
      let width = 170 // Narrower truck to fit in lane
      let height = 180
      let damage = 20

      if (r > 0.7) {
        type = ObstacleType.JAYWALKER
        width = 60
        height = 130
        damage = 35
      } else if (r > 0.4) {
        type = ObstacleType.CACTUS
        width = 80
        height = 100
        damage = 30
      }

      const obstacle: Obstacle = {
        id: Date.now() + Math.random(),
        type,
        x: laneX,
        z: RENDER_DISTANCE * SEGMENT_LENGTH, // Start far away
        width,
        height,
        damage,
        hit: false
      }

      obstaclesRef.current.push(obstacle)
    }

    const spawnScenery = () => {
      // Spawn palm trees on the far left or right
      const side = Math.random() > 0.5 ? 1 : -1
      // Position them well outside the road (road is -1 to 1, so go +/- 2.5 or more)
      const x = side * (2.5 + Math.random() * 2)

      const tree: SceneryObject = {
        id: Date.now() + Math.random(),
        type: 'PALM_TREE',
        x: x,
        z: RENDER_DISTANCE * SEGMENT_LENGTH,
        scaleVar: 0.9 + Math.random() * 0.2, // Slight size variation
        flip: Math.random() > 0.5
      }

      sceneryRef.current.push(tree)
    }

    const checkCollisions = () => {
      if (playerRef.current.energy <= 0) return

      // Player is at z=0 (camera position basically)
      // We check obstacles that are very close to z=0
      const playerLane = playerRef.current.lane
      const playerLaneX = LANES[playerLane]

      // Hitbox tolerance
      const hitZDepth = 200
      const laneTolerance = 0.3 // Strict lane checking

      obstaclesRef.current.forEach(obs => {
        if (!obs.hit && obs.z < hitZDepth && obs.z > -100) {
          // Check if obstacle is in the same lane roughly
          const distX = Math.abs(obs.x - playerRef.current.x)

          // Collision happens if we are close in X (same lane) and close in Z
          if (distX < laneTolerance) {
            obs.hit = true
            const newEnergy = Math.max(0, playerRef.current.energy - obs.damage)
            playerRef.current.energy = newEnergy // Update internal ref
            setEnergy(newEnergy) // Update UI

            // Haptic feedback on collision
            if (webApp) {
              if (newEnergy <= 0) {
                // Heavy impact for game over
                webApp.hapticFeedback(Haptics.impactHeavy)
              } else if (newEnergy < 25) {
                // Warning impact for low energy
                webApp.hapticFeedback(Haptics.notificationWarning)
              } else {
                // Medium impact for normal collision
                webApp.hapticFeedback(Haptics.impactMedium)
              }
            }

            // Screen shake or flash could go here
            if (newEnergy <= 0) {
              isGameOverRef.current = true
              onGameOver()
            }
          }
        }
      })
    }

    const handleInput = (key: string) => {
      if (gameState !== GameState.PLAYING) return

      const player = playerRef.current

      if (key === 'ArrowLeft' || key === 'a') {
        if (player.lane > 0) player.lane--
      } else if (key === 'ArrowRight' || key === 'd') {
        if (player.lane < 2) player.lane++
      }
    }

    // --- DRAWING FUNCTIONS ---

    const drawSun = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const sunY = height * 0.35 // Position on horizon
      const sunRadius = Math.min(width, height) * 0.25

      // Sun Gradient
      const gradient = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius)
      gradient.addColorStop(0, '#ffff00') // Yellow top
      gradient.addColorStop(0.5, '#ff00ff') // Pink middle
      gradient.addColorStop(1, '#9900ff') // Purple bottom

      ctx.save()
      ctx.fillStyle = gradient

      // Draw Sun with "Blinds" effect
      ctx.beginPath()
      ctx.arc(width / 2, sunY, sunRadius, 0, Math.PI * 2)
      ctx.fill()

      // Horizontal cuts for synthwave style
      ctx.fillStyle = '#0f172a' // Match background color
      const segmentHeight = sunRadius * 0.15
      for (let i = 0; i < 6; i++) {
        const y = sunY + i * segmentHeight * 1.5 - sunRadius * 0.2
        const h = segmentHeight * (0.3 + i * 0.1) // Cuts get thicker towards bottom
        if (y > sunY + sunRadius) break
        ctx.fillRect(width / 2 - sunRadius, y, sunRadius * 2, h)
      }

      // Glow
      ctx.shadowBlur = 40
      ctx.shadowColor = '#ff00ff'
      ctx.stroke() // trigger shadow
      ctx.restore()
    }

    const drawRoad = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      offset: number
    ) => {
      const horizonY = height * 0.4

      // Determine max visible road width
      // On mobile (narrow screen), we want the road to fill more of the width
      // On desktop (wide screen), we want the road to be centered with scenery on sides
      const maxRoadWidth = Math.min(width * 0.9, 800)

      ctx.save()

      // Draw Grid Floor (Landscape)
      ctx.fillStyle = '#1a0b2e' // Darker purple ground
      ctx.fillRect(0, horizonY, width, height - horizonY)

      // Moving vertical grid lines for landscape sensation
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.2)'
      ctx.lineWidth = 1
      const gridSpacing = width / 12
      const moveOffset = (offset * width) % gridSpacing

      ctx.beginPath()
      // Floor Grid - Horizontal lines
      for (let i = 0; i < 20; i++) {
        const y = horizonY + Math.pow(i / 20, 2) * (height - horizonY)
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      // Floor Grid - Vertical lines (Perspective)
      const vanishingPointX = width / 2
      for (let i = -10; i <= 10; i++) {
        const x = vanishingPointX + i * gridSpacing * 2
        ctx.moveTo(vanishingPointX, horizonY)
        ctx.lineTo(x, height)
      }
      ctx.stroke()

      // --- MAIN ROAD ---
      // We project the road as a trapezoid
      const roadBottomW = maxRoadWidth
      const roadTopW = 10 // Converges to point
      const roadCenterX = width / 2

      // Clip road area
      ctx.beginPath()
      ctx.moveTo(roadCenterX - roadTopW, horizonY)
      ctx.lineTo(roadCenterX + roadTopW, horizonY)
      ctx.lineTo(roadCenterX + roadBottomW / 2, height)
      ctx.lineTo(roadCenterX - roadBottomW / 2, height)
      ctx.closePath()
      ctx.fillStyle = '#000000' // Road color
      ctx.fill()
      ctx.clip() // Only draw road markings inside this area

      // Moving Horizontal Strips (Speed sensation)
      const stripHeight = (height - horizonY) / 20
      const speedOffset = (totalTimeRef.current * 8) % 1 // 0 to 1

      for (let i = 0; i < 30; i++) {
        // Perspective distribution: closer lines are further apart
        const perspective = Math.pow((i + speedOffset) / 30, 3)
        const y = horizonY + perspective * (height - horizonY)
        const nextY = horizonY + Math.pow((i + 1 + speedOffset) / 30, 3) * (height - horizonY)
        const h = Math.max(1, nextY - y)

        // Draw darker strip every other segment
        if (i % 2 === 0) {
          ctx.fillStyle = 'rgba(40, 40, 60, 0.5)'
          ctx.fillRect(0, y, width, h)
        }
      }

      // Lane Markers
      // We have 3 lanes, so we need dividing lines between them.
      // Lanes are roughly at -0.67, 0, 0.67
      // Dividers should be at -0.33 and 0.33 roughly
      const laneDividers = [-0.35, 0.35]

      ctx.lineWidth = 2 // Solid lines
      ctx.strokeStyle = '#00ffff' // Cyan lines

      laneDividers.forEach(laneX => {
        // Project line from horizon to bottom
        // x coordinate -1 to 1 mapped to screen
        const x1 = roadCenterX + laneX * roadTopW // Top x
        const y1 = horizonY
        const x2 = roadCenterX + laneX * (roadBottomW / 2) // Bottom x
        const y2 = height

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Side rails (Neon borders)
      ctx.lineWidth = 4
      ctx.strokeStyle = '#ff00ff' // Magenta rails
      ctx.beginPath()
      ctx.moveTo(roadCenterX - roadTopW, horizonY)
      ctx.lineTo(roadCenterX - roadBottomW / 2, height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(roadCenterX + roadTopW, horizonY)
      ctx.lineTo(roadCenterX + roadBottomW / 2, height)
      ctx.stroke()

      ctx.restore()
    }

    const drawPlayerCar = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      lanePos: number
    ) => {
      // lanePos is -1 to 1
      const maxRoadWidth = Math.min(width * 0.9, 800)
      const roadCenterX = width / 2

      // Calculate Car Position
      // Car stays at bottom 15% of screen
      const carY = height - 100
      // Map lanePos (-1 to 1) to screen X within road width
      const carX = roadCenterX + lanePos * (maxRoadWidth / 2)
      const carScale = 1.0

      ctx.save()
      ctx.translate(carX, carY)
      ctx.scale(carScale, carScale)

      // F40-inspired Retro Car
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath()
      ctx.ellipse(0, 30, 60, 20, 0, 0, Math.PI * 2)
      ctx.fill()

      // Main Body Red
      ctx.fillStyle = '#d00'
      ctx.fillRect(-50, -20, 100, 40)

      // Top (Cabin)
      ctx.fillStyle = '#900'
      ctx.fillRect(-35, -45, 70, 25)

      // Windshield
      ctx.fillStyle = '#111'
      ctx.fillRect(-32, -42, 64, 20)

      // Rear Wing (Spoiler) - Iconic F40 feature
      ctx.fillStyle = '#d00'
      ctx.fillRect(-52, -25, 104, 10) // Wing supports
      ctx.fillRect(-52, -35, 104, 8) // Top of wing

      // Tail Lights (4 circles)
      ctx.fillStyle = '#ff3333'
      ctx.shadowColor = '#ff0000'
      ctx.shadowBlur = 10
      ;[-30, -15, 15, 30].forEach(x => {
        ctx.beginPath()
        ctx.arc(x, -5, 5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Exhaust glow
      ctx.fillStyle = '#ffaa00'
      ctx.shadowColor = '#ffaa00'
      ctx.shadowBlur = 5
      ctx.fillRect(-10, 15, 5, 5)
      ctx.fillRect(5, 15, 5, 5)

      ctx.restore()
    }

    const drawTruck = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Truck Body
      ctx.fillStyle = '#334155' // Slate 700
      ctx.fillRect(-70, -140, 140, 140)

      // Truck Border
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.strokeRect(-70, -140, 140, 140)

      // Rear Door Line
      ctx.beginPath()
      ctx.moveTo(0, -140)
      ctx.lineTo(0, 0)
      ctx.stroke()

      // Tail Lights
      ctx.shadowBlur = 10
      ctx.shadowColor = '#ff0000'
      ctx.fillStyle = '#ef4444' // Red
      ctx.fillRect(-60, -20, 20, 10)
      ctx.fillRect(40, -20, 20, 10)

      // License Plate
      ctx.shadowBlur = 0
      ctx.fillStyle = '#facc15' // Yellow
      ctx.fillRect(-20, -15, 40, 10)

      // Wheels
      ctx.fillStyle = '#000'
      ctx.fillRect(-75, -20, 10, 25)
      ctx.fillRect(65, -20, 10, 25)

      ctx.restore()
    }

    const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      ctx.fillStyle = '#22c55e' // Green
      ctx.strokeStyle = '#052e16'
      ctx.lineWidth = 2

      // Main trunk
      ctx.fillRect(-10, -80, 20, 80)
      ctx.strokeRect(-10, -80, 20, 80)

      // Left arm
      ctx.fillRect(-30, -50, 20, 15)
      ctx.strokeRect(-30, -50, 20, 15)
      ctx.fillRect(-30, -70, 15, 20)
      ctx.strokeRect(-30, -70, 15, 20)

      // Right arm
      ctx.fillRect(10, -40, 20, 15)
      ctx.strokeRect(10, -40, 20, 15)
      ctx.fillRect(15, -60, 15, 20)
      ctx.strokeRect(15, -60, 15, 20)

      ctx.restore()
    }

    const drawJaywalker = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Stick figure style but neon
      ctx.strokeStyle = '#f472b6' // Pink
      ctx.lineWidth = 4
      ctx.shadowColor = '#f472b6'
      ctx.shadowBlur = 5

      // Head
      ctx.beginPath()
      ctx.arc(0, -60, 10, 0, Math.PI * 2)
      ctx.stroke()

      // Body
      ctx.beginPath()
      ctx.moveTo(0, -50)
      ctx.lineTo(0, -20)
      ctx.stroke()

      // Arms (Waving)
      const time = Date.now() / 100
      ctx.beginPath()
      ctx.moveTo(0, -40)
      ctx.lineTo(-15, -30 + Math.sin(time) * 10)
      ctx.moveTo(0, -40)
      ctx.lineTo(15, -30 - Math.sin(time) * 10)
      ctx.stroke()

      // Legs (Walking)
      ctx.beginPath()
      ctx.moveTo(0, -20)
      ctx.lineTo(-10, 0 + Math.cos(time) * 10)
      ctx.moveTo(0, -20)
      ctx.lineTo(10, 0 - Math.cos(time) * 10)
      ctx.stroke()

      ctx.restore()
    }

    const drawPalmTree = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      flip: boolean
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale * (flip ? -1 : 1), scale)

      // Trunk
      ctx.strokeStyle = '#a855f7' // Purple trunk
      ctx.lineWidth = 4
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur = 5

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(20, -50, 0, -150)
      ctx.stroke()

      // Leaves
      ctx.strokeStyle = '#22d3ee' // Cyan leaves
      ctx.lineWidth = 3
      ctx.shadowColor = '#22d3ee'
      ;[-20, 0, 20].forEach(angleOffset => {
        ctx.beginPath()
        ctx.moveTo(0, -150)
        ctx.quadraticCurveTo(angleOffset * 2, -180, angleOffset * 4, -130)
        ctx.stroke()
      })

      ctx.restore()
    }

    // --- GAME LOOP ---

    const render = (time: number) => {
      // Calculate delta time
      if (!lastTimeRef.current) lastTimeRef.current = time
      // Cap delta time to avoid huge jumps (max 50ms)
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = time

      // If paused, just request next frame but don't update/draw
      if (gameState === GameState.PAUSED) {
        requestRef.current = requestAnimationFrame(render)
        return
      }
      // If Game Over, stop loop but keep rendering
      if (gameState === GameState.GAME_OVER) {
        // Still render the game frozen state
        requestRef.current = requestAnimationFrame(render)
        return
      }

      // Handle Game Reset if transition from menu or from game over
      if (
        gameState === GameState.PLAYING &&
        (prevGameStateRef.current === GameState.MENU ||
          prevGameStateRef.current === GameState.GAME_OVER)
      ) {
        // Reset Logic
        obstaclesRef.current = []
        sceneryRef.current = []
        playerRef.current = { x: 0, lane: 1, speed: 0, maxSpeed: 1500, energy: 100 }
        totalTimeRef.current = 0
        setScore(0)
        setEnergy(100)
        isGameOverRef.current = false
        lastTimeRef.current = 0 // Reset delta time
        prevGameStateRef.current = GameState.PLAYING
      }

      if (gameState === GameState.PLAYING) {
        totalTimeRef.current += deltaTime
        setScore(totalTimeRef.current)

        // --- UPDATES ---

        // Smoothly interpolate actual X to target lane X
        const targetX = LANES[playerRef.current.lane]
        const lerpSpeed = 15 // Speed of lane changing
        playerRef.current.x += (targetX - playerRef.current.x) * lerpSpeed * deltaTime

        // Speed increases over time (더 빠르게 가속)
        playerRef.current.speed = Math.min(
          playerRef.current.maxSpeed + totalTimeRef.current * 20,
          2500
        )

        // Move Obstacles
        const moveDist = playerRef.current.speed * deltaTime
        obstaclesRef.current.forEach(obs => {
          obs.z -= moveDist
        })
        // Remove passed obstacles
        obstaclesRef.current = obstaclesRef.current.filter(obs => obs.z > -200)

        // Move Scenery
        sceneryRef.current.forEach(item => {
          item.z -= moveDist
        })
        sceneryRef.current = sceneryRef.current.filter(item => item.z > -200)

        // Spawn Obstacles
        if (time - lastSpawnTimeRef.current > OBSTACLE_SPAWN_RATE_MS) {
          spawnObstacle()
          lastSpawnTimeRef.current = time
        }

        // Spawn Scenery
        if (time - lastScenerySpawnTimeRef.current > SCENERY_SPAWN_RATE_MS) {
          spawnScenery()
          lastScenerySpawnTimeRef.current = time
        }

        checkCollisions()

        // Update Road Offset for curve illusion (optional, keeping it straight for now but moving grid)
        roadOffsetRef.current += (playerRef.current.speed / 1000) * deltaTime
      }

      // --- RENDER ---

      const width = canvas.width
      const height = canvas.height

      // Clear
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)

      // Sky / Sun
      drawSun(ctx, width, height)

      // Road
      drawRoad(ctx, width, height, roadOffsetRef.current)

      // Render Queue (Painter's Algorithm: Draw furthest first)
      const renderQueue: Renderable[] = [
        ...obstaclesRef.current.map(o => ({ type: 'OBSTACLE' as const, data: o, z: o.z })),
        ...sceneryRef.current.map(s => ({ type: 'SCENERY' as const, data: s, z: s.z }))
      ]

      renderQueue.sort((a, b) => b.z - a.z)

      const maxRoadWidth = Math.min(width * 0.9, 800)
      const roadCenterX = width / 2
      const roadTopW = 10
      const roadBottomW = maxRoadWidth
      const horizonY = height * 0.4
      const roadHeight = height - horizonY

      renderQueue.forEach(item => {
        // Perspective Projection
        // Scale = 1 / z (simplified)
        // We need to map Z (distance) to scale and Y position
        // Z=0 is at camera (bottom of screen), Z=Far is at horizon
        // Actually in this setup: Z decreases as it comes to player.
        // Let's assume Z goes from RENDER_DISTANCE * SEGMENT_LENGTH down to 0.

        // Standard pseudo-3D projection:
        // scale = camera_height / (z - camera_z)
        const camHeight = 1000
        const scale = camHeight / (item.z + camHeight) // Simple projection

        const projectedY = horizonY + scale * roadHeight * 0.15 // Adjust multiplier to place on road
        // Wait, simpler approach for "flat" road:
        // Y is proportional to Z.
        // 0 -> bottom (height), Max -> Horizon (horizonY)
        // Actually, Scale is the key.
        // ScreenY = HorizonY + Scale * (CameraHeight)

        // Let's use a linear mapping for Z to Y for the "ground" plane effect combined with scale
        // Z is large -> Scale small -> Close to horizon
        // Z is small -> Scale large -> Close to bottom

        // Fix projection math for flat pseudo-3D
        // scale = 1 / (z_factor)
        const projScale = 20000 / (item.z + 2000) // Tweak these magic numbers for FOV

        const itemScreenY = horizonY + projScale * (height - horizonY) * 0.1
        // This math is tricky without a full engine.
        // Let's use the standard "Track" math:
        // y = height - (z / maxZ) * (height - horizon) -> No, that's linear.
        // y should condense near horizon.

        // Recalculate based on simple perspective:
        // y = (y_world / z) + center_y.
        // Here ground is y_world = constant relative to camera.

        const groundY = height
        const renderY = horizonY + (groundY - horizonY) / (item.z / 2000 + 1)
        const renderScale = 1 / (item.z / 2000 + 1)

        // Calculate X
        // object x is -1 to 1 relative to road width at that Z
        // Road width at that Z is determined by projection
        const currentRoadHalfWidth = (roadBottomW / 2) * renderScale

        let renderX = roadCenterX + item.data.x * currentRoadHalfWidth

        // Scenery is placed outside road
        if (item.type === 'SCENERY') {
          // Scenery X is absolute relative to road center, scaled
          // item.data.x is e.g. 2.0 (2x road width from center)
          renderX = roadCenterX + item.data.x * (roadBottomW / 2) * renderScale
        }

        if (item.type === 'OBSTACLE') {
          const obs = item.data as Obstacle
          if (obs.hit) return // Don't draw hit obstacles? or draw them flashing?

          if (obs.type === ObstacleType.TRUCK) {
            drawTruck(ctx, renderX, renderY, renderScale)
          } else if (obs.type === ObstacleType.CACTUS) {
            drawCactus(ctx, renderX, renderY, renderScale)
          } else if (obs.type === ObstacleType.JAYWALKER) {
            drawJaywalker(ctx, renderX, renderY, renderScale)
          }
        } else {
          const scenery = item.data as SceneryObject
          drawPalmTree(ctx, renderX, renderY, renderScale, scenery.flip)
        }
      })

      // Player
      // We render player "on top" visually, but mathematically they are at Z=0
      drawPlayerCar(ctx, width, height, playerRef.current.x)

      // Update previous game state for next frame
      prevGameStateRef.current = gameState

      requestRef.current = requestAnimationFrame(render)
    }

    // Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent holding key to scroll lanes rapidly
      if (keyStateRef.current[e.key]) return

      keyStateRef.current[e.key] = true
      handleInput(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keyStateRef.current[e.key] = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX
      const screenHalf = window.innerWidth / 2

      if (touchX < screenHalf) {
        handleInput('ArrowLeft')
      } else {
        handleInput('ArrowRight')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('touchstart', handleTouchStart)

    requestRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, setEnergy, setScore, onGameOver])

  // Adjust canvas size
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return <canvas ref={canvasRef} className="block w-full h-full" />
}

export default GameCanvas
