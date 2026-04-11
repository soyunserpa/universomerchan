"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2, ChevronRight, Gift, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// ════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════

type Answer = { value: string; label: string; icon?: string };

type Question = {
  id: string;
  field: string;
  title: string;
  subtitle?: string;
  type: "choice" | "text" | "email";
  choices?: Answer[];
  placeholder?: string;
};

const QUIZ_STEPS: Question[] = [
  {
    id: "q1",
    field: "industry",
    title: "¿A qué sector pertenece tu empresa?",
    subtitle: "Nos ayudará a entender vuestro estilo y valores.",
    type: "choice",
    choices: [
      { value: "Tecnología", label: "💻 Tecnología & Software" },
      { value: "hosteleria", label: "🏨 Hostelería & Turismo" },
      { value: "salud", label: "⚕️ Salud & Bienestar" },
      { value: "educacion", label: "🎓 Educación" },
      { value: "construccion", label: "🏗️ Construcción & Inmob." },
      { value: "belleza", label: "✨ Belleza & Cosmética" },
      { value: "agencia", label: "🚀 Agencia & B2B" },
      { value: "otro", label: "🌍 Otro sector" }
    ]
  },
  {
    id: "q2",
    field: "objective",
    title: "¿Para qué ocasión buscas merchandising?",
    type: "choice",
    choices: [
      { value: "Regalos para Empleados", label: "🎁 Welcome Pack & Empleados" },
      { value: "Ferias y Eventos", label: "🎪 Ferias & Eventos Masivos" },
      { value: "Regalos VIP", label: "⭐ Clientes VIP & Cierre de Ventas" },
      { value: "Campaña Promocional", label: "📣 Campaña Promocional Genérica" }
    ]
  },
  {
    id: "q3",
    field: "budget",
    title: "¿Cuál es tu presupuesto aproximado por unidad?",
    type: "choice",
    choices: [
      { value: "Bajo (Menos de 2€)", label: "Bajo (< 2€ / unidad)" },
      { value: "Medio (2€ - 10€)", label: "Intermedio (2€ - 10€ / unidad)" },
      { value: "Alto (10€ - 30€)", label: "Premium (10€ - 30€ / unidad)" },
      { value: "VIP (Más de 30€)", label: "VIP (+30€ / unidad)" }
    ]
  },
  {
    id: "q4",
    field: "companyName",
    title: "¿Cómo se llama vuestra empresa?",
    type: "text",
    placeholder: "Ej. Acme Inc."
  },
  {
    id: "q_email",
    field: "email",
    title: "¡Ya tenemos tu propuesta lista!",
    subtitle: "Déjanos tu email para que te enviemos una copia y descubre los productos recomendados a continuación.",
    type: "email",
    placeholder: "tu@empresa.com"
  }
];

// ════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════

export default function QuizPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [recommendedPack, setRecommendedPack] = useState<any>(null);

  const currentStep = QUIZ_STEPS[currentStepIndex];
  const progress = ((currentStepIndex) / QUIZ_STEPS.length) * 100;
  
  const handleChoice = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStep.field]: value }));
    setTimeout(() => {
      goToNextStep();
    }, 300);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answers[currentStep.field]) return;
    
    if (currentStep.type === "email") {
      submitQuiz();
    } else {
      goToNextStep();
    }
  };

  const goToNextStep = () => {
    if (currentStepIndex < QUIZ_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setIsLoading(true);

    try {
      // 1. Save Lead (Optional Webhook/DB hit) - Fire and forget
      fetch("/api/quiz-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers)
      }).catch(e => console.error("Lead tracking failed:", e));

      // 2. Build Prompt Context from Answers
      const syntheticIndustry = \`\${answers.industry} (Presupuesto: \${answers.budget})\`;
      const syntheticObjective = \`\${answers.objective}\`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: "generate_pack",
          company_name: answers.companyName || "Nuestra Empresa",
          industry: syntheticIndustry,
          objective: syntheticObjective
        }),
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      setRecommendedPack(data.pack);
      setQuizComplete(true);
    } catch (err) {
      console.error(err);
      alert("Hubo un error procesando tu solicitud. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // ════════════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ════════════════════════════════════════════════════════════════

  if (quizComplete && recommendedPack) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col pt-[88px]">
        <Navbar />
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 mt-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{recommendedPack.title}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{recommendedPack.intro}</p>
          </div>

          <div className="space-y-6">
            {recommendedPack.products.map((product: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow">
                <div className="w-full sm:w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Image src={product.image} alt={product.name} width={150} height={150} className="object-contain" />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2.5 py-1 rounded-md">{product.masterCode}</span>
                    {product.price && <span className="font-medium text-brand-red">Desde {product.price}€/ud</span>}
                  </div>
                  <p className="text-gray-600 italic mb-6">"{product.justification}"</p>
                  <div className="mt-auto flex">
                    <Link href={product.url} className="inline-flex items-center gap-2 text-brand-red font-semibold hover:text-red-700 transition-colors">
                      Ver detalle del producto <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm mb-20">
             <h3 className="text-2xl font-bold text-gray-900 mb-4">¿Te ha gustado la selección?</h3>
             <p className="text-gray-600 mb-8 max-w-xl mx-auto">{recommendedPack.closing}</p>
             <Link href="/contacto" className="inline-flex items-center justify-center px-8 py-4 bg-brand-red text-white rounded-xl font-bold hover:bg-red-700 hover:-translate-y-1 transition-all shadow-lg shadow-red-500/30">
               Solicitar Presupuesto Formal
             </Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Quiz Header Minimal */}
      <header className="h-20 border-b border-gray-100 flex items-center px-6 sm:px-12">
        <Link href="/" className="font-bold text-xl text-gray-900 tracking-tight">
          Universo <span className="text-brand-red">Merchan</span>
        </Link>
        <div className="ml-auto w-1/3 sm:w-1/4 h-2 bg-gray-100 rounded-full overflow-hidden">
           <div 
             className="h-full bg-brand-red transition-all duration-500 ease-out" 
             style={{ width: \`\${progress}%\` }}
           />
        </div>
      </header>

      {/* Quiz Body */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 mt-[-5vh]">
        <div className="w-full max-w-2xl mx-auto shadow-2xl shadow-gray-200/50 rounded-3xl p-8 sm:p-14 border border-gray-50/80 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{currentStep.title}</h2>
            {currentStep.subtitle && <p className="text-gray-500 text-base">{currentStep.subtitle}</p>}
          </div>

          {currentStep.type === "choice" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentStep.choices?.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => handleChoice(choice.value)}
                  className={\`flex items-center p-5 rounded-2xl border-2 text-left transition-all duration-200 \${
                    answers[currentStep.field] === choice.value
                      ? "border-brand-red bg-red-50 text-brand-red ring-4 ring-brand-red/10"
                      : "border-gray-100 bg-white hover:border-brand-red/40 hover:shadow-md text-gray-700"
                  }\`}
                >
                  <span className="font-medium text-lg">{choice.label}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep.type === "text" && (
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-6">
              <input
                type="text"
                autoFocus
                value={answers[currentStep.field] || ""}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentStep.field]: e.target.value }))}
                placeholder={currentStep.placeholder}
                className="w-full text-2xl p-5 border-b-2 border-gray-200 focus:border-brand-red focus:outline-none bg-transparent placeholder-gray-300 font-medium transition-colors"
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={!answers[currentStep.field]}
                  className="px-8 py-4 bg-brand-red text-white text-lg font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:hover:translate-y-0 transition-all active:scale-95 flex items-center gap-2"
                >
                  Continuar <ArrowRight size={20} />
                </button>
              </div>
            </form>
          )}

          {currentStep.type === "email" && (
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-6">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={28} />
                <input
                  type="email"
                  required
                  autoFocus
                  value={answers[currentStep.field] || ""}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentStep.field]: e.target.value }))}
                  placeholder={currentStep.placeholder}
                  className="w-full text-xl pl-16 pr-5 py-5 rounded-2xl border-2 border-gray-200 focus:border-brand-red focus:outline-none bg-white font-medium transition-all focus:shadow-lg focus:shadow-brand-red/10"
                />
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={isLoading || !answers[currentStep.field]}
                  className="w-full sm:w-auto px-10 py-5 bg-black text-white text-lg font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Analizando respuestas...
                    </>
                  ) : (
                    <>
                      <Sparkles size={22} className="text-yellow-400" />
                      Ver mis resultados mágicos
                    </>
                  )}
                  <div className="absolute inset-0 h-full w-0 bg-white/20 transition-all duration-[250ms] ease-out group-hover:w-full"></div>
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4">
                Nunca enviamos SPAM. Prometido. Al continuar, aceptas nuestra política de privacidad.
              </p>
            </form>
          )}

        </div>
      </div>
      
      {/* Quiz Footer controls */}
      <div className="h-20 flex items-center justify-between px-6 sm:px-12 pb-4">
        {currentStepIndex > 0 ? (
           <button 
             onClick={goToPrevStep}
             disabled={isLoading}
             className="text-gray-400 hover:text-gray-800 flex items-center gap-2 font-medium transition-colors"
           >
             <ArrowLeft size={16} /> Volver
           </button>
        ) : <div />}
        <div className="text-sm font-semibold text-gray-300">
           {currentStepIndex + 1} / {QUIZ_STEPS.length}
        </div>
      </div>
    </main>
  );
}
