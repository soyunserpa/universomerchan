"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Mail, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";

type Answer = { value: string; label: string };

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
    field: "volume",
    title: "¿Qué cantidad aproximada necesitas?",
    subtitle: "El volumen es clave para recomendar los mejores márgenes.",
    type: "choice",
    choices: [
      { value: "S", label: "Menos de 100 uds" },
      { value: "M", label: "De 100 a 500 uds" },
      { value: "L", label: "De 500 a 2.500 uds" },
      { value: "XL", label: "Más de 2.500 uds (Mayorista)" }
    ]
  },
  {
    id: "q2",
    field: "objective",
    title: "¿Cual es el objetivo primario?",
    type: "choice",
    choices: [
      { value: "Regalos para Empleados", label: "🎁 Welcome Pack & Empleados" },
      { value: "Ferias y Eventos", label: "🎪 Branding p/ Ferias & Eventos" },
      { value: "Regalos VIP", label: "⭐ Para Clientes VIP / Cierre Ventas" },
      { value: "Campaña Promocional", label: "📣 Regalo Promocional Genérico" }
    ]
  },
  {
    id: "q3",
    field: "budget",
    title: "¿Cuál es vuestro presupuesto por unidad?",
    type: "choice",
    choices: [
      { value: "Super Económico", label: "Bajo (< 1,50€)" },
      { value: "Económico a Medio", label: "Intermedio (1,50€ - 5€)" },
      { value: "Medio a Premium", label: "Premium (5€ - 20€)" },
      { value: "Luxury", label: "VIP (+20€)" }
    ]
  },
  {
    id: "q4",
    field: "industry",
    title: "¿A qué sector os dedicáis?",
    type: "choice",
    choices: [
      { value: "Tecnología", label: "💻 Tecnología & IT" },
      { value: "Hosteleria", label: "🏨 Turismo & Ocio" },
      { value: "Salud", label: "⚕️ Salud & Farma" },
      { value: "Educacion", label: "🎓 Formación" },
      { value: "Construccion", label: "🏗️ Obras & Inmo" },
      { value: "Belleza", label: "✨ Lifestyle" },
      { value: "Agencia", label: "🚀 Corporativo/Agencia" },
      { value: "Otro", label: "🌍 Otro sector" }
    ]
  },
  {
    id: "q_email",
    field: "email",
    title: "¡Tenemos resultados mágicos para ti!",
    subtitle: "Déjanos el email de contacto de tu empresa para bloquear la oferta personalizada y descubrirla ahora.",
    type: "email",
    placeholder: "pedidos@tuempresa.com"
  }
];

export function QuizModal({ onClose }: { onClose: () => void }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [recommendedPack, setRecommendedPack] = useState<any>(null);

  const currentStep = QUIZ_STEPS[currentStepIndex];
  const progress = ((currentStepIndex) / QUIZ_STEPS.length) * 100;
  
  const handleChoice = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentStep.field]: value }));
    setTimeout(() => goToNextStep(), 250);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answers[currentStep.field]) return;
    if (currentStep.type === "email") submitQuiz();
    else goToNextStep();
  };

  const goToNextStep = () => {
    if (currentStepIndex < QUIZ_STEPS.length - 1) setCurrentStepIndex(p => p + 1);
  };

  const goToPrevStep = () => {
    if (currentStepIndex > 0) setCurrentStepIndex(p => p - 1);
  };

  const submitQuiz = async () => {
    setIsLoading(true);
    try {
      fetch("/api/quiz-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers)
      }).catch(e => console.error(e));

      // Build specific Prompt using new Expert Variables
      const syntheticIndustry = `${answers.industry} (Presupuesto: ${answers.budget}, Volumen: ${answers.volume})`;
      const syntheticObjective = `${answers.objective}`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "generate_pack",
          company_name: answers.email, // using email as company identifier for now
          industry: syntheticIndustry,
          objective: syntheticObjective
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setRecommendedPack(data.pack);
      setQuizComplete(true);
    } catch (err) {
      alert("Error analizando datos. Por favor inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render Full Screen Results Modal
  if (quizComplete && recommendedPack) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto w-full h-full animate-in fade-in zoom-in-95 duration-500">
        <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10">
          <X size={24} className="text-gray-600" />
        </button>
        <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-12 mt-4 sm:mt-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{recommendedPack.title}</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{recommendedPack.intro}</p>
          </div>

          <div className="space-y-6">
            {recommendedPack.products.map((product: any, idx: number) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6">
                <div className="w-full sm:w-40 h-40 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Image src={product.image} alt={product.name} width={120} height={120} className="object-contain" />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <span className="bg-gray-100 px-2.5 py-1 rounded-md">{product.masterCode}</span>
                    {product.price && <span className="font-medium text-brand-red">~{product.price}€/ud</span>}
                  </div>
                  <p className="text-gray-600 italic text-sm mb-4">"{product.justification}"</p>
                  <a href={product.url} target="_blank" className="text-brand-red font-semibold text-sm hover:underline mt-auto">
                    Ver producto en tienda →
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-gray-50 rounded-2xl border border-gray-100 p-8 text-center mb-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Pide tu presupuesto final sin compromiso</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{recommendedPack.closing}</p>
            <a href={`mailto:pedidos@universomerchan.com?subject=Me Interesa el Pack ${encodeURIComponent(recommendedPack.title)}`} className="inline-flex items-center justify-center px-8 py-4 bg-brand-red text-white flex gap-2 rounded-xl font-bold hover:bg-red-700 hover:-translate-y-1 transition-all shadow-lg">
              Contactar con Ventas
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl min-h-[500px] h-full sm:h-auto sm:max-h-[85vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-8 duration-500">
        
        {/* Header Slider */}
        <div className="h-14 flex items-center px-6 relative border-b border-gray-100 flex-shrink-0">
          {currentStepIndex > 0 ? (
            <button onClick={goToPrevStep} className="absolute left-6 text-gray-400 hover:text-gray-800 transition-colors">
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[200px] mx-auto hidden sm:block">
             <div className="h-full bg-brand-red transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
          </div>
          <button onClick={onClose} className="absolute right-6 text-gray-400 hover:text-gray-800 transition-colors bg-gray-50 p-1.5 rounded-full">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">{currentStep.title}</h2>
            {currentStep.subtitle && <p className="text-gray-500">{currentStep.subtitle}</p>}
          </div>

          {currentStep.type === "choice" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {currentStep.choices?.map((choice) => (
                <button
                  key={choice.value}
                  onClick={() => handleChoice(choice.value)}
                  className={`flex items-center p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                    answers[currentStep.field] === choice.value
                      ? "border-brand-red bg-red-50 text-brand-red ring-4 ring-brand-red/10"
                      : "border-gray-100 bg-white hover:border-brand-red/40 hover:shadow-md text-gray-700"
                  }`}
                >
                  <span className="font-semibold text-base sm:text-lg">{choice.label}</span>
                </button>
              ))}
            </div>
          )}

          {currentStep.type === "email" && (
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-6 max-w-lg w-full mb-8">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <input
                  type="email"
                  required
                  autoFocus
                  value={answers[currentStep.field] || ""}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [currentStep.field]: e.target.value }))}
                  placeholder={currentStep.placeholder}
                  className="w-full text-lg pl-14 pr-5 py-4 rounded-xl border-2 border-gray-200 focus:border-brand-red focus:outline-none bg-white font-medium transition-all focus:shadow-lg focus:shadow-brand-red/10"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !answers[currentStep.field]}
                className="w-full py-4 bg-brand-red text-white text-lg font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <><Loader2 size={20} className="animate-spin" /> Analizando tu perfil...</>
                ) : (
                  <><Sparkles size={20} /> Generar mi Pack Mágico</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Descubrirás el pack directamente en esta pantalla. Zero Spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
