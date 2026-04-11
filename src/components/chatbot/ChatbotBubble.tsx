"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Gift,
  Search,
  HelpCircle,
  Package,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Replace,
} from "lucide-react";
import { QuizModal } from "@/components/quiz/QuizModal";

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

type PackProduct = {
  masterCode: string;
  name: string;
  image: string;
  price: string | null;
  url: string;
  justification: string;
};

type Pack = {
  title: string;
  intro: string;
  products: PackProduct[];
  closing: string;
};

type CatalogProduct = {
  name: string;
  masterCode: string;
  image: string;
  price: string | null;
  url: string;
  colors: string;
};

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "pack" | "product-cards" | "options";
  pack?: Pack;
  products?: CatalogProduct[];
  options?: { label: string; icon?: string; action: string; data?: any }[];
};

// ════════════════════════════════════════════════════════════════
// WIZARD QUESTIONS
// ════════════════════════════════════════════════════════════════

const WIZARD_QUESTIONS = [
  {
    question: "¿Cuál es el nombre de tu empresa?",
    placeholder: "Ej: Acme Solutions",
    field: "company_name",
  },
  {
    question: "¿A qué se dedica tu empresa?",
    placeholder: "Ej: Consultoría tecnológica",
    field: "industry",
  },
  {
    question: "¿Cuál es el objetivo del merchandising?",
    placeholder: "Ej: Fidelizar clientes premium",
    field: "objective",
  },
];

// ════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════

export function ChatbotBubble() {
  // ─── State ───
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const [input, setInput] = useState("");
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Mode
  const [mode, setMode] = useState<"menu" | "wizard" | "search" | "freetext">("menu");

  // Messages
  const [messages, setMessages] = useState<ChatMsg[]>([]);

  // Wizard
  const [wizardStep, setWizardStep] = useState(-1);
  const [wizardAnswers, setWizardAnswers] = useState({
    company_name: "",
    industry: "",
    objective: "",
  });

  // Current pack (for regenerate/swap)
  const [currentPack, setCurrentPack] = useState<Pack | null>(null);

  // Loading
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Pensando...");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Scroll ───
  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  useEffect(scrollToBottom, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasBeenOpened) setHasBeenOpened(true);
  }, [isOpen, hasBeenOpened]);

  useEffect(() => {
    if ((mode === "search" || mode === "freetext" || (mode === "wizard" && wizardStep >= 0)) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, wizardStep]);

  // ─── Helpers ───
  function addMsg(msg: Partial<ChatMsg>) {
    const full: ChatMsg = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 5),
      role: "assistant",
      content: "",
      type: "text",
      ...msg,
    };
    setMessages((prev) => [...prev, full]);
  }

  function resetAll() {
    setMode("menu");
    setMessages([]);
    setWizardStep(-1);
    setWizardAnswers({ company_name: "", industry: "", objective: "" });
    setCurrentPack(null);
    setInput("");
    setIsLoading(false);
  }

  // ════════════════════════════════════════════════════════════════
  // WIZARD — Pack Corporativo
  // ════════════════════════════════════════════════════════════════

  function startMegaQuiz() {
    setIsOpen(false);
    setShowQuizModal(true);
  }

  function startWizard() {
    resetAll();
    setMode("wizard");
    setWizardStep(0);
    addMsg({
      content: "¡Hola! 👋 Voy a crear un pack de merchandising a medida para tu empresa. Necesito 3 datos rápidos.",
    });
    setTimeout(() => {
      addMsg({ content: WIZARD_QUESTIONS[0].question });
    }, 500);
  }

  async function handleWizardAnswer(text: string) {
    // Save user answer
    addMsg({ role: "user", content: text });

    const newAnswers = { ...wizardAnswers };
    const field = WIZARD_QUESTIONS[wizardStep].field as keyof typeof wizardAnswers;
    newAnswers[field] = text;
    setWizardAnswers(newAnswers);

    const nextStep = wizardStep + 1;
    setWizardStep(nextStep);

    if (nextStep < WIZARD_QUESTIONS.length) {
      // Next question
      setTimeout(() => {
        addMsg({ content: WIZARD_QUESTIONS[nextStep].question });
      }, 400);
    } else {
      // All answers collected → generate pack
      await generatePack(newAnswers);
    }
  }

  async function generatePack(answers: typeof wizardAnswers) {
    setIsLoading(true);
    setLoadingText("Analizando tu empresa...");

    // Loading messages sequence
    const loadingSteps = [
      { text: "Buscando en +2.400 productos...", delay: 2000 },
      { text: "Seleccionando los mejores para ti...", delay: 4000 },
      { text: "Preparando tu propuesta personalizada...", delay: 6000 },
    ];

    for (const step of loadingSteps) {
      setTimeout(() => {
        if (isLoading) setLoadingText(step.text);
      }, step.delay);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_pack",
          ...answers,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const pack: Pack = data.pack;
      setCurrentPack(pack);
      setIsLoading(false);

      // Show pack
      addMsg({
        content: pack.intro,
      });

      setTimeout(() => {
        addMsg({
          type: "pack",
          content: pack.title,
          pack,
        });
      }, 600);

      setTimeout(() => {
        addMsg({
          content: pack.closing,
        });
      }, 1200);

      setTimeout(() => {
        addMsg({
          type: "options",
          content: "¿Qué te parece?",
          options: [
            { label: "🔄 Generar otro pack", action: "regenerate" },
            { label: "🔍 Buscar productos", action: "start_search" },
            { label: "💬 Tengo una duda", action: "start_freetext" },
          ],
        });
      }, 1800);
    } catch (err: any) {
      setIsLoading(false);
      addMsg({
        content: `Lo siento, hubo un error generando tu propuesta. ¿Quieres intentarlo de nuevo?`,
      });
      addMsg({
        type: "options",
        content: "",
        options: [
          { label: "🔄 Intentar de nuevo", action: "regenerate" },
          { label: "🏠 Volver al menú", action: "reset" },
        ],
      });
    }
  }

  async function handleRegenerate() {
    addMsg({ role: "user", content: "Quiero ver otro pack diferente" });
    await generatePack(wizardAnswers);
  }

  async function handleSwapProduct(masterCode: string) {
    addMsg({ role: "user", content: `Quiero cambiar el producto ${masterCode}` });
    setIsLoading(true);
    setLoadingText("Buscando alternativa...");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "swap_product",
          masterCodeToReplace: masterCode,
          currentPack,
          ...wizardAnswers,
        }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.product) {
        const newProduct: PackProduct = data.product;

        // Update current pack
        const updatedPack = { ...currentPack! };
        updatedPack.products = updatedPack.products.map((p) =>
          p.masterCode === masterCode ? newProduct : p
        );
        setCurrentPack(updatedPack);

        addMsg({
          content: `He cambiado **${masterCode}** por un nuevo producto:`,
        });

        setTimeout(() => {
          addMsg({
            type: "pack",
            content: "Pack actualizado",
            pack: updatedPack,
          });
        }, 400);

        setTimeout(() => {
          addMsg({
            type: "options",
            content: "¿Algo más?",
            options: [
              { label: "🔄 Generar otro pack", action: "regenerate" },
              { label: "✅ Me gusta este pack", action: "start_freetext" },
            ],
          });
        }, 1000);
      }
    } catch {
      setIsLoading(false);
      addMsg({ content: "Error buscando alternativa. Inténtalo de nuevo." });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // SEARCH — Catálogo directo
  // ════════════════════════════════════════════════════════════════

  function startSearch() {
    setMode("search");
    setMessages([]);
    setWizardStep(-1);
    addMsg({
      content: "¿Qué producto buscas? Escribe lo que necesites: mochilas, bolígrafos, camisetas, termos...",
    });
  }

  async function handleSearch(query: string) {
    addMsg({ role: "user", content: query });
    setIsLoading(true);
    setLoadingText("Buscando...");

    try {
      const res = await fetch("/api/catalog-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const products: CatalogProduct[] = data.products || [];
      setIsLoading(false);

      if (products.length === 0) {
        addMsg({
          content: `No encontré resultados para "${query}". Prueba con: mochilas, bolígrafos, termos, camisetas...`,
        });
      } else {
        addMsg({
          type: "product-cards",
          content: `${products.length} resultado${products.length > 1 ? "s" : ""} para "${query}"`,
          products,
        });
        setTimeout(() => {
          addMsg({
            type: "options",
            content: "",
            options: [
              { label: "🔍 Otra búsqueda", action: "start_search" },
              { label: "🎁 Crear pack corporativo", action: "start_wizard" },
            ],
          });
        }, 600);
      }
    } catch {
      setIsLoading(false);
      addMsg({ content: "Error buscando productos. Inténtalo de nuevo." });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // FREETEXT
  // ════════════════════════════════════════════════════════════════

  function startFreetext() {
    setMode("freetext");
    setMessages([]);
    setWizardStep(-1);
    addMsg({
      content: "Escríbeme tu duda. Puedo ayudarte con plazos de entrega, técnicas de marcaje, cantidades mínimas, materiales...",
    });
  }

  // ════════════════════════════════════════════════════════════════
  // OPTION CLICK HANDLER
  // ════════════════════════════════════════════════════════════════

  function handleOptionClick(action: string, data?: any) {
    switch (action) {
      case "start_mega_quiz":
        startMegaQuiz();
        break;
      case "start_wizard":
        startWizard();
        break;
      case "start_search":
        startSearch();
        break;
      case "start_freetext":
        startFreetext();
        break;
      case "regenerate":
        handleRegenerate();
        break;
      case "swap":
        handleSwapProduct(data);
        break;
      case "reset":
        resetAll();
        break;
      default:
        break;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // SUBMIT
  // ════════════════════════════════════════════════════════════════

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    if (mode === "wizard" && wizardStep >= 0 && wizardStep < WIZARD_QUESTIONS.length) {
      handleWizardAnswer(text);
    } else if (mode === "search") {
      handleSearch(text);
    } else if (mode === "freetext") {
      // Para dudas free text podrías conectar con otro endpoint
      addMsg({ role: "user", content: text });
      addMsg({
        content: "Para consultas personalizadas, escríbenos a **pedidos@universomerchan.com** o llámanos. ¿Te ayudo con algo más?",
        type: "options",
        options: [
          { label: "🎁 Crear pack corporativo", action: "start_wizard" },
          { label: "🔍 Buscar productos", action: "start_search" },
        ],
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // COMPUTED
  // ════════════════════════════════════════════════════════════════

  const showInput =
    mode === "search" ||
    mode === "freetext" ||
    (mode === "wizard" && wizardStep >= 0 && wizardStep < WIZARD_QUESTIONS.length);

  const currentPlaceholder =
    mode === "wizard" && wizardStep >= 0 && wizardStep < WIZARD_QUESTIONS.length
      ? WIZARD_QUESTIONS[wizardStep].placeholder
      : mode === "search"
        ? "Busca: mochilas, bolígrafos, termos..."
        : mode === "freetext"
          ? "Escribe tu pregunta..."
          : "Selecciona una opción...";

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ═══ BUBBLE ═══ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-[60px] h-[60px] bg-brand-red text-white rounded-full shadow-2xl hover:bg-red-700 transition-all transform hover:scale-110 flex items-center justify-center focus:outline-none"
        aria-label={isOpen ? "Cerrar chat" : "Abrir asistente"}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!hasBeenOpened && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* ═══ WINDOW ═══ */}
      {isOpen && (
        <div className="fixed bottom-[88px] right-6 z-50 w-[92vw] sm:w-[400px] h-[75vh] sm:h-[580px] max-h-[700px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4">
          
          {/* ─── Header ─── */}
          <div className="bg-brand-red px-5 py-4 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Asistente Merchan</h3>
                <p className="text-white/70 text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                  Respuesta automática
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mode !== "menu" && (
                <button
                  onClick={resetAll}
                  title="Volver al menú"
                  className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                title="Cerrar"
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ─── Messages ─── */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50/80 scroll-smooth">
            
            {/* MENU */}
            {mode === "menu" && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-brand-red/5 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                  <Package size={28} className="text-brand-red" />
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">¡Hola! Soy tu asistente.</p>
                <p className="text-xs text-gray-500 mb-6 max-w-[260px]">
                  Te ayudo a encontrar el merchandising perfecto para tu empresa
                </p>

                <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
                  <button
                    onClick={startMegaQuiz}
                    className="bg-brand-red text-white py-3.5 px-4 rounded-xl text-sm font-semibold shadow-md hover:bg-red-700 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                  >
                    <Sparkles size={16} />
                    Propuesta de packs por sector
                  </button>
                  <button
                    onClick={startWizard}
                    className="bg-white border border-gray-200 text-gray-700 py-3.5 px-4 rounded-xl text-sm font-semibold shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                  >
                    <Gift size={16} />
                    Crear pack corporativo (vía Chat)
                  </button>
                  <button
                    onClick={startSearch}
                    className="bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl text-sm font-medium shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
                  >
                    <Search size={16} />
                    Buscar en catálogo
                  </button>
                  <button
                    onClick={startFreetext}
                    className="bg-white border border-gray-200 text-gray-500 py-2.5 px-4 rounded-xl text-xs shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <HelpCircle size={14} />
                    Tengo una duda
                  </button>
                  <a
                    href="https://wa.me/34614446640"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#25D366]/10 border border-[#25D366]/20 text-[#128C7E] py-2.5 px-4 rounded-xl text-xs shadow-sm hover:bg-[#25D366]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-1 font-semibold"
                  >
                    <svg viewBox="0 0 448 512" className="w-[14px] h-[14px] fill-current">
                      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157.1zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                    </svg>
                    Contactar por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {mode !== "menu" && (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div key={msg.id}>
                    
                    {/* ─── Text bubble ─── */}
                    {msg.type !== "pack" && msg.type !== "product-cards" && msg.content && (
                      <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex gap-2.5 max-w-[88%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                          <div className="mt-0.5 flex-shrink-0">
                            {msg.role === "user" ? (
                              <div className="w-7 h-7 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center">
                                <User size={13} />
                              </div>
                            ) : (
                              <div className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center">
                                <Bot size={13} />
                              </div>
                            )}
                          </div>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-brand-red text-white rounded-tr-sm"
                                : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
                            }`}
                          >
                            {msg.content.split(/(\*\*.*?\*\*)/).map((part, k) =>
                              part.startsWith("**") && part.endsWith("**") ? (
                                <strong key={k} className="font-semibold">{part.slice(2, -2)}</strong>
                              ) : (
                                <span key={k}>{part}</span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── PACK CARD ─── */}
                    {msg.type === "pack" && msg.pack && (
                      <div className="ml-9 space-y-2 mt-2">
                        {/* Pack title */}
                        <div className="bg-gradient-to-r from-brand-red/5 to-transparent border border-brand-red/10 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Gift size={16} className="text-brand-red" />
                            <span className="text-sm font-bold text-gray-900">{msg.pack.title}</span>
                          </div>
                          <span className="text-[11px] text-gray-400">{msg.pack.products.length} productos seleccionados</span>
                        </div>

                        {/* Product cards */}
                        {msg.pack.products.map((product) => (
                          <div
                            key={product.masterCode}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                          >
                            {/* Product image + info */}
                            <div className="flex gap-3 p-3">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-16 h-16 rounded-lg object-contain flex-shrink-0 bg-gray-50 border border-gray-50"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-800 leading-tight">{product.name}</p>
                                <p className="text-[10px] text-gray-400 tracking-wide mt-0.5">{product.masterCode}</p>
                                {product.price && (
                                  <p className="text-sm font-bold text-brand-red mt-1">
                                    desde ~{product.price}€
                                    <span className="text-[10px] text-gray-400 font-normal">/ud</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Justification */}
                            <div className="px-3 pb-2">
                              <p className="text-[11px] text-gray-500 italic leading-snug bg-gray-50 rounded-lg px-3 py-2">
                                💡 {product.justification}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex border-t border-gray-50">
                              <a
                                href={product.url}
                                className="flex-1 py-2 text-[11px] font-medium text-brand-red hover:bg-red-50 transition-colors flex items-center justify-center gap-1 border-r border-gray-50"
                              >
                                <ExternalLink size={11} /> Ver producto
                              </a>
                              <button
                                onClick={() => handleOptionClick("swap", product.masterCode)}
                                className="flex-1 py-2 text-[11px] font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                              >
                                <Replace size={11} /> Cambiar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ─── SEARCH PRODUCT CARDS ─── */}
                    {msg.type === "product-cards" && msg.products && (
                      <div className="space-y-2 mt-1">
                        <div className="flex justify-start">
                          <div className="flex gap-2.5 max-w-[88%]">
                            <div className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                              <Bot size={13} />
                            </div>
                            <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm text-[13px] text-gray-800">
                              {msg.content}
                            </div>
                          </div>
                        </div>
                        <div className="ml-9 space-y-2">
                          {msg.products.map((p) => (
                            <a
                              key={p.masterCode}
                              href={p.url}
                              className="flex gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-brand-red/30 hover:shadow-md transition-all group"
                            >
                              {p.image && (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-14 h-14 rounded-lg object-contain flex-shrink-0 bg-gray-50"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-gray-800 truncate group-hover:text-brand-red transition-colors">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-gray-400">{p.masterCode}</p>
                                {p.price && (
                                  <p className="text-sm font-bold text-brand-red mt-0.5">~{p.price}<span className="text-[10px] text-gray-400 font-normal">/ud</span></p>
                                )}
                                {p.colors && <p className="text-[10px] text-gray-500 mt-0.5">🎨 {p.colors}</p>}
                              </div>
                              <ArrowRight size={14} className="text-gray-300 group-hover:text-brand-red self-center flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ─── OPTIONS (only on last message) ─── */}
                    {msg.options && i === messages.length - 1 && !isLoading && (
                      <div className="mt-2 ml-9 flex flex-wrap gap-1.5">
                        {msg.options.map((opt, j) => (
                          <button
                            key={j}
                            onClick={() => handleOptionClick(opt.action, opt.data)}
                            className="bg-white border border-brand-red/20 text-brand-red px-3 py-1.5 rounded-full text-[12px] font-medium hover:bg-red-50 hover:border-brand-red/40 transition-all active:scale-95 shadow-sm"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* ─── Loading ─── */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 bg-brand-red text-white rounded-full flex items-center justify-center mt-0.5">
                        <Bot size={13} />
                      </div>
                      <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-gray-100 shadow-sm flex items-center gap-2 text-brand-red text-xs italic">
                        <Loader2 size={14} className="animate-spin" />
                        {loadingText}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ─── Input ─── */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={currentPlaceholder}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-full pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/50 transition-all disabled:opacity-40"
                disabled={isLoading || !showInput}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !showInput}
                className="p-2.5 bg-brand-red text-white rounded-full hover:bg-red-700 disabled:opacity-30 transition-all flex-shrink-0 active:scale-95"
                aria-label="Enviar"
              >
                <Send size={15} />
              </button>
            </div>
            <p className="text-center mt-1.5 text-[9px] text-gray-300 tracking-widest uppercase">
              Universo Merchan · universomerchan.com
            </p>
          </form>
        </div>
      )}

      {showQuizModal && <QuizModal onClose={() => setShowQuizModal(false)} />}
    </>
  );
}
