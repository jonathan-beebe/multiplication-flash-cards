import { useEffect, type ReactNode } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import clsx from 'clsx'
import NavBar from '@/components/NavBar'
import PageHeading from '@/components/atoms/PageHeading'
import SecondaryText from '@/components/atoms/SecondaryText'
import { LEVELS, type Level } from '@/lib/division/divisionProblem'

const LEVEL_IDS: Level[] = [1, 2, 3, 4]

function parseDivisionLevel(param: string | undefined): Level {
  const match = param?.match(/^level-(\d+)$/)
  const n = match ? Number(match[1]) : NaN
  if (n >= 1 && n <= 4) return n as Level
  return 1
}

interface DivisionPracticePageProps {
  /** Route slug under /division, e.g. 'area-model'. */
  slug: string
  /** Method name for the document title, e.g. 'Area Model'. */
  title: string
  /** Method subtitle under the shared page heading, e.g. 'Area model method'. */
  subtitle: string
  /** Renders the mode's problem area for the current level. */
  renderProblem: (level: Level) => ReactNode
}

/**
 * Shared shell for the three division practice modes: heading, URL-driven
 * level picker, and the mode's problem area. The level lives in the route
 * (`/division/<slug>/level-N`) so it survives reload and back navigation.
 */
export default function DivisionPracticePage({ slug, title, subtitle, renderProblem }: DivisionPracticePageProps) {
  const { level: levelParam } = useParams<{ level: string }>()
  const navigate = useNavigate()
  const level = parseDivisionLevel(levelParam)

  useEffect(() => {
    if (levelParam !== undefined && levelParam !== `level-${level}`) {
      navigate(`/division/${slug}/level-1`, { replace: true })
    }
  }, [levelParam, level, navigate, slug])

  useEffect(() => {
    document.title = `${title} — Math Flash Cards`
  }, [title])

  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 pt-20 pb-12">
      <NavBar backTo="/division" />

      <div className="w-full max-w-xl flex flex-col items-center gap-8">
        <div className="text-center">
          <PageHeading>Division Practice</PageHeading>
          <SecondaryText className="mt-1">{subtitle}</SecondaryText>
        </div>

        {/* Level picker */}
        <nav
          className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-slate-100 dark:bg-slate-800/50"
          aria-label="Difficulty level">
          {LEVEL_IDS.map((l) => (
            <Link
              key={l}
              to={`/division/${slug}/level-${l}`}
              aria-current={level === l ? 'page' : undefined}
              title={LEVELS[l].description}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                level === l
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
              )}>
              {LEVELS[l].label}
            </Link>
          ))}
        </nav>

        {/* Problem area — the mode keys its problem on level so state resets */}
        {renderProblem(level)}
      </div>
    </main>
  )
}
