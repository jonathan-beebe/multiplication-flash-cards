import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import QuizBoard from "@/components/multiplication/QuizBoard";

function Practice() {
  useEffect(() => {
    document.title = "Practice — Multiplication Flash Cards";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <NavBar />
      <QuizBoard />
    </main>
  );
}

export default Practice;
