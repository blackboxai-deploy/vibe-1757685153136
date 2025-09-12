'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import GameControls from './GameControls'
import ScoreBoard from './ScoreBoard'

// Game constants
const CANVAS_SIZE = 400
const GRID_SIZE = 20
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE
const INITIAL_SPEED = 150
const SPEED_INCREMENT = 5
const MIN_SPEED = 50
const POINTS_PER_FOOD = 10
const SPEED_INCREASE_INTERVAL = 50

// Game types
type Position = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER'

// Audio context for sound effects
class GameAudio {
  private audioContext: AudioContext | null = null
  private isEnabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        console.log('Audio not supported')
      }
    }
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.audioContext || !this.isEnabled) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = 'square'
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  playEat() {
    this.createBeep(800, 0.1)
  }

  playGameOver() {
    this.createBeep(200, 0.5)
    setTimeout(() => this.createBeep(150, 0.5), 200)
  }

  toggle() {
    this.isEnabled = !this.isEnabled
  }

  isAudioEnabled() {
    return this.isEnabled
  }
}

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameLoopRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)
  const audioRef = useRef<GameAudio>()

  // Game state
  const [gameState, setGameState] = useState<GameState>('MENU')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [speed, setSpeed] = useState(INITIAL_SPEED)

  // Game entities
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }])
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT')
  const [food, setFood] = useState<Position>({ x: 15, y: 15 })

  // Initialize audio
  useEffect(() => {
    audioRef.current = new GameAudio()
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('snakeHighScore')
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore))
    }
  }, [])

  // Generate random food position
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    
    return newFood
  }, [])

  // Initialize game
  const initializeGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }]
    setSnake(initialSnake)
    setDirection('RIGHT')
    setNextDirection('RIGHT')
    setFood(generateFood(initialSnake))
    setScore(0)
    setSpeed(INITIAL_SPEED)
  }, [generateFood])

  // Move snake
  const moveSnake = useCallback((currentSnake: Position[], currentDirection: Direction): Position[] => {
    const head = { ...currentSnake[0] }
    
    switch (currentDirection) {
      case 'UP':
        head.y -= 1
        break
      case 'DOWN':
        head.y += 1
        break
      case 'LEFT':
        head.x -= 1
        break
      case 'RIGHT':
        head.x += 1
        break
    }

    return [head, ...currentSnake]
  }, [])

  // Check collisions
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true
    }

    // Self collision
    return body.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
  }, [])

  // Game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'PLAYING') return

    const deltaTime = timestamp - lastTimeRef.current

    if (deltaTime >= speed) {
      setSnake(currentSnake => {
        const newDirection = nextDirection
        const newSnake = moveSnake(currentSnake, newDirection)
        const head = newSnake[0]

        // Check collisions
        if (checkCollision(head, newSnake)) {
          setGameState('GAME_OVER')
          audioRef.current?.playGameOver()
          return currentSnake
        }

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          audioRef.current?.playEat()
          
          // Update score and speed
          const newScore = score + POINTS_PER_FOOD
          setScore(newScore)
          
          if (newScore > highScore) {
            const updatedHighScore = newScore
            setHighScore(updatedHighScore)
            localStorage.setItem('snakeHighScore', updatedHighScore.toString())
          }

          // Increase speed every SPEED_INCREASE_INTERVAL points
          if (newScore % SPEED_INCREASE_INTERVAL === 0) {
            setSpeed(currentSpeed => Math.max(MIN_SPEED, currentSpeed - SPEED_INCREMENT))
          }

          // Generate new food
          setFood(generateFood(newSnake))
          
          // Return snake with new segment (don't pop tail)
          return newSnake
        }

        // Normal movement (pop tail)
        return newSnake.slice(0, -1)
      })

      setDirection(nextDirection)
      lastTimeRef.current = timestamp
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, speed, nextDirection, food, score, highScore, moveSnake, checkCollision, generateFood])

  // Start game loop
  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, gameLoop])

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (gameState === 'MENU' || gameState === 'GAME_OVER') {
      if (event.code === 'Space' || event.code === 'Enter') {
        initializeGame()
        setGameState('PLAYING')
      }
      return
    }

    if (event.code === 'Space') {
      setGameState(current => current === 'PLAYING' ? 'PAUSED' : 'PLAYING')
      return
    }

    if (gameState !== 'PLAYING') return

    let newDirection = direction
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        newDirection = 'UP'
        break
      case 'ArrowDown':
      case 'KeyS':
        newDirection = 'DOWN'
        break
      case 'ArrowLeft':
      case 'KeyA':
        newDirection = 'LEFT'
        break
      case 'ArrowRight':
      case 'KeyD':
        newDirection = 'RIGHT'
        break
    }

    // Prevent reverse direction
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    }

    if (newDirection !== opposites[direction]) {
      setNextDirection(newDirection)
    }
  }, [gameState, direction, initializeGame])

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // Touch controls for mobile
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }, [])

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchStart.current) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y
    const minSwipeDistance = 30

    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      // Tap to pause/resume
      if (gameState === 'PLAYING' || gameState === 'PAUSED') {
        setGameState(current => current === 'PLAYING' ? 'PAUSED' : 'PLAYING')
      }
      return
    }

    if (gameState !== 'PLAYING') return

    let newDirection = direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      newDirection = deltaX > 0 ? 'RIGHT' : 'LEFT'
    } else {
      // Vertical swipe
      newDirection = deltaY > 0 ? 'DOWN' : 'UP'
    }

    // Prevent reverse direction
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT'
    }

    if (newDirection !== opposites[direction]) {
      setNextDirection(newDirection)
    }

    touchStart.current = null
  }, [gameState, direction])

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#00ff00' : '#008800' // Head is brighter green
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      )
    })

    // Draw food
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(
      food.x * CELL_SIZE + 1,
      food.y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2
    )

    // Draw game state overlay
    if (gameState !== 'PLAYING') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px Arial'
      ctx.textAlign = 'center'

      let message = ''
      let subMessage = ''

      switch (gameState) {
        case 'MENU':
          message = 'SNAKE GAME'
          subMessage = 'Press SPACE or tap to start'
          break
        case 'PAUSED':
          message = 'PAUSED'
          subMessage = 'Press SPACE or tap to resume'
          break
        case 'GAME_OVER':
          message = 'GAME OVER'
          subMessage = `Score: ${score} | Press SPACE or tap to restart`
          break
      }

      ctx.fillText(message, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20)
      
      ctx.font = '14px Arial'
      ctx.fillText(subMessage, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10)
    }
  }, [snake, food, gameState, score])

  const startGame = () => {
    initializeGame()
    setGameState('PLAYING')
  }

  const pauseGame = () => {
    setGameState(current => current === 'PLAYING' ? 'PAUSED' : 'PLAYING')
  }

  const toggleAudio = () => {
    audioRef.current?.toggle()
  }

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
      <div className="flex flex-col items-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="border-2 border-white/20 rounded-lg bg-black"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />
        
        <div className="mt-4 text-center text-sm text-gray-400">
          <p className="mb-1">Desktop: Arrow keys or WASD to move</p>
          <p>Mobile: Swipe to move, tap to pause</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ScoreBoard 
          score={score} 
          highScore={highScore}
          speed={INITIAL_SPEED - speed + MIN_SPEED}
          gameState={gameState}
        />
        
        <GameControls
          gameState={gameState}
          onStart={startGame}
          onPause={pauseGame}
          onToggleAudio={toggleAudio}
          isAudioEnabled={audioRef.current?.isAudioEnabled() ?? true}
        />
      </div>
    </div>
  )
}