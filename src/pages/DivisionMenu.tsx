import { useEffect } from 'react'
import NavBar from '@/components/NavBar'
import HomeButton from '@/components/atoms/HomeButton'

function DivisionMenu() {
  useEffect(() => {
    document.title = 'Division — Math Flash Cards'
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 pt-16 pb-12 bg-background">
      <NavBar />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-8 text-4xl font-bold text-text">Division</h1>
        <div className="flex w-full max-w-xs flex-col items-center gap-4">
          <HomeButton to="/division/standard-algorithm" color="teal">
            Standard Algorithm
          </HomeButton>
          <HomeButton to="/division/partial-quotients" color="teal">
            Partial Quotients
          </HomeButton>
          <HomeButton to="/division/area-model" color="teal">
            Area Model
          </HomeButton>
        </div>
      </div>
    </main>
  )
}

export default DivisionMenu
