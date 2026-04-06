"use client";

import { useState } from "react";
import { ChevronDown, Leaf, FileText, Download, Truck, PaintBucket } from "lucide-react";

interface ProductAccordionProps {
  product: {
    longDescription?: string;
    material?: string;
    dimensions?: string;
    countryOfOrigin?: string;
    isGreen?: boolean;
    documents?: Array<{ url: string; type: string; subtype: string }>;
  };
}

export function ProductAccordion({ product }: ProductAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0); // First tab open by default

  const toggleTab = (index: number) => {
    setOpenIndex(prev => (prev === index ? -1 : index));
  };

  // Find compliance PDF (usually TYPE=PDF and SUBTYPE like 'Compliance' or 'DOC')
  const complianceDoc = product.documents?.find(
    doc => doc.url.toLowerCase().endsWith(".pdf")
  );

  const tabs = [
    {
      title: "Detalles del producto",
      icon: <FileText size={18} className="text-gray-400" />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-4">
          <p className="leading-relaxed">{product.longDescription || "No hay descripción ampliada disponible."}</p>
          <ul className="space-y-2 text-sm">
            {product.material && (
              <li>
                <span className="font-semibold text-gray-900">Material:</span> {product.material}
              </li>
            )}
            {product.dimensions && (
              <li>
                <span className="font-semibold text-gray-900">Dimensiones:</span> {product.dimensions}
              </li>
            )}
            {product.countryOfOrigin && (
              <li>
                <span className="font-semibold text-gray-900">País de origen:</span> {product.countryOfOrigin}
              </li>
            )}
          </ul>
        </div>
      ),
    },
    {
      title: "Sostenibilidad y Certificaciones",
      icon: <Leaf size={18} className={product.isGreen ? "text-green-500" : "text-gray-400"} />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-4">
          {product.isGreen ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Leaf size={18} className="shrink-0 mt-0.5" />
                <p>
                  <strong>Este producto certifica estándares Sostenibles u Orgánicos.</strong> Forma parte de nuestra selección ECO que garantiza una 
                  producción responsable, huella de carbono reducida o uso de materiales reciclados/orgánicos.
                </p>
              </div>
            </div>
          ) : (
            <p className="leading-relaxed text-gray-500">
              Todos nuestros artículos cumplen con las estrictas normativas europeas (RoHS, REACH) según la categoría del producto técnico o textil.
            </p>
          )}

          {complianceDoc && (
            <a
              href={complianceDoc.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors mt-2 text-xs"
            >
              <Download size={15} className="text-gray-500" />
              Descargar ficha de producto (PDF)
            </a>
          )}
        </div>
      ),
    },
    {
      title: "Proceso de Personalización",
      icon: <PaintBucket size={18} className="text-gray-400" />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-3">
          <p>Tu marca en manos de profesionales.</p>
          <p>
            Una vez finalices tu pedido u obtengas tu presupuesto, nuestro equipo de diseño te enviará un <strong>fotomontaje virtual gratuito</strong> para que apruebes 
            o modifiques la posición y tamaño del logotipo antes de pasar a maquinaria.
          </p>
        </div>
      ),
    },
    {
      title: "Envíos y Plazos",
      icon: <Truck size={18} className="text-gray-400" />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-3">
          <p>Trabajamos siempre con la mayor celeridad logística:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Sin personalizar:</strong> Entrega en 3 - 5 días hábiles.</li>
            <li><strong>Personalizado:</strong> Entre 3 y 10 días hábiles tras la aprobación del fotomontaje.</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
            Todos los envíos dentro de Península son certificados. Posibilidad de solicitar muestras físicas sin marcaje según disponibilidad contactando por correo.
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm mt-12 divide-y divide-gray-100 overflow-hidden">
      {tabs.map((tab, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} className="group">
            <button
              onClick={() => toggleTab(idx)}
              className="w-full text-left py-5 px-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors outline-none"
            >
              <div className="flex items-center gap-3">
                {tab.icon}
                <span className={`text-sm font-semibold tracking-wide transition-colors ${isOpen ? "text-brand-red" : "text-gray-900 group-hover:text-brand-red"}`}>
                  {tab.title}
                </span>
              </div>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-300 ease-out ${isOpen ? "rotate-180 text-brand-red" : ""}`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-6 pt-1">
                  {tab.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
