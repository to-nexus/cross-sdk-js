import React, { useEffect, useRef } from 'react'

import { CROSSxWebApp, Haptics } from '@to-nexus/webapp'

import { GameState, Obstacle, ObstacleType, Player } from '../types'

interface GameCanvasProps {
  gameState: GameState
  setEnergy: (energy: number) => void
  setScore: (score: number) => void
  setSpeed: (speed: number) => void
  onGameOver: () => void
}

interface SceneryObject {
  id: number
  type: 'PALM_TREE'
  x: number
  z: number
  scaleVar: number
  flip: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  gravity: number
  grow: boolean
}

type Renderable =
  | { type: 'OBSTACLE'; data: Obstacle; z: number }
  | { type: 'SCENERY'; data: SceneryObject; z: number }

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  setEnergy,
  setScore,
  setSpeed,
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Game Configuration Constants
  const SEGMENT_LENGTH = 200
  const RENDER_DISTANCE = 80
  const OBSTACLE_SPAWN_RATE_MS = 800
  const BOOST_DISTANCE_THRESHOLD = 1000 // Boost every 1km without collision

  // 3 equal lanes
  const LANES = [-2 / 3, 0, 2 / 3]

  // Refs
  const playerRef = useRef<Player>({ x: 0, lane: 1, speed: 0, maxSpeed: 12000, energy: 100 })
  const obstaclesRef = useRef<Obstacle[]>([])
  const sceneryRef = useRef<SceneryObject[]>([])
  const particlesRef = useRef<Particle[]>([]) // Particles for explosion/smoke

  // Car sprite image ref
  const carSpriteRef = useRef<HTMLImageElement | null>(null)
  const carSpriteLoadedRef = useRef<boolean>(false)
  const selectedCarRef = useRef<number>(0) // 0: red F40, 1: blue DeLorean, 2: purple Lambo, 3: cyan Porsche

  const lastTimeRef = useRef<number>(0)
  const totalDistanceRef = useRef<number>(0)
  const distanceSinceLastCollisionRef = useRef<number>(0) // New tracker for boost
  const roadOffsetRef = useRef<number>(0)
  const lastSpawnTimeRef = useRef<number>(0)
  const lastScenerySpawnTimeRef = useRef<number>(0)
  const requestRef = useRef<number>(0)
  const isGameOverRef = useRef<boolean>(false)
  const prevGameStateRef = useRef<GameState>(GameState.MENU)

  // Level / Boost System
  const levelRef = useRef<number>(1)
  const warpEffectTimerRef = useRef<number>(0)

  // Shake Effect Ref (duration in seconds)
  const shakeTimeRef = useRef<number>(0)

  // Dying State (Smoke effect before game over)
  const isDyingRef = useRef<boolean>(false)
  const dyingTimerRef = useRef<number>(0)

  // Input State
  const keyStateRef = useRef<{ [key: string]: boolean }>({})

  // Load car sprite image
  useEffect(() => {
    console.log('[Outrun] Starting to load car sprite...')
    const img = new Image()
    img.src = '/assets/cars-sprite.png'
    img.onload = () => {
      carSpriteRef.current = img
      carSpriteLoadedRef.current = true
      console.log('[Outrun] Car sprite loaded successfully', { width: img.width, height: img.height })
    }
    img.onerror = () => {
      console.warn('[Outrun] Car sprite not found, using canvas drawing fallback')
      carSpriteLoadedRef.current = false
    }
  }, [])

  // Clean reset when going back to menu
  useEffect(() => {
    // Reset lastTimeRef when gameState changes to ensure proper deltaTime calculation
    lastTimeRef.current = 0

    if (gameState === GameState.MENU) {
      prevGameStateRef.current = GameState.MENU
      // Clear scene for a clean title screen
      obstaclesRef.current = []
      sceneryRef.current = []
      particlesRef.current = []
      playerRef.current.x = 0
      playerRef.current.lane = 1
      playerRef.current.speed = 5000 // Idle speed for visual (Fast start)
      totalDistanceRef.current = 0
      distanceSinceLastCollisionRef.current = 0
      levelRef.current = 1
      warpEffectTimerRef.current = 0
      shakeTimeRef.current = 0
      isDyingRef.current = false
      dyingTimerRef.current = 0
    }
  }, [gameState])

  useEffect(() => {
    console.log('[Outrun] Main useEffect triggered, gameState:', gameState)
    const canvas = canvasRef.current
    if (!canvas) {
      console.warn('[Outrun] Canvas ref not available')
      return
    }
    console.log('[Outrun] Canvas found:', { width: canvas.width, height: canvas.height })

    // Note: { alpha: false } can cause issues on some Safari versions
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('[Outrun] Failed to get 2D context')
      return
    }
    console.log('[Outrun] 2D context obtained successfully')

    // --- HELPER FUNCTIONS ---

    const createSceneryAtZ = (z: number) => {
      const side = Math.random() > 0.5 ? 1 : -1
      // Position: Close to road (1.1 ~ 1.5)
      const x = side * (1.1 + Math.random() * 0.4)

      const tree: SceneryObject = {
        id: Date.now() + Math.random(),
        type: 'PALM_TREE',
        x: x,
        z: z,
        // Reduced scale: 1.5 to 2.1
        scaleVar: 1.5 + Math.random() * 0.6,
        flip: Math.random() > 0.5
      }

      sceneryRef.current.push(tree)
    }

    const createExplosion = (x: number, y: number) => {
      const particleCount = 40
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 10 + 2
        const color = Math.random() > 0.5 ? '#ef4444' : '#facc15' // Red or Yellow

        particlesRef.current.push({
          id: Date.now() + Math.random(),
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 5, // Slight upward bias
          life: 1.0,
          maxLife: 1.0,
          color: color,
          size: Math.random() * 6 + 2,
          gravity: 0.5,
          grow: false
        })
      }
    }

    const createSmoke = (x: number, y: number) => {
      const count = 2 // Particles per frame
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          id: Date.now() + Math.random(),
          x: x + (Math.random() - 0.5) * 40,
          y: y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 3 - 1, // Float up
          life: 1.0 + Math.random() * 0.5,
          maxLife: 1.5,
          color: Math.random() > 0.5 ? '#334155' : '#1e293b', // Dark Slate / Gray
          size: Math.random() * 10 + 5,
          gravity: -0.05, // Buoyancy
          grow: true
        })
      }
    }

    const spawnObstacle = () => {
      const laneIndex = Math.floor(Math.random() * 3)
      const laneX = LANES[laneIndex]

      const r = Math.random()
      let type = ObstacleType.TRUCK
      let width = 200
      let height = 220
      let damage = 20
      let carIndex: number | undefined = undefined

      // CAR types have different spawn rates and exclude player's current car
      // Car 0 (Red F40): 3% when not player's car
      // Car 1 (Blue DeLorean): 2.5% when not player's car
      // Car 2 (Purple Lambo): 2% when not player's car
      // Car 3 (Cyan Porsche): 1.5% when not player's car
      if (r > 0.91) {
        // CAR spawn range (9% total)
        type = ObstacleType.CAR
        width = 160
        height = 180
        damage = 50

        // Select a car that's NOT the player's current car
        // Weight: Car 0=3, Car 1=2.5, Car 2=2, Car 3=1.5 (total 9)
        const currentPlayerCar = selectedCarRef.current
        const availableCars: { index: number; weight: number }[] = []

        // Define weights for each car (higher = more common)
        const carWeights = [3, 2.5, 2, 1.5] // Car 0, 1, 2, 3

        for (let i = 0; i < 4; i++) {
          if (i !== currentPlayerCar) {
            availableCars.push({ index: i, weight: carWeights[i] })
          }
        }

        // Weighted random selection
        const totalWeight = availableCars.reduce((sum, car) => sum + car.weight, 0)
        let randomWeight = Math.random() * totalWeight
        for (const car of availableCars) {
          randomWeight -= car.weight
          if (randomWeight <= 0) {
            carIndex = car.index
            break
          }
        }
      } else if (r > 0.7) {
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
        z: RENDER_DISTANCE * SEGMENT_LENGTH,
        width,
        height,
        damage,
        hit: false,
        carIndex
      }

      obstaclesRef.current.push(obstacle)
    }

    const spawnScenery = () => {
      createSceneryAtZ(RENDER_DISTANCE * SEGMENT_LENGTH)
    }

    const checkCollisions = (width: number, height: number) => {
      if (playerRef.current.energy <= 0 && !isDyingRef.current) return

      const playerLane = playerRef.current.lane

      // Hitbox tolerance
      const hitZDepth = 200
      const laneTolerance = 0.3

      obstaclesRef.current.forEach(obs => {
        if (!obs.hit && obs.z < hitZDepth && obs.z > -100) {
          const distX = Math.abs(obs.x - playerRef.current.x)

          if (distX < laneTolerance) {
            obs.hit = true

            // Apply Damage Multiplier based on speed (higher speed = more damage)
            // Base speed: 3000, Max speed: 9000+
            // Multiplier ranges from 1.0 (at 3000) to 3.0+ (at 9000+)
            const currentSpeed = playerRef.current.speed
            const speedMultiplier = 1 + Math.max(0, (currentSpeed - 3000) / 3000)
            let finalDamage = Math.floor(obs.damage * speedMultiplier)

            // Additional penalty if in Boost Mode (Warping)
            if (warpEffectTimerRef.current > 0) {
              finalDamage = Math.floor(finalDamage * 1.3)
            }

            const newEnergy = Math.max(0, playerRef.current.energy - finalDamage)
            playerRef.current.energy = newEnergy
            setEnergy(newEnergy)

            // CRASH PENALTY & RESET LEVEL
            playerRef.current.speed = 5000
            playerRef.current.maxSpeed = 12000 // Reset to base max speed
            levelRef.current = 1 // Reset Level
            warpEffectTimerRef.current = 0 // Cancel boost immediately
            distanceSinceLastCollisionRef.current = 0 // Reset safe distance tracker

            // Trigger Shake
            shakeTimeRef.current = 0.5 // Shake for 0.5 seconds

            // Trigger Haptic Feedback using CROSSx WebApp API
            // Choose intensity based on damage
            if (finalDamage >= 60) {
              CROSSxWebApp.hapticFeedback(Haptics.impactHeavy)
            } else if (finalDamage >= 30) {
              CROSSxWebApp.hapticFeedback(Haptics.impactMedium)
            } else {
              CROSSxWebApp.hapticFeedback(Haptics.impactLight)
            }

            // Calculate impact position for explosion
            const maxRoadWidth = Math.min(width * 0.9, 800)
            const roadCenterX = width / 2
            const carX = roadCenterX + playerRef.current.x * (maxRoadWidth / 2)
            const carY = height - 80
            createExplosion(carX, carY)

            if (newEnergy <= 0 && !isDyingRef.current) {
              // Initiate Dying Sequence
              isDyingRef.current = true
              dyingTimerRef.current = 2.0 // 2 seconds of smoke
              playerRef.current.speed = 0 // Stop car

              // Strong haptic feedback for game over
              CROSSxWebApp.hapticFeedback(Haptics.notificationError)
            }
          }
        }
      })
    }

    const handleInput = (key: string) => {
      if (gameState !== GameState.PLAYING || isDyingRef.current) return

      const player = playerRef.current

      if (key === 'ArrowLeft' || key === 'a') {
        if (player.lane > 0) player.lane--
      } else if (key === 'ArrowRight' || key === 'd') {
        if (player.lane < 2) player.lane++
      }
    }

    // --- DRAWING FUNCTIONS ---

    const drawSun = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const sunY = height * 0.35
      const sunRadius = Math.min(width, height) * 0.25

      const gradient = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius)
      gradient.addColorStop(0, '#ffff00')
      gradient.addColorStop(0.5, '#ff00ff')
      gradient.addColorStop(1, '#9900ff')

      ctx.save()
      ctx.fillStyle = gradient

      ctx.beginPath()
      ctx.arc(width / 2, sunY, sunRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#0f172a'
      const segmentHeight = sunRadius * 0.15
      for (let i = 0; i < 6; i++) {
        const y = sunY + i * segmentHeight * 1.5 - sunRadius * 0.2
        const h = segmentHeight * (0.3 + i * 0.1)
        if (y > sunY + sunRadius) break
        ctx.fillRect(width / 2 - sunRadius, y, sunRadius * 2, h)
      }

      ctx.shadowBlur = 40
      ctx.shadowColor = '#ff00ff'
      ctx.stroke()
      ctx.restore()
    }

    const drawRoad = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      offset: number,
      isWarping: boolean
    ) => {
      const horizonY = height * 0.4
      const maxRoadWidth = Math.min(width * 0.9, 800)

      ctx.save()

      // Grid Floor
      ctx.fillStyle = '#1a0b2e'
      ctx.fillRect(0, horizonY, width, height - horizonY)

      // Warping makes grid bright cyan/white
      const gridColor = isWarping ? 'rgba(200, 255, 255, 0.6)' : 'rgba(255, 0, 255, 0.2)'
      ctx.strokeStyle = gridColor
      ctx.lineWidth = isWarping ? 2 : 1
      const gridSpacing = width / 12

      ctx.beginPath()
      for (let i = 0; i < 20; i++) {
        const y = horizonY + Math.pow(i / 20, 2) * (height - horizonY)
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
      }
      const vanishingPointX = width / 2
      for (let i = -10; i <= 10; i++) {
        const x = vanishingPointX + i * gridSpacing * 2
        ctx.moveTo(vanishingPointX, horizonY)
        ctx.lineTo(x, height)
      }
      ctx.stroke()

      // Main Road
      const roadBottomW = maxRoadWidth
      const roadTopW = 10
      const roadCenterX = width / 2

      ctx.beginPath()
      ctx.moveTo(roadCenterX - roadTopW, horizonY)
      ctx.lineTo(roadCenterX + roadTopW, horizonY)
      ctx.lineTo(roadCenterX + roadBottomW / 2, height)
      ctx.lineTo(roadCenterX - roadBottomW / 2, height)
      ctx.closePath()

      ctx.fillStyle = isWarping ? '#2a3340' : '#1e293b'
      ctx.fill()
      ctx.clip()

      // Moving Strips
      const speedOffset = (offset * 2) % 1

      for (let i = 0; i < 30; i++) {
        const perspective = Math.pow((i + speedOffset) / 30, 3)
        const y = horizonY + perspective * (height - horizonY)
        const nextY = horizonY + Math.pow((i + 1 + speedOffset) / 30, 3) * (height - horizonY)
        const h = Math.max(1, nextY - y)

        if (i % 2 === 0) {
          // Brighter strips during warp
          ctx.fillStyle = isWarping ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'
          ctx.fillRect(0, y, width, h)
        }
      }

      // Lane Markers
      const laneDividers = [-1 / 3, 1 / 3]

      ctx.lineWidth = 2
      ctx.strokeStyle = isWarping ? '#ffffff' : '#22d3ee'

      laneDividers.forEach(laneX => {
        const x1 = roadCenterX + laneX * roadTopW
        const y1 = horizonY
        const x2 = roadCenterX + laneX * (roadBottomW / 2)
        const y2 = height

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      // Side rails
      ctx.lineWidth = 4
      ctx.strokeStyle = isWarping ? '#ff00aa' : '#d946ef'
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

    const drawWarpLines = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      intensity: number
    ) => {
      const cx = width / 2
      const cy = height * 0.4 // Horizon
      const count = 20

      ctx.save()
      ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.5})`
      ctx.lineWidth = 2

      for (let i = 0; i < count; i++) {
        const angle = (Date.now() / 200 + i * ((Math.PI * 2) / count)) % (Math.PI * 2)
        const len = Math.max(width, height)

        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(angle) * 50, cy + Math.sin(angle) * 20) // Start a bit off center
        ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
        ctx.stroke()
      }
      ctx.restore()
    }

    const drawLevelUpText = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      level: number,
      timer: number
    ) => {
      if (timer <= 0) return

      ctx.save()
      // Zoom in effect
      const scale = 1 + (2 - timer) * 0.5 // Starts at 1, grows
      const opacity = Math.min(1, timer) // Fades out at end

      ctx.translate(width / 2, height / 2)
      ctx.scale(scale, scale)

      // Smaller text size to not obstruct view
      ctx.font = 'italic 900 36px Orbitron, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Shadow/Glow
      ctx.shadowColor = '#00ffff'
      ctx.shadowBlur = 20

      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
      ctx.fillText(`SPEED UP!`, 0, -40)

      ctx.font = 'italic 700 24px Orbitron, sans-serif'
      ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`
      ctx.fillText(`LEVEL ${level}`, 0, 10)

      ctx.restore()
    }

    const drawPlayerCar = (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      lanePos: number
    ) => {
      const maxRoadWidth = Math.min(width * 0.9, 800)
      const roadCenterX = width / 2

      const laneWidth = maxRoadWidth / 3
      const targetCarWidth = laneWidth * 0.55

      const baseModelWidth = 160
      const carScale = targetCarWidth / baseModelWidth

      const carY = height - 80
      const carX = roadCenterX + lanePos * (maxRoadWidth / 2)

      ctx.save()

      // If sprite is loaded, use it instead of canvas drawing
      if (carSpriteLoadedRef.current && carSpriteRef.current) {
        const sprite = carSpriteRef.current
        // Sprite sheet: 2x2 grid, each car is half width and half height
        const spriteCarWidth = sprite.width / 2
        const spriteCarHeight = sprite.height / 2

        // Select car based on selectedCarRef (0-3)
        const carIndex = selectedCarRef.current
        const srcX = (carIndex % 2) * spriteCarWidth
        const srcY = Math.floor(carIndex / 2) * spriteCarHeight

        // Calculate destination size maintaining aspect ratio
        const aspectRatio = spriteCarHeight / spriteCarWidth
        const destWidth = targetCarWidth * 1.6 // Larger for better visibility
        const destHeight = destWidth * aspectRatio

        // Draw realistic shadow with gradient
        // Car image: top at carY - destHeight + 60, bottom at carY + 60
        // Shadow should be right at the car's tire level (slightly above exhaust flames)
        // Adjust shadow position based on screen size (desktop needs closer shadow)
        const isMobile = width < 768
        const carBottomY = isMobile ? carY + 45 : carY + 35 // Desktop: closer to car
        const shadowWidth = destWidth * 0.78 // 1.2x larger
        const shadowHeight = isMobile ? 10 : 12 // Desktop: slightly larger

        // Create radial gradient for soft shadow
        const shadowGradient = ctx.createRadialGradient(
          carX,
          carBottomY,
          0,
          carX,
          carBottomY,
          shadowWidth * 0.5
        )
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)')
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)')
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = shadowGradient
        ctx.beginPath()
        ctx.ellipse(carX, carBottomY, shadowWidth * 0.5, shadowHeight, 0, 0, Math.PI * 2)
        ctx.fill()

        // Draw the car sprite (centered at carX, bottom at carY)
        // Sprite offset adjustment for precise centering per lane
        // lanePos: -2/3 (left), 0 (center), 2/3 (right)
        let spriteOffsetX = 0
        if (lanePos < -0.3) {
          // Left lane - shift slightly left
          spriteOffsetX = -8
        } else if (lanePos > 0.3) {
          // Right lane - shift more left
          spriteOffsetX = -12
        } else {
          // Center lane
          spriteOffsetX = -5
        }
        ctx.drawImage(
          sprite,
          srcX,
          srcY,
          spriteCarWidth,
          spriteCarHeight,
          carX - destWidth / 2 + spriteOffsetX,
          carY - destHeight + 60,
          destWidth,
          destHeight
        )

        ctx.restore()
        return
      }

      // Fallback shadow for canvas drawing
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath()
      ctx.ellipse(carX, carY + 30 * carScale, 70 * carScale, 12 * carScale, 0, 0, Math.PI * 2)
      ctx.fill()

      // Fallback: Canvas drawing (original code)
      ctx.translate(carX, carY)
      ctx.scale(carScale, carScale)

      // Shadow already drawn above, skip here

      // Tires
      ctx.fillStyle = '#0f0f0f'
      ctx.fillRect(-80, 0, 40, 35)
      ctx.fillRect(40, 0, 40, 35)

      // Diffuser
      ctx.fillStyle = '#18181b'
      ctx.beginPath()
      ctx.moveTo(-75, 25)
      ctx.lineTo(75, 25)
      ctx.lineTo(70, 40)
      ctx.lineTo(-70, 40)
      ctx.fill()

      // Exhaust
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.ellipse(0, 30, 18, 8, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#525252'
      ctx.beginPath()
      ctx.arc(0, 30, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(-10, 30, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, 30, 3, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(0, 30, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(-10, 30, 1.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(10, 30, 1.5, 0, Math.PI * 2)
      ctx.fill()

      // Body
      const bodyGrad = ctx.createLinearGradient(0, -60, 0, 30)
      bodyGrad.addColorStop(0, '#dc2626')
      bodyGrad.addColorStop(1, '#991b1b')

      ctx.fillStyle = bodyGrad
      ctx.beginPath()
      ctx.moveTo(-80, 5)
      ctx.lineTo(-80, -35)
      ctx.lineTo(80, -35)
      ctx.lineTo(80, 5)
      ctx.fill()

      // Grille
      ctx.fillStyle = '#0a0a0a'
      ctx.fillRect(-78, -25, 156, 25)

      ctx.fillStyle = '#262626'
      for (let i = 0; i < 156; i += 4) {
        for (let j = 0; j < 25; j += 4) {
          if ((i + j) % 2 === 0) ctx.fillRect(-78 + i, -25 + j, 1, 1)
        }
      }

      // Lights
      const drawF40Light = (lx: number, ly: number) => {
        ctx.fillStyle = '#7f1d1d'
        ctx.beginPath()
        ctx.arc(lx, ly, 7, 0, Math.PI * 2)
        ctx.fill()

        const grad = ctx.createRadialGradient(lx - 2, ly - 2, 1, lx, ly, 6)
        grad.addColorStop(0, '#ff9999')
        grad.addColorStop(0.5, '#ef4444')
        grad.addColorStop(1, '#991b1b')
        ctx.fillStyle = grad
        ctx.shadowColor = '#ff0000'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(lx, ly, 5.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }

      drawF40Light(-55, -12)
      drawF40Light(-35, -12)
      drawF40Light(35, -12)
      drawF40Light(55, -12)

      // Plate
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(-18, 5, 36, 12)
      ctx.fillStyle = '#000'
      ctx.font = 'bold 9px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('F40', 0, 11)

      // Cabin
      ctx.fillStyle = '#1c1917'
      ctx.beginPath()
      ctx.moveTo(-45, -35)
      ctx.lineTo(45, -35)
      ctx.lineTo(35, -65)
      ctx.lineTo(-35, -65)
      ctx.fill()

      // Louvers
      ctx.fillStyle = 'rgba(220, 38, 38, 0.2)'
      ctx.beginPath()
      ctx.moveTo(-40, -35)
      ctx.lineTo(40, -35)
      ctx.lineTo(32, -60)
      ctx.lineTo(-32, -60)
      ctx.fill()

      ctx.strokeStyle = '#7f1d1d'
      ctx.lineWidth = 1.5
      for (let y = -55; y < -35; y += 4) {
        ctx.beginPath()
        ctx.moveTo(-32 + (y + 55) * 0.3, y)
        ctx.lineTo(32 - (y + 55) * 0.3, y)
        ctx.stroke()
      }

      // Wing
      const wingColor = '#dc2626'
      ctx.fillStyle = wingColor

      ctx.beginPath()
      ctx.moveTo(-80, -35)
      ctx.lineTo(-80, -60)
      ctx.lineTo(-70, -60)
      ctx.lineTo(-65, -35)
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(80, -35)
      ctx.lineTo(80, -60)
      ctx.lineTo(70, -60)
      ctx.lineTo(65, -35)
      ctx.fill()

      const foilGrad = ctx.createLinearGradient(0, -65, 0, -55)
      foilGrad.addColorStop(0, '#ef4444')
      foilGrad.addColorStop(1, '#b91c1c')
      ctx.fillStyle = foilGrad
      ctx.beginPath()
      ctx.roundRect(-82, -62, 164, 12, 2)
      ctx.fill()

      ctx.fillStyle = '#991b1b'
      ctx.fillRect(-82, -62, 3, 12)
      ctx.fillRect(79, -62, 3, 12)

      // Highlights
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1

      ctx.beginPath()
      ctx.moveTo(-82, -62)
      ctx.lineTo(82, -62)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-80, -35)
      ctx.lineTo(-78, -25)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(80, -35)
      ctx.lineTo(78, -25)
      ctx.stroke()

      ctx.restore()
    }

    const drawTruck = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      roadCenterX: number,
      horizonY: number
    ) => {
      const w = 200 * scale
      const h = 220 * scale
      const halfW = w / 2

      const rearL = x - halfW
      const rearR = x + halfW
      const rearB = y
      const rearT = y - h

      const depth = 0.2

      const frontL = rearL + (roadCenterX - rearL) * depth
      const frontR = rearR + (roadCenterX - rearR) * depth
      const frontT = rearT + (horizonY - rearT) * depth
      const frontB = rearB + (horizonY - rearB) * depth

      ctx.lineWidth = 1
      ctx.strokeStyle = '#0f172a'

      // Roof
      ctx.fillStyle = '#64748b'
      ctx.beginPath()
      ctx.moveTo(rearL, rearT)
      ctx.lineTo(rearR, rearT)
      ctx.lineTo(frontR, frontT)
      ctx.lineTo(frontL, frontT)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Side
      ctx.fillStyle = '#334155'

      if (x < roadCenterX) {
        ctx.beginPath()
        ctx.moveTo(rearR, rearT)
        ctx.lineTo(frontR, frontT)
        ctx.lineTo(frontR, frontB)
        ctx.lineTo(rearR, rearB)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      } else if (x > roadCenterX) {
        ctx.beginPath()
        ctx.moveTo(rearL, rearT)
        ctx.lineTo(frontL, frontT)
        ctx.lineTo(frontL, frontB)
        ctx.lineTo(rearL, rearB)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }

      // Rear Face
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      ctx.fillStyle = '#475569'
      ctx.fillRect(-100, -220, 200, 220)

      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.strokeRect(-100, -220, 200, 220)

      ctx.beginPath()
      ctx.moveTo(0, -220)
      ctx.lineTo(0, 0)
      ctx.stroke()

      ctx.shadowBlur = 10
      ctx.shadowColor = '#ff0000'
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(-85, -30, 30, 15)
      ctx.fillRect(55, -30, 30, 15)

      ctx.shadowBlur = 0
      ctx.fillStyle = '#facc15'
      ctx.fillRect(-30, -25, 60, 15)

      ctx.fillStyle = '#0f172a'
      ctx.fillRect(-105, -30, 15, 35)
      ctx.fillRect(90, -30, 15, 35)

      ctx.restore()
    }

    const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      ctx.fillStyle = '#22c55e'
      ctx.strokeStyle = '#052e16'
      ctx.lineWidth = 2

      ctx.fillRect(-10, -80, 20, 80)
      ctx.strokeRect(-10, -80, 20, 80)

      ctx.fillRect(-30, -50, 20, 15)
      ctx.strokeRect(-30, -50, 20, 15)
      ctx.fillRect(-30, -70, 15, 20)
      ctx.strokeRect(-30, -70, 15, 20)

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

      ctx.strokeStyle = '#f472b6'
      ctx.lineWidth = 4
      ctx.shadowColor = '#f472b6'
      ctx.shadowBlur = 5

      ctx.beginPath()
      ctx.arc(0, -60, 10, 0, Math.PI * 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, -50)
      ctx.lineTo(0, -20)
      ctx.stroke()

      const time = Date.now() / 100
      ctx.beginPath()
      ctx.moveTo(0, -40)
      ctx.lineTo(-15, -30 + Math.sin(time) * 10)
      ctx.moveTo(0, -40)
      ctx.lineTo(15, -30 - Math.sin(time) * 10)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, -20)
      ctx.lineTo(-10, 0 + Math.cos(time) * 10)
      ctx.moveTo(0, -20)
      ctx.lineTo(10, 0 - Math.cos(time) * 10)
      ctx.stroke()

      ctx.restore()
    }

    const drawObstacleCar = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      carIndex: number
    ) => {
      ctx.save()

      if (carSpriteLoadedRef.current && carSpriteRef.current) {
        const sprite = carSpriteRef.current
        const spriteCarWidth = sprite.width / 2
        const spriteCarHeight = sprite.height / 2

        const srcX = (carIndex % 2) * spriteCarWidth
        const srcY = Math.floor(carIndex / 2) * spriteCarHeight

        const baseWidth = 160 * scale
        const aspectRatio = spriteCarHeight / spriteCarWidth
        const destWidth = baseWidth * 1.4
        const destHeight = destWidth * aspectRatio

        // Shadow - positioned at y (road surface)
        // Using simple ellipse for Safari compatibility
        const shadowWidth = destWidth * 0.7
        const shadowHeight = 10 * scale
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.beginPath()
        // Safari-compatible ellipse drawing
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(shadowWidth * 0.5, shadowHeight)
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.restore()
        ctx.fill()

        // Draw car sprite - car bottom should be at y
        // Adjust so the car sits on the road at position y
        try {
          ctx.drawImage(
            sprite,
            srcX,
            srcY,
            spriteCarWidth,
            spriteCarHeight,
            x - destWidth / 2,
            y - destHeight * 0.85,
            destWidth,
            destHeight
          )
        } catch (e) {
          console.warn('[Outrun] Failed to draw obstacle car sprite:', e)
          // Fallback to simple rect on error
          ctx.fillStyle = '#3b82f6'
          ctx.fillRect(x - 80 * scale, y - 90 * scale, 160 * scale, 90 * scale)
        }
      } else {
        // Fallback: simple colored rectangle
        const carColors = ['#dc2626', '#3b82f6', '#a855f7', '#06b6d4'] // Red, Blue, Purple, Cyan

        // Shadow first - Safari compatible
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.beginPath()
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(60 * scale, 10 * scale)
        ctx.arc(0, 0, 1, 0, Math.PI * 2)
        ctx.restore()
        ctx.fill()

        // Car body
        ctx.fillStyle = carColors[carIndex] || '#fbbf24'
        ctx.fillRect(x - 80 * scale, y - 90 * scale, 160 * scale, 90 * scale)
      }

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

      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 4
      ctx.shadowColor = '#a855f7'
      ctx.shadowBlur = 5

      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.quadraticCurveTo(20, -50, 0, -150)
      ctx.stroke()

      ctx.strokeStyle = '#22d3ee'
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

    const drawParticles = (ctx: CanvasRenderingContext2D, deltaTime: number) => {
      particlesRef.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity // Variable gravity (positive for debris, negative for smoke)
        p.life -= deltaTime

        if (p.grow) {
          p.size += deltaTime * 20 // Smoke grows
        }

        if (p.life > 0) {
          ctx.save()
          ctx.globalAlpha = p.life / p.maxLife
          ctx.fillStyle = p.color
          // Smoke is blurry, sparks are sharp
          // Note: ctx.filter causes performance issues on Safari, using shadowBlur instead
          if (p.grow) {
            // Soft smoke effect without filter (Safari compatible)
            ctx.shadowBlur = 15
            ctx.shadowColor = p.color
          } else {
            ctx.shadowBlur = 10
            ctx.shadowColor = p.color
          }

          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })
      // Cleanup dead particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0)
    }

    // --- GAME LOOP ---

    const render = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time
        console.log('[Outrun] Render loop started at time:', time)
      }
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.05)
      lastTimeRef.current = time

      if (gameState === GameState.PAUSED) {
        requestRef.current = requestAnimationFrame(render)
        return
      }
      if (gameState === GameState.GAME_OVER) return

      if (gameState === GameState.PLAYING && prevGameStateRef.current === GameState.MENU) {
        console.log('[Outrun] Game state changed from MENU to PLAYING - initializing game...')
        // Reset Logic
        obstaclesRef.current = []
        sceneryRef.current = []
        particlesRef.current = []
        playerRef.current = { x: 0, lane: 1, speed: 5000, maxSpeed: 12000, energy: 100 }
        totalDistanceRef.current = 0
        distanceSinceLastCollisionRef.current = 0 // Reset safe distance
        levelRef.current = 1
        warpEffectTimerRef.current = 0
        shakeTimeRef.current = 0
        setScore(0)
        setEnergy(100)
        isGameOverRef.current = false
        isDyingRef.current = false
        dyingTimerRef.current = 0
        prevGameStateRef.current = GameState.PLAYING

        console.log('[Outrun] Spawning initial scenery...')
        for (let z = 0; z < RENDER_DISTANCE * SEGMENT_LENGTH; z += 1000) {
          if (Math.random() > 0.3) createSceneryAtZ(z)
          if (Math.random() > 0.3) createSceneryAtZ(z)
        }
        console.log('[Outrun] Game initialized, scenery count:', sceneryRef.current.length)
      }

      const width = canvas.width
      const height = canvas.height

      // Handle Shake Decay
      if (shakeTimeRef.current > 0) {
        shakeTimeRef.current -= deltaTime
      }

      // Handle Warp Effect Timer
      if (warpEffectTimerRef.current > 0) {
        warpEffectTimerRef.current -= deltaTime
      }

      // Logic Branch
      if (gameState === GameState.PLAYING) {
        if (isDyingRef.current) {
          // --- DYING SEQUENCE LOGIC ---
          dyingTimerRef.current -= deltaTime

          // Generate Smoke from Engine
          const maxRoadWidth = Math.min(width * 0.9, 800)
          const roadCenterX = width / 2
          const carX = roadCenterX + playerRef.current.x * (maxRoadWidth / 2)
          const carY = height - 80
          createSmoke(carX, carY - 40) // Engine deck height

          if (dyingTimerRef.current <= 0) {
            isGameOverRef.current = true
            onGameOver()
            // Stop loop until restart
            return
          }
        } else {
          // --- NORMAL GAMEPLAY LOGIC ---
          // Add distance based on speed (approximate m/s)
          // Speed 3000 ~ 9000. Let's say 100 units = 1 meter.
          const distanceIncrement = (playerRef.current.speed / 100) * deltaTime
          totalDistanceRef.current += distanceIncrement
          distanceSinceLastCollisionRef.current += distanceIncrement // Track safe distance
          setScore(Math.floor(totalDistanceRef.current))

          // Update speed display (convert game speed to km/h for display)
          // Display at 1/4 of previous scale for more realistic speed numbers
          const displaySpeed = playerRef.current.speed / 60
          setSpeed(displaySpeed)

          // Check for Boost Trigger (Every 1km without collision)
          // Check if distanceSinceLastCollision exceeded the threshold
          if (distanceSinceLastCollisionRef.current >= BOOST_DISTANCE_THRESHOLD) {
            levelRef.current++
            // Boost Max Speed significantly
            playerRef.current.maxSpeed += 1500
            // Immediate Speed Kick
            playerRef.current.speed += 500
            // Trigger Visuals
            warpEffectTimerRef.current = 2.0
            shakeTimeRef.current = 0.5 // Slight rumble

            // Reset safe distance tracker to require another 1km for next boost
            distanceSinceLastCollisionRef.current = 0
          }

          const targetX = LANES[playerRef.current.lane]
          const lerpSpeed = 15
          playerRef.current.x += (targetX - playerRef.current.x) * lerpSpeed * deltaTime

          const acceleration = 1500
          playerRef.current.speed += acceleration * deltaTime

          if (playerRef.current.speed > playerRef.current.maxSpeed) {
            playerRef.current.speed = playerRef.current.maxSpeed
          }

          const moveDist = playerRef.current.speed * deltaTime
          obstaclesRef.current.forEach(obs => {
            obs.z -= moveDist
          })
          obstaclesRef.current = obstaclesRef.current.filter(obs => obs.z > -200)

          sceneryRef.current.forEach(item => {
            item.z -= moveDist
          })
          sceneryRef.current = sceneryRef.current.filter(item => item.z > -200)

          // Spawn rate adjusted for speed
          const spawnRate = Math.max(300, 3000000 / playerRef.current.speed)

          if (time - lastSpawnTimeRef.current > spawnRate) {
            spawnObstacle()
            lastSpawnTimeRef.current = time
          }

          const sceneryRate = Math.max(30, 200000 / playerRef.current.speed)
          if (time - lastScenerySpawnTimeRef.current > sceneryRate) {
            spawnScenery()
            lastScenerySpawnTimeRef.current = time
          }

          checkCollisions(width, height)

          roadOffsetRef.current += (playerRef.current.speed / 1000) * deltaTime
        }
      }

      // --- RENDER START ---
      ctx.save() // Save default context

      // Clear Screen
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(0, 0, width, height)

      // Apply Shake
      if (shakeTimeRef.current > 0) {
        const shakeIntensity = 20 * (shakeTimeRef.current / 0.5) // 0.5 is max duration
        const dx = (Math.random() - 0.5) * shakeIntensity
        const dy = (Math.random() - 0.5) * shakeIntensity
        ctx.translate(dx, dy)

        // Impact Flash (Red overlay) or Warp Flash (Cyan overlay)
        if (warpEffectTimerRef.current > 0) {
          // White flash at start of warp, then fade
          const opacity = Math.min(0.5, warpEffectTimerRef.current * 0.5)
          ctx.fillStyle = `rgba(200, 255, 255, ${opacity})`
          ctx.fillRect(-dx, -dy, width, height)
        } else {
          ctx.fillStyle = `rgba(239, 68, 68, ${shakeTimeRef.current})`
          ctx.fillRect(-dx, -dy, width, height)
        }
      }

      // Sky / Sun
      drawSun(ctx, width, height)

      // Road (Pass warp status)
      drawRoad(ctx, width, height, roadOffsetRef.current, warpEffectTimerRef.current > 0)

      // Render Queue
      const renderQueue: Renderable[] = [
        ...obstaclesRef.current.map(o => ({ type: 'OBSTACLE' as const, data: o, z: o.z })),
        ...sceneryRef.current.map(s => ({ type: 'SCENERY' as const, data: s, z: s.z }))
      ]

      renderQueue.sort((a, b) => b.z - a.z)

      const maxRoadWidth = Math.min(width * 0.9, 800)
      const laneWidth = maxRoadWidth / 3

      const truckScaleFactor = (laneWidth * 0.9) / 200
      const cactusScaleFactor = (laneWidth * 0.4) / 60
      const jaywalkerScaleFactor = (laneWidth * 0.3) / 40

      const roadCenterX = width / 2
      const roadBottomW = maxRoadWidth
      const horizonY = height * 0.4

      renderQueue.forEach(item => {
        const projScale = 20000 / (item.z + 2000)
        const renderY = horizonY + (height - horizonY) / (item.z / 2000 + 1)
        const renderScale = 1 / (item.z / 2000 + 1)

        const currentRoadHalfWidth = (roadBottomW / 2) * renderScale

        let renderX = roadCenterX + item.data.x * currentRoadHalfWidth

        if (item.type === 'SCENERY') {
          renderX = roadCenterX + item.data.x * (roadBottomW / 2) * renderScale
        }

        if (item.type === 'OBSTACLE') {
          const obs = item.data as Obstacle
          if (obs.hit) return

          if (obs.type === ObstacleType.TRUCK) {
            drawTruck(ctx, renderX, renderY, renderScale * truckScaleFactor, roadCenterX, horizonY)
          } else if (obs.type === ObstacleType.CACTUS) {
            drawCactus(ctx, renderX, renderY, renderScale * cactusScaleFactor)
          } else if (obs.type === ObstacleType.JAYWALKER) {
            drawJaywalker(ctx, renderX, renderY, renderScale * jaywalkerScaleFactor)
          } else if (obs.type === ObstacleType.CAR && obs.carIndex !== undefined) {
            const carScaleFactor = (laneWidth * 0.8) / 160
            drawObstacleCar(ctx, renderX, renderY, renderScale * carScaleFactor, obs.carIndex)
          }
        } else {
          const scenery = item.data as SceneryObject
          drawPalmTree(ctx, renderX, renderY, renderScale * scenery.scaleVar, scenery.flip)
        }
      })

      // Player
      drawPlayerCar(ctx, width, height, playerRef.current.x)

      // Draw Particles
      drawParticles(ctx, deltaTime)

      // Draw Warp Lines (Overlay)
      if (warpEffectTimerRef.current > 0) {
        drawWarpLines(ctx, width, height, warpEffectTimerRef.current)
        drawLevelUpText(ctx, width, height, levelRef.current, warpEffectTimerRef.current)
      }

      ctx.restore() // Restore context (removes shake translation)

      requestRef.current = requestAnimationFrame(render)
    }

    // Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
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

    console.log('[Outrun] Setting up event listeners...')
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    canvas.addEventListener('touchstart', handleTouchStart)

    console.log('[Outrun] Starting animation frame loop...')
    requestRef.current = requestAnimationFrame(render)

    return () => {
      console.log('[Outrun] Cleaning up event listeners and animation frame')
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      canvas.removeEventListener('touchstart', handleTouchStart)
      cancelAnimationFrame(requestRef.current)
    }
  }, [gameState, setEnergy, setScore, onGameOver, setSpeed])

  useEffect(() => {
    console.log('[Outrun] Resize effect mounted')
    const handleResize = () => {
      if (canvasRef.current) {
        const newWidth = window.innerWidth
        const newHeight = window.innerHeight
        canvasRef.current.width = newWidth
        canvasRef.current.height = newHeight
        console.log('[Outrun] Canvas resized:', { width: newWidth, height: newHeight })
      }
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => {
      console.log('[Outrun] Resize effect cleanup')
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="block w-full h-full" />
}

export default GameCanvas
