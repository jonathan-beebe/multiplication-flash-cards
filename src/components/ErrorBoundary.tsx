import { Component, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '')

const ERROR_IMAGES = [
  `${BASE}/error/cat-001.gif`,
  `${BASE}/error/cat-002.gif`,
  `${BASE}/error/cat-003.gif`,
  `${BASE}/error/cat-004.gif`,
  `${BASE}/error/cat-005.gif`,
  `${BASE}/error/cat-006.gif`,
]

export function ErrorFallback() {
  const [src] = useState(() => ERROR_IMAGES[Math.floor(Math.random() * ERROR_IMAGES.length)])

  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <img src={src} alt="A silly cat causing chaos" className="h-40 rounded-xl object-cover" />
      <h1 className="text-2xl font-bold">Oops! Something went horribly wrong.</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Skill issue on our end, ngl. Let’s get you back home to try again.
      </p>
      <button
        onClick={() => window.location.assign('/')}
        className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white shadow hover:bg-teal-700">
        Go home
      </button>
    </main>
  )
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen">
          <ErrorFallback />
        </div>
      )
    }
    return this.props.children
  }
}
