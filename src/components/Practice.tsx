import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/QuizBoard";

function Practice() {
  useEffect(() => {
    document.title = "Practice — Multiplication Flash Cards";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard />
    </div>
  );
}

export default Practice;
