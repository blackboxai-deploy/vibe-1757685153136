'use client'

import SnakeGame from '@/components/SnakeGame'
import Link from 'next/link'

export default function SnakeGamePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-6">
          <Link 
            href="/"
            className="inline-block text-white hover:text-gray-300 transition-colors mb-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Snake Game</h1>
          <p className="text-gray-300">Use arrow keys or WASD to control • Spacebar to pause</p>
        </div>

        <SnakeGame />
      </div>
    </div>
  )
}