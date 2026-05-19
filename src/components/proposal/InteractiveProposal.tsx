"use client";

import { useState } from "react";
import { Package, ExternalLink } from "lucide-react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function InteractiveProposal({ productDataMap, printData }: { productDataMap: any; printData: any }) {
  const [qtyAdult, setQtyAdult] = useState(300);
  const [qtyWomen, setQtyWomen] = useState(0);
  const [qtyKids, setQtyKids] = useState(300);
  const totalQty = qtyAdult + qtyKids + qtyWomen;

  const [selectedColorForOption, setSelectedColorForOption] = useState<{ [key: number]: string }>({});

  const options = [
    {
      id: 0,
      title: "Opción 1: Económica con Calidad",
      desc: "Modelo Regent 150g (100% Algodón semi-peinado). Relación calidad-precio inmejorable. Resistente a lavados, ideal para un regalo general.",
      adultCode: "S11380",
      kidsCode: "S11970",
      womenCode: "S01825",
    },
    {
      id: 1,
      title: "Opción 2: Premium (Mayor grosor)",
      desc: "Modelo Imperial 190g (100% Algodón semi-peinado). Una camiseta más gruesa y duradera, con un tacto más suave y premium. La mejor si buscas un recuerdo duradero.",
      adultCode: "S11500",
      kidsCode: "S11770",
      womenCode: "S11502",
    },
    {
      id: 2,
      title: "Opción 3: 100% Ecológica",
      desc: "Modelo Pioneer 175g (100% Algodón orgánico certificado). Perfectas si la academia valora la sostenibilidad y busca transmitir un mensaje eco-friendly a sus alumnos.",
      adultCode: "S03565",
      kidsCode: "S03578",
      womenCode: "S03579",
    }
  ];

  const calculateCost = (qty: number, variant: any, pData: any) => {
    if (qty === 0 || !pData || !variant) return { costCamSellPerUnit: 0, totalPVP: 0, unitPVP: 0 };
    let costCam = 0;
    if (variant?.sizes?.length > 0) {
      costCam = Math.min(...variant.sizes.map((s: any) => s.price));
    }
    const costCamSell = costCam * 1.4;

    let handlingCost = 0;
    if (pData.manipulationScales) {
      handlingCost = parseFloat(pData.manipulationScales.price_per_unit || pData.manipulationScales.price || "0");
    }
    const handlingSell = handlingCost * 1.5;

    let costPrintUnit = 0;
    if (printData.varCosts?.length > 0 && printData.varCosts[0]?.scales) {
      const scales = printData.varCosts[0].scales;
      const scale = scales.slice().reverse().find((s: any) => totalQty >= parseFloat(s.minimum_quantity)) || scales[0];
      costPrintUnit = parseFloat(scale.price);
    }
    const totalPrintSell = (costPrintUnit * 2) * 1.5;

    const setupCost = printData.setup * 2;
    const setupSell = setupCost * 1.5; 
    const setupSellPerUnit = totalQty > 0 ? (setupSell / totalQty) : 0;

    const unitPVP = costCamSell + handlingSell + totalPrintSell + setupSellPerUnit;
    return {
      costCamSellPerUnit: costCamSell,
      totalPVP: unitPVP * qty,
      unitPVP,
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <a 
        href="https://wa.me/34614446640" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
      >
        <MessageCircle size={32} />
      </a>

      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Propuesta Aniversario <br/><span className="text-brand-red">Academia Gijón</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          Selección de camisetas de alta calidad. Todos los precios incluyen marcaje a 1 color en Pecho y Espalda.
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-surface-200 mb-12 max-w-3xl mx-auto">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center justify-center gap-2 text-xl">
          <Package className="text-brand-red" /> Ajuste de Cantidades Estimadas
        </h3>
        <p className="text-center text-sm text-gray-500 mb-6">El coste de las pantallas y fotolitos se diluye entre todas las unidades. Ajusta las barras para ver cómo baja el precio unitario a mayor cantidad.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
              Adulto (Unisex) <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyAdult}</span>
            </label>
            <input type="range" min="0" max="1000" step="10" value={qtyAdult} onChange={(e) => setQtyAdult(parseInt(e.target.value))} className="w-full accent-brand-red" />
          </div>
          <div>
            <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
              Mujer (Entallada) <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyWomen}</span>
            </label>
            <input type="range" min="0" max="1000" step="10" value={qtyWomen} onChange={(e) => setQtyWomen(parseInt(e.target.value))} className="w-full accent-brand-red" />
          </div>
          <div>
            <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
              Infantil <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyKids}</span>
            </label>
            <input type="range" min="0" max="1000" step="10" value={qtyKids} onChange={(e) => setQtyKids(parseInt(e.target.value))} className="w-full accent-brand-red" />
          </div>
        </div>
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

          const adultCalc = calculateCost(Math.max(1, qtyAdult), adultVariant, adultData);
          const kidsCalc = calculateCost(Math.max(1, qtyKids), kidsVariant, kidsData);
          const womenCalc = calculateCost(Math.max(1, qtyWomen), womenVariant, womenData);

          const renderItemCol = (title: string, pData: any, variant: any, priceCalc: any) => (
            <div className="flex-1 flex flex-col">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">{title}</span>
              <img src={variant?.images?.[0] || pData.mainImage} className="w-full aspect-square object-contain mix-blend-multiply drop-shadow-sm bg-white rounded-xl border border-gray-100 p-2 mb-3" alt={title} />
              <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                  +{pData.variants?.length || 0} colores a elegir
                </span>
              </div>
              <div className="mt-auto bg-white p-3 rounded-xl border border-gray-100 text-center flex flex-col gap-2">
                <div>
                  <span className="block text-xs text-gray-500 font-medium">Precio Unitario (Inc. Marcaje)</span>
                  <span className="text-lg font-black text-gray-900">{priceCalc.unitPVP.toFixed(2)} €</span>
                </div>
                <Link 
                  href={`/product/${pData.masterCode.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-brand-red text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-700 transition-colors shadow-sm"
                >
                  Configurar <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          );

          return (
            <div key={idx} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col lg:flex-row">
              <div className="w-full lg:w-1/3 p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-100 bg-gray-50/50">
                <h2 className="text-3xl font-black text-gray-900 mb-4">{opt.title}</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{opt.desc}</p>
                <div className="bg-white rounded-xl p-5 border border-gray-100 mt-auto shadow-sm">
                  <h4 className="font-bold text-sm text-gray-900 mb-3">Tu presupuesto incluye:</h4>
                  <ul className="text-sm text-gray-600 space-y-2.5 font-medium">
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Serigrafía a 1 color (Pecho izquierdo)</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Serigrafía a 1 color (Espalda grande)</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Pantallas y fotolitos incluidos en PVP</li>
                    <li className="flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span> Manipulación y embolsado incluidos</li>
                  </ul>
                </div>
              </div>
              
              <div className="w-full lg:w-2/3 bg-gray-50/30 p-6 md:p-8 flex flex-col justify-center">
                <div className="flex flex-col md:flex-row gap-6 md:gap-4">
                  {renderItemCol("Versión Adulto", adultData, adultVariant, adultCalc)}
                  {renderItemCol("Versión Mujer", womenData, womenVariant, womenCalc)}
                  {renderItemCol("Versión Niño", kidsData, kidsVariant, kidsCalc)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
