import { useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import clsx from 'clsx'
import NavBar from '@/components/NavBar'
import HomeButton from '@/components/atoms/HomeButton'
import { OPERATION_LEVELS, OPERATION_LEVEL_IDS, parseOperationLevel } from '@/lib/engine/operationLevels'
import type { OperationConfig } from './operationConfig'

// Selected-level pill backgrounds; amber follows HomeButton's darker shade so
// white text keeps sufficient contrast (WCAG 1.4.3).
const selectedLevelClasses = {
  green: 'bg-green-600 text-white shadow-sm',
  rose: 'bg-rose-600 text-white shadow-sm',
  amber: 'bg-amber-700 text-white shadow-sm',
}

function OperationMenu<Q>({ config }: { config: OperationConfig<Q> }) {
  const { level: levelParam } = useParams<{ level: string }>()
  const navigate = useNavigate()
  const level = parseOperationLevel(levelParam)
  const headingId = config.routeBase.slice(1)

  useEffect(() => {
    if (levelParam !== undefined && levelParam !== level) {
      navigate(`${config.routeBase}/ones`, { replace: true })
    }
  }, [levelParam, level, navigate, config.routeBase])

  useEffect(() => {
    document.title = `${config.name} — Math Flash Cards`
  }, [config.name])

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-4 pt-16 pb-12 bg-background">
      <NavBar />
      <div className="flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-6 text-4xl font-bold text-text">{config.name}</h1>

        {/* Level picker */}
        <nav
          className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/50 mb-8"
          aria-label="Difficulty level">
          {OPERATION_LEVEL_IDS.map((l) => (
            <Link
              key={l}
              to={`${config.routeBase}/${l}`}
              aria-current={level === l ? 'page' : undefined}
              title={OPERATION_LEVELS[l].description}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                level === l
                  ? selectedLevelClasses[config.color]
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
              )}>
              {OPERATION_LEVELS[l].label}
            </Link>
          ))}
        </nav>

        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <h2
            id={`${headingId}-practice-heading`}
            className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
            Practice
          </h2>
          <div role="group" aria-labelledby={`${headingId}-practice-heading`} className="flex w-full flex-col gap-4">
            <HomeButton to={`${config.routeBase}/${level}/practice/multiple-choice`} color={config.color}>
              Multiple Choice
            </HomeButton>
            <HomeButton to={`${config.routeBase}/${level}/practice/hard-mode`} color={config.color}>
              Hard Mode
            </HomeButton>
          </div>
          <h2 id={`${headingId}-drills-heading`} className="text-2xl font-semibold text-slate-700 dark:text-slate-300">
            Drills
          </h2>
          <div role="group" aria-labelledby={`${headingId}-drills-heading`} className="flex w-full flex-col gap-4">
            <HomeButton
              to={`${config.routeBase}/${level}/1-minute-drill`}
              color={config.color}
              aria-label="1 minute drill">
              1 min
            </HomeButton>
            <HomeButton
              to={`${config.routeBase}/${level}/3-minute-drill`}
              color={config.color}
              aria-label="3 minute drill">
              3 min
            </HomeButton>
            <HomeButton
              to={`${config.routeBase}/${level}/5-minute-drill`}
              color={config.color}
              aria-label="5 minute drill">
              5 min
            </HomeButton>
          </div>
        </div>
      </div>
    </main>
  )
}

export default OperationMenu
