import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 tracking-wider">
            SNAKE
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Classic arcade game reimagined for the modern web
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-8 border border-white/10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Game Rules</h2>
            <ul className="text-gray-300 text-left space-y-2">
              <li>• Use arrow keys or WASD to control the snake</li>
              <li>• Eat food to grow longer and score points</li>
              <li>• Avoid hitting walls or yourself</li>
              <li>• Press spacebar to pause/resume</li>
              <li>• Speed increases as you score more points</li>
            </ul>
          </div>

          <Link 
            href="/snake"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg transition-colors duration-200 text-xl"
          >
            Start Game
          </Link>
        </div>

        <div className="mt-8 text-gray-400 text-sm">
          <p>Built with Next.js, TypeScript & Canvas 2D</p>
        </div>
      </div>
    </div>
  )
}