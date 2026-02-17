import NavBar from "./NavBar";
import QuizBoard from "./QuizBoard";

function Practice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard />
    </div>
  );
}

export default Practice;
