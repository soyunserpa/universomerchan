"use client";

import { Package, ExternalLink, MessageCircle, Mail } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function InteractiveProposal({ productDataMap }: { productDataMap: any }) {
  const options = [
    {
      id: 0,
      title: "Opción 1: Económica con Calidad",
      desc: "Modelo Regent 150g (100% Algodón semi-peinado). Relación calidad-precio inmejorable. Resistente a lavados, ideal para un regalo general.",
      adultCode: "S11380",
      kidsCode: "S11970",
      womenCode: "S01825",
      prices: {
        adult: { 100: "4.49", 200: "4.21", 300: "3.86" },
        kids: { 100: "3.38", 200: "3.18", 300: "3.05" }
      }
    },
    {
      id: 1,
      title: "Opción 2: Premium (Mayor grosor)",
      desc: "Modelo Imperial 190g (100% Algodón semi-peinado). Una camiseta más gruesa y duradera, con un tacto más suave y premium. La mejor si buscas un recuerdo duradero.",
      adultCode: "S11500",
      kidsCode: "S11770",
      womenCode: "S11502",
      prices: {
        adult: { 100: "4.88", 200: "4.68", 300: "4.55" },
        kids: { 100: "3.94", 200: "3.74", 300: "3.61" }
      }
    },
    {
      id: 2,
      title: "Opción 3: 100% Ecológica",
      desc: "Modelo Pioneer 175g (100% Algodón orgánico certificado). Perfectas si la academia valora la sostenibilidad y busca transmitir un mensaje eco-friendly a sus alumnos.",
      adultCode: "S03565",
      kidsCode: "S03578",
      womenCode: "S03579",
      prices: {
        adult: { 100: "5.43", 200: "5.23", 300: "5.10" },
        kids: { 100: "4.62", 200: "4.42", 300: "4.29" }
      }
    }
  ];

  useEffect(() => {
    // Only track once per session
    if (!sessionStorage.getItem('proposal_tracked')) {
      fetch('/api/track-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view' })
      }).catch(console.error);
      sessionStorage.setItem('proposal_tracked', 'true');
    }
  }, []);

  const trackClick = (optionTitle: string) => {
    fetch('/api/track-proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'click_order', option: optionTitle })
    }).catch(console.error);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <a 
        href="https://wa.me/34614446640" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed top-24 right-6 z-50 bg-[#25D366] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
      >
        <MessageCircle size={32} />
      </a>

      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Propuesta Aniversario <br/><span className="text-brand-red">Academia Gijón</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          Selección de camisetas de alta calidad. Todos los precios incluyen marcaje con Transfer Digital a todo color en Pecho y Espalda.
        </p>
      </div>

      <div className="bg-blue-50 text-blue-800 p-5 rounded-2xl font-medium text-center max-w-3xl mx-auto mb-12 border border-blue-100 shadow-sm">
        <span className="flex items-center justify-center gap-2 mb-1.5 font-bold text-blue-900"><Package size={20} /> Información de Precios</span>
        Los precios mostrados varían según la cantidad total. Recuerda que a mayor volumen, se diluyen los costes fijos de impresión y manipulación, mejorando el precio unitario.
      </div>

      <div className="space-y-12">
        {options.map((opt, idx) => {
          const adultData = productDataMap[opt.adultCode];
          const kidsData = productDataMap[opt.kidsCode];
          const womenData = productDataMap[opt.womenCode];
          
          if (!adultData || !kidsData || !womenData) return null;

          const targetColorCode = "06"; // Hardcode white
          
          const adultVariant = adultData?.variants?.find((v: any) => v.colorCode === targetColorCode) || adultData?.variants?.[0];
          const kidsVariant = kidsData?.variants?.find((v: any) => v.colorCode === targetColorCode) || kidsData?.variants?.[0];
          const womenVariant = womenData?.variants?.find((v: any) => v.colorCode === targetColorCode) || womenData?.variants?.[0];

          const renderItemCol = (title: string, pData: any, variant: any, prices: any) => (
            <div className="flex-1 flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">{title}</span>
              <img src={variant?.images?.[0] || pData.mainImage} className="w-full aspect-square object-contain mix-blend-multiply drop-shadow-sm bg-white rounded-xl border border-gray-100 p-2 mb-3" alt={title} />
              
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  +{pData.variants?.length || 0} colores a elegir
                </span>
              </div>
              
              <div className="mt-auto bg-white p-3 rounded-xl border border-gray-100 text-center flex flex-col gap-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="bg-gray-50 rounded-lg p-2.5 mb-1 border border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1.5">Precios Unitarios (Inc. Marcaje)</div>
                  <div className="flex justify-between text-xs py-1"><span className="text-gray-600 font-medium">100 uds</span><span className="font-bold">{prices[100]} €</span></div>
                  <div className="flex justify-between text-xs py-1"><span className="text-gray-600 font-medium">200 uds</span><span className="font-bold">{prices[200]} €</span></div>
                  <div className="flex justify-between text-xs py-1"><span className="text-gray-600 font-medium">300 uds</span><span className="font-bold text-brand-red text-[13px]">{prices[300]} €</span></div>
                </div>
                
                <Link 
                  href={`/product/${pData.masterCode.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-brand-red text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-700 transition-colors shadow-sm"
                >
                  Configúralo tú mismo <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          );

          return (
            <div key={idx} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/3 p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/50">
                <h2 className="text-3xl font-black text-gray-900 mb-4">{opt.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{opt.desc}</p>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm relative">
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Tu presupuesto incluye:</h4>
                  <ul className="text-sm text-gray-600 space-y-2.5 font-medium">
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Transfer digital a todo color (Pecho izquierdo)</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Transfer digital a todo color (Espalda grande)</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Costes de impresión incluidos</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Manipulación y embolsado incluidos</li>
                  </ul>
                </div>

                <a 
                  href={`mailto:pedidos@universomerchan.com?subject=Pedido Academia Gijón - ${encodeURIComponent(opt.title)}&body=${encodeURIComponent(`Hola Universo Merchan,\n\nNos gustaría realizar el pedido basado en la ${opt.title}.\n\nPor favor, contactadnos para concretar las cantidades finales por talla y color.\n\nUn saludo,`)}`}
                  onClick={() => trackClick(opt.title)}
                  className="mt-6 w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-md"
                >
                  <Mail size={18} /> Hacemos el pedido por ti
                </a>
              </div>
              
              <div className="w-full lg:w-2/3 bg-gray-50/30 p-6 md:p-8 flex flex-col justify-center">
                <div className="flex flex-col md:flex-row gap-6 md:gap-4">
                  {renderItemCol("Versión Adulto", adultData, adultVariant, opt.prices.adult)}
                  {renderItemCol("Versión Mujer", womenData, womenVariant, opt.prices.adult)}
                  {renderItemCol("Versión Niño", kidsData, kidsVariant, opt.prices.kids)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
