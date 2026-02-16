import { useState, useCallback, useMemo } from "react";
import NavBar from "./NavBar";

interface Question {
  a: number;
  b: number;
}

function generateQuestion(min: number = 3, max: number = 12): Question {
  const range = max - min + 1;
  return {
    a: Math.floor(Math.random() * range) + min,
    b: Math.floor(Math.random() * range) + min,
  };
}

function generateChoices(a: number, b: number): number[] {
  const correct = a * b;
  const choices = new Set<number>([correct]);

  // Try to add adjacent answers (a × (b±1))
  const adjacentOptions = [];
  if (b > 3) adjacentOptions.push(a * (b - 1));
  if (b < 12) adjacentOptions.push(a * (b + 1));

  for (const adj of adjacentOptions) {
    if (choices.size < 3 && !choices.has(adj)) {
      choices.add(adj);
    }
  }

  // Fill remaining slots with random numbers 9-144
  while (choices.size < 3) {
    const random = Math.floor(Math.random() * 136) + 9;
    if (!choices.has(random)) {
      choices.add(random);
    }
  }

  // Shuffle the array (Fisher-Yates)
  const result = Array.from(choices);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function Practice() {
  const [question, setQuestion] = useState<Question>(generateQuestion);
  const [wrongAnswers, setWrongAnswers] = useState<Set<number>>(new Set());
  const [showCorrect, setShowCorrect] = useState(false);

  const choices = useMemo(() => {
    return generateChoices(question.a, question.b);
  }, [question]);

  const correctAnswer = question.a * question.b;

  const handleAnswer = useCallback(
    (answer: number) => {
      if (answer === correctAnswer) {
        setShowCorrect(true);
        setTimeout(() => {
          setQuestion(generateQuestion());
          setWrongAnswers(new Set());
          setShowCorrect(false);
        }, 300);
      } else {
        setWrongAnswers((prev) => new Set(prev).add(answer));
      }
    },
    [correctAnswer]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <NavBar />
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex h-[350px] w-[250px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="text-center">
            <span className="text-5xl font-bold text-slate-900 dark:text-slate-100">
              {question.a} × {question.b}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {choices.map((choice) => {
            const isWrong = wrongAnswers.has(choice);
            const isCorrect = showCorrect && choice === correctAnswer;
            return (
              <button
                key={choice}
                onClick={() => handleAnswer(choice)}
                disabled={isWrong || showCorrect}
                className={`min-w-[72px] rounded-xl px-6 py-4 text-xl font-semibold shadow-lg transition-colors ${
                  isCorrect
                    ? "bg-green-500 text-white dark:bg-green-600"
                    : isWrong
                      ? "cursor-not-allowed bg-red-500 text-white dark:bg-red-600"
                      : "bg-slate-200 text-slate-900 hover:bg-slate-300 active:bg-slate-400 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:active:bg-slate-500"
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Practice;
