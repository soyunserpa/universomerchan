"use client";

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function ChatbotBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {/* Burbuja flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[110px] right-6 md:bottom-[100px] md:right-8 z-50 p-4 bg-brand-red text-white rounded-full shadow-2xl hover:bg-red-700 transition-all transform hover:scale-110 flex items-center justify-center focus:outline-none"
        aria-label="Abrir asistente de compras"
      >
        {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
      </button>

      {/* Ventana de chat */}
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
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-10">
                <Bot size={40} className="mx-auto text-brand-red/50 mb-3" />
                <p className="text-sm font-medium">¡Hola! Soy tu asistente de Universo Merchan.</p>
                <p className="text-xs mt-1 opacity-70">Pregúntame por mochilas, botellas o ideas para tu próxima campaña.</p>
              </div>
            )}
            
            <div className="space-y-4">
              {messages.map(m => (
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

                    <div className={`px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-gray-800 text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm'}`}>
                      {/* Render markdown properly if it's the assistant */}
                      {m.toolInvocations?.length ? (
                        <div className="flex items-center gap-2 text-brand-red text-xs italic">
                          <Loader2 size={12} className="animate-spin" /> Buscando catálogos...
                        </div>
                      ) : null}
                      
                      {m.content && (
                        <div className="prose prose-sm prose-p:leading-snug prose-a:text-brand-red font-medium">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
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
                      <Loader2 size={16} className="animate-spin" /> Pensando...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Formulario de Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center relative">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Escribe tu mensaje..."
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
