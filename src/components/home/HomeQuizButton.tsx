"use client";

import { useState } from "react";
import { QuizModal } from "@/components/quiz/QuizModal";
import { Sparkles, ArrowRight } from "lucide-react";

export function HomeQuizButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="inline-flex items-center gap-2 bg-white text-brand-red font-semibold text-sm px-7 py-3 rounded-full hover:shadow-lg transition-all"
      >
         <Sparkles size={16} /> Encontrar regalo perfecto
      </button>

      {isOpen && <QuizModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
