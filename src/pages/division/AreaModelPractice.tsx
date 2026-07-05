import DivisionPracticePage from '@/components/division/DivisionPracticePage'
import AreaModelProblem from '@/components/division/areaMode/AreaModelProblem'

export default function AreaModelPractice() {
  return (
    <DivisionPracticePage
      slug="area-model"
      title="Area Model"
      subtitle="Area model method"
      renderProblem={(level) => <AreaModelProblem key={level} level={level} />}
    />
  )
}
