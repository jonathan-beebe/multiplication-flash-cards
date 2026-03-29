import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import HomeButton from '@/components/atoms/HomeButton'

function Home() {
  useEffect(() => {
    document.title = 'Math Flash Cards'
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 pb-12 bg-background">
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-8 text-4xl font-bold text-text">Math Flash{'\u00A0'}Cards</h1>
        <div className="grid grid-cols-2 w-full max-w-xs gap-4">
          <HomeButton to="/addition" color="green" aria-label="Addition">
            <span className="text-5xl font-bold leading-none relative -top-[2px] text-shadow-sm" aria-hidden="true">
              +
            </span>
          </HomeButton>
          <HomeButton to="/subtraction" color="rose" aria-label="Subtraction">
            <span className="text-5xl font-bold leading-none relative -top-[2px] text-shadow-sm" aria-hidden="true">
              −
            </span>
          </HomeButton>
          <HomeButton to="/multiplication" color="amber" aria-label="Multiplication">
            <span className="text-5xl font-bold leading-none relative -top-[2px] text-shadow-sm" aria-hidden="true">
              ×
            </span>
          </HomeButton>
          <HomeButton to="/division" color="teal" aria-label="Division">
            <span className="text-5xl font-bold leading-none relative -top-[2px] text-shadow-sm" aria-hidden="true">
              ÷
            </span>
          </HomeButton>
        </div>

        <div className="mt-12">
          <Link
            to="/for-parents"
            className="text-sm text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
            For Parents
          </Link>
        </div>
      </div>
    </main>
  )
}

export default Home
