import NavBar from "./NavBar";
import QuizBoard from "./QuizBoard";

function Practice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-900">
      <NavBar />
      <QuizBoard />
    </div>
  );
}

export default Practice;
