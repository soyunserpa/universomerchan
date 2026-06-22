"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { QuizModal } from "@/components/quiz/QuizModal";
import { Sparkles, ArrowRight } from "lucide-react";

export function HomeQuizButton() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Home");

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="inline-flex items-center gap-2 bg-white text-brand-red font-semibold text-sm px-7 py-3 rounded-full hover:shadow-lg transition-all"
      >
         <Sparkles size={16} /> {t("find_perfect_gift")}
      </button>

      {isOpen && <QuizModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
