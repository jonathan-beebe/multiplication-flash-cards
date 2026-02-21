import { useEffect } from "react";
import NavBar from "@/components/NavBar";
import HardModeQuizBoard from "@/components/multiplication/HardModeQuizBoard";

function HardModePractice() {
  useEffect(() => {
    document.title = "Hard Mode — Multiplication Flash Cards";
  }, []);

  return (
    <main className="flex h-dvh items-center justify-center bg-background px-4 overflow-hidden">
      <NavBar />
      <HardModeQuizBoard />
    </main>
  );
}

export default HardModePractice;
