"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Gift, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const WIZARD_QUESTIONS = [
  '¿Cuál es el nombre de tu empresa?',
  '¿A qué se dedica tu empresa?',
  '¿Cuál es el objetivo específico de la campaña o acción?'
];

type CatalogProduct = {
  name: string;
  masterCode: string;
  image: string;
  price: string | null;
  url: string;
  colors: string;
};

export function ChatbotBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [searchMode, setSearchMode] = useState(false);

  const { messages, setMessages, status, sendMessage } = useChat({
    api: '/api/chat',
    maxSteps: 5,
  });

  const [wizardState, setWizardState] = useState({ step: -1, answers: { company_name: '', industry: '', objective: '' } });
  const [isWizardLoading, setIsWizardLoading] = useState(false);

  const isLoading = status === 'submitted' || status === 'streaming' || isWizardLoading;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, wizardState.step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const startWizard = () => {
    setSearchMode(false);
    setWizardState({ step: 0, answers: { company_name: '', industry: '', objective: '' } });
    setMessages([
      { id: Date.now().toString(), role: 'assistant', content: '¡Hola! Soy tu asistente de merchandising y te ayudaré a crear un pack emocionalmente memorable.' } as any,
      { id: (Date.now() + 1).toString(), role: 'assistant', content: WIZARD_QUESTIONS[0] } as any
    ]);
  };

  const startSearch = () => {
    setSearchMode(true);
    setWizardState({ step: -1, answers: { company_name: '', industry: '', objective: '' } });
    setMessages([
      { id: Date.now().toString(), role: 'assistant', content: '¿Qué producto buscas? Puedes escribir lo que necesites: mochilas, bolígrafos, camisetas, termos, libretas...' } as any,
    ]);
  };

  const searchCatalog = async (query: string) => {
    setIsWizardLoading(true);
    setMessages(prev => [...prev, { id: Date.now().toString() + 'u', role: 'user', content: query } as any]);

    const loaderId = 'search-loader-' + Date.now();
    setTimeout(() => {
      setMessages(prev => [...prev, { id: loaderId, role: 'assistant', content: 'Dame 10 segundos...' } as any]);
    }, 100);

    try {
      const res = await fetch('/api/catalog-search', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const products: CatalogProduct[] = data.products || [];

      let resultContent = '';
      if (products.length === 0) {
        resultContent = `No encontré resultados para "${query}". Prueba con otro término, por ejemplo: mochilas, bolígrafos, termos, camisetas...`;
      } else {
        products.forEach(p => {
          if (p.image) {
            resultContent += `[![${p.name}](${p.image})](${p.url})\n\n`;
          }
          resultContent += `**[${p.name}](${p.url})**`;
          if (p.price) resultContent += ` — *desde ~${p.price}/ud*`;
          if (p.colors) resultContent += `\n\n🎨 ${p.colors}`;
          resultContent += `\n\n---\n\n`;
        });
        resultContent += `¿Quieres buscar otra cosa o necesitas más detalles de algún producto?`;
      }

      setMessages(prev =>
        prev.filter(m => m.id !== loaderId).concat({
          id: Date.now().toString(),
          role: 'assistant',
          content: resultContent,
        } as any)
      );
    } catch {
      setMessages(prev =>
        prev.filter(m => m.id !== loaderId).concat({
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Hubo un error buscando productos. Inténtalo de nuevo.',
        } as any)
      );
    } finally {
      setIsWizardLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Modo búsqueda directa (sin OpenAI)
    if (searchMode) {
      const query = input.trim();
      setInput('');
      await searchCatalog(query);
      return;
    }

    // Si estamos en modo Mago (Wizard)
    if (wizardState.step >= 0 && wizardState.step < 3) {
      const userText = input.trim();
      setInput('');

      const newAnswers = { ...wizardState.answers };
      if (wizardState.step === 0) newAnswers.company_name = userText;
      if (wizardState.step === 1) newAnswers.industry = userText;
      if (wizardState.step === 2) newAnswers.objective = userText;

      const nextStep = wizardState.step + 1;

      setMessages(prev => [...prev, { id: Date.now().toString() + 'u', role: 'user', content: userText } as any]);
      setWizardState({ step: nextStep, answers: newAnswers });

      if (nextStep < 3) {
        setTimeout(() => {
          setMessages(prev => [...prev, { id: Date.now().toString() + 'a', role: 'assistant', content: WIZARD_QUESTIONS[nextStep] } as any]);
        }, 300);
      } else {
        setIsWizardLoading(true);
        const loaderId = 'loader-' + Date.now();
        setTimeout(() => {
          setMessages(prev => [...prev, { id: loaderId, role: 'assistant', content: 'Dame 10 segundos... estoy buscando los mejores productos para ti.' } as any]);
        }, 300);

        try {
          const res = await fetch('/api/generate-pack', {
            method: 'POST', body: JSON.stringify(newAnswers)
          });
          const data = await res.json();
          setMessages(prev => prev.filter(m => m.id !== loaderId).concat({ id: Date.now().toString(), role: 'assistant', content: data.markdown || data.error } as any));
        } catch {
          setMessages(prev => prev.filter(m => m.id !== loaderId).concat({ id: Date.now().toString(), role: 'assistant', content: 'Hubo un error al generar el pack. Por favor, reinténtalo o pregúntame directamente.' } as any));
        } finally {
          setIsWizardLoading(false);
          setWizardState(w => ({ ...w, step: 5 }));
        }
      }
      return;
    }

    // Chat libre normal (con OpenAI)
    sendMessage({ content: input, role: 'user' });
    setInput('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[110px] right-6 md:bottom-[100px] md:right-8 z-50 p-4 bg-brand-red text-white rounded-full shadow-2xl hover:bg-red-700 transition-all transform hover:scale-110 flex items-center justify-center focus:outline-none"
        aria-label="Abrir asistente de compras"
      >
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
      </button>

      {isOpen && (
        <div className="fixed bottom-[180px] right-6 md:bottom-[170px] md:right-8 z-50 w-[90vw] md:w-[380px] h-[75vh] md:h-[600px] max-h-[800px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4">

          {/* Header */}
          <div className="bg-brand-red px-5 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm">Asistente Merchan</h3>
                <p className="text-white/80 text-xs">Expertos en Regalo Corporativo</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} title="Cerrar chat" aria-label="Cerrar chat" className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 overflow-y-auto p-4 bg-surface-50 scroll-smooth">
            {messages.length === 0 && wizardState.step === -1 && !searchMode && (
              <div className="text-center text-gray-500 mt-10">
                <Bot size={40} className="mx-auto text-brand-red/50 mb-3" />
                <p className="text-sm font-medium">¡Hola! Soy tu asistente de Universo Merchan.</p>
                <p className="text-xs mt-1 opacity-70">¿Qué necesitas hoy?</p>

                <div className="mt-8 flex flex-col gap-2 w-full px-4">
                  <button type="button" onClick={startWizard} className="bg-white border border-brand-red text-brand-red py-2 px-4 rounded-xl text-sm shadow-sm hover:bg-red-50 flex items-center justify-center gap-2 font-medium">
                    <Gift size={16} /> Crear Pack Corporativo
                  </button>
                  <button type="button" onClick={startSearch} className="bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-xl text-sm shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Search size={16} /> Buscar en Catálogo
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((m: any) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                    <div className="mt-1 flex-shrink-0">
                      {m.role === 'user' ? (
                        <div className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center">
                          <User size={14} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-brand-red text-white rounded-full flex items-center justify-center">
                          <Bot size={14} />
                        </div>
                      )}
                    </div>

                    <div className={`px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-red-50 text-gray-900 border border-brand-red/20 rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'}`}>
                      {m.toolInvocations?.length || (m.parts && m.parts.some((p: any) => p.type && p.type.includes('tool'))) ? (
                        <div className="flex items-center gap-2 text-brand-red text-xs italic">
                          <Loader2 size={12} className="animate-spin" /> Buscando catálogos...
                        </div>
                      ) : null}

                      {m.content && (
                        <div className="prose prose-sm prose-p:leading-snug prose-a:text-brand-red prose-img:rounded-lg prose-img:w-full prose-img:max-h-40 prose-img:object-contain prose-img:my-1 font-medium">
                          <ReactMarkdown
                            components={{
                              img: ({ src, alt }) => (
                                <img src={src} alt={alt || ''} loading="lazy" className="rounded-lg w-full max-h-40 object-contain my-1 border border-gray-100" />
                              ),
                              a: ({ href, children, ...props }) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline" {...props}>{children}</a>
                              ),
                            }}
                          >{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%] flex-row">
                    <div className="mt-1 flex-shrink-0">
                      <div className="w-8 h-8 bg-brand-red text-white rounded-full flex items-center justify-center">
                        <Bot size={14} />
                      </div>
                    </div>
                    <div className="px-4 py-3 rounded-2xl text-sm bg-white border border-gray-100 shadow-sm text-brand-red rounded-tl-sm flex items-center gap-2 italic">
                      <Loader2 size={16} className="animate-spin" /> Dame 10 segundos...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center relative">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={searchMode ? "Busca: mochilas, bolígrafos, termos..." : "Escribe tu mensaje..."}
                className="w-full bg-surface-50 border border-gray-200 rounded-full pl-5 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/50 focus:border-brand-red transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-red text-white rounded-full hover:bg-red-700 disabled:opacity-50 transition-colors"
                aria-label="Enviar mensaje"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-gray-400 font-medium tracking-wide">Desarrollado con IA - Universo Merchan</span>
            </div>
          </form>

        </div>
      )}
    </>
  );
}
