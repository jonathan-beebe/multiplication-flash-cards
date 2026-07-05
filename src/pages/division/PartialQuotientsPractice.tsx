import DivisionPracticePage from '@/components/division/DivisionPracticePage'
import PartialQuotientsProblem from '@/components/division/partialQuotients/PartialQuotientsProblem'

export default function PartialQuotientsPractice() {
  return (
    <DivisionPracticePage
      slug="partial-quotients"
      title="Partial Quotients"
      subtitle="Partial quotients method"
      renderProblem={(level) => <PartialQuotientsProblem key={level} level={level} />}
    />
  )
}
