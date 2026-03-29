import { useEffect } from 'react'
import NavBar from '@/components/NavBar'
import PageHeading from '@/components/atoms/PageHeading'

function StandardAlgorithmPlaceholder() {
  useEffect(() => {
    document.title = 'Standard Algorithm — Math Flash Cards'
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20 pb-12">
      <NavBar backTo="/division" />
      <div className="flex flex-col items-center gap-4 mt-12 text-center">
        <PageHeading>Standard Algorithm</PageHeading>
        <p className="text-slate-500 dark:text-slate-400">Coming soon</p>
      </div>
    </main>
  )
}

export default StandardAlgorithmPlaceholder
