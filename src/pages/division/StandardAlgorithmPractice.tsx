import DivisionPracticePage from '@/components/division/DivisionPracticePage'
import StandardAlgorithmProblem from '@/components/division/standardAlgorithm/StandardAlgorithmProblem'

export default function StandardAlgorithmPractice() {
  return (
    <DivisionPracticePage
      slug="standard-algorithm"
      title="Standard Algorithm"
      subtitle="Standard algorithm"
      renderProblem={(level) => <StandardAlgorithmProblem key={level} level={level} />}
    />
  )
}
