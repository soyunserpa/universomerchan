"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, ShoppingCart, CheckCircle, Info } from "lucide-react";

// Helper to parse European formatted numbers from Midocean (e.g. "1,51")
const parseNum = (str: any) => {
  if (typeof str === "number") return str;
  if (!str) return 0;
  if (typeof str === "string" && str.includes(",") && !str.includes(".")) {
    return parseFloat(str.replace(",", "."));
  }
  return parseFloat(str);
};

export default function InteractiveProposal({ productDataMap, printData }: { productDataMap: any; printData: any }) {
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [qtyAdult, setQtyAdult] = useState(250);
  const [qtyKids, setQtyKids] = useState(50);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalQty = qtyAdult + qtyKids;

  const options = [
    {
      id: 0,
      title: "Opción 1: Económica con Calidad",
      desc: "Nuestra recomendación por relación calidad-precio. Modelo básico pero resistente.",
      adultCode: "S11380", // REGENT
      kidsCode: "S11970",  // REGENT KIDS
    },
    {
      id: 1,
      title: "Opción 2: Premium (Mayor grosor)",
      desc: "Modelo Imperial de 190g. Una camiseta más gruesa y duradera.",
      adultCode: "S11500", // IMPERIAL
      kidsCode: "S11770",  // IMPERIAL KIDS
    },
    {
      id: 2,
      title: "Opción 3: 100% Ecológica",
      desc: "Camisetas orgánicas modelo Pioneer. Perfectas si la academia valora la sostenibilidad.",
      adultCode: "S03565", // PIONEER MEN
      kidsCode: "S03578",  // PIONEER KIDS
    }
  ];

  // Pricing calculation
  const calculateCost = (masterCode: string, qty: number) => {
    if (qty === 0) return { costCam: 0, handling: 0, print: 0, setup: 0, totalPVP: 0, unitPVP: 0 };
    
    const pData = productDataMap[masterCode];
    if (!pData) return { costCam: 0, handling: 0, print: 0, setup: 0, totalPVP: 0, unitPVP: 0 };

    // 1. Base Cost (Color Blanco)
    let costCam = 0;
    if (pData.priceScales && pData.priceScales.length > 0) {
      const scale = pData.priceScales.slice().reverse().find((s: any) => totalQty >= parseNum(s.minimum_quantity)) || pData.priceScales[0];
      costCam = parseNum(scale.price);
    }
    const costCamSell = costCam * 1.4; // Margen 40%

    // 2. Handling Cost
    let handlingCost = 0;
    if (pData.manipulationScales) {
      const sc = pData.manipulationScales;
      handlingCost = parseNum(sc.price_per_unit || sc.price || 0);
    }
    const handlingSell = handlingCost * 1.5; // Margen 50%

    // 3. Print Cost (Serigrafía 1 color, 2 posiciones)
    // Para Serigrafía ST1, varCosts[0].scales tiene los precios por tramo (area irrelevante)
    let costPrintUnit = 0;
    if (printData.varCosts && printData.varCosts[0]?.scales) {
      const scales = printData.varCosts[0].scales;
      const scale = scales.slice().reverse().find((s: any) => totalQty >= parseNum(s.minimum_quantity)) || scales[0];
      costPrintUnit = parseNum(scale.price);
    }
    
    // 2 posiciones = x2
    const totalPrintCost = costPrintUnit * 2;
    const totalPrintSell = totalPrintCost * 1.5; // Margen 50%

    // 4. Setup Cost (Fijos)
    const setupCost = printData.setup * 2; // 2 posiciones
    const setupSell = setupCost * 1.5; // Margen 50%
    const setupSellPerUnit = setupSell / totalQty; // Diluido

    const unitPVP = costCamSell + handlingSell + totalPrintSell + setupSellPerUnit;
    return {
      costCam: costCamSell * qty,
      handling: handlingSell * qty,
      print: totalPrintSell * qty,
      setup: (setupSell / totalQty) * qty, // Proporcional
      totalPVP: unitPVP * qty,
      unitPVP,
    };
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoBase64(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selected = options[selectedOption];
  const adultCalc = calculateCost(selected.adultCode, qtyAdult);
  const kidsCalc = calculateCost(selected.kidsCode, qtyKids);

  const grandTotal = adultCalc.totalPVP + kidsCalc.totalPVP;
  const avgUnitPVP = totalQty > 0 ? grandTotal / totalQty : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* HEADER */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Propuesta Aniversario <br/><span className="text-brand-red">Academia Gijón</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          Preparada especialmente para Lydia por el equipo de Universo Merchan.
          Ajusta las cantidades y descubre cómo quedarán tus camisetas en vivo.
        </p>
      </div>

      {/* AUTO MOCKUP BANNER */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 mb-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-300" /> Sube tu logotipo
            </h3>
            <p className="text-purple-100 opacity-90 max-w-md text-sm">
              Sube el logo de la academia (preferiblemente oscuro sobre fondo transparente) para previsualizarlo instantáneamente en las camisetas de abajo.
            </p>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-50 hover:scale-105 transition-all shadow-lg whitespace-nowrap"
          >
            {logoBase64 ? <><CheckCircle size={20} className="text-green-500" /> Cambiar Logo</> : <><Upload size={20} /> Subir Logo (PNG)</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: CONTROLS */}
        <div className="lg:col-span-1 space-y-6">
          {/* OPTIONS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">1. Selecciona la Calidad</h3>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div 
                  key={opt.id} 
                  onClick={() => setSelectedOption(i)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOption === i ? 'border-brand-red bg-red-50/30' : 'border-surface-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 text-sm">{opt.title}</span>
                    {selectedOption === i && <CheckCircle size={16} className="text-brand-red" />}
                  </div>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* QUANTITIES */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">2. Ajusta las Cantidades</h3>
            
            <div className="mb-6">
              <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                Tallas Adulto (Unisex) <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyAdult} uds</span>
              </label>
              <input 
                type="range" min="0" max="500" step="10" 
                value={qtyAdult} onChange={(e) => setQtyAdult(parseInt(e.target.value))}
                className="w-full accent-brand-red"
              />
            </div>

            <div className="mb-2">
              <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                Tallas Infantiles <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyKids} uds</span>
              </label>
              <input 
                type="range" min="0" max="500" step="10" 
                value={qtyKids} onChange={(e) => setQtyKids(parseInt(e.target.value))}
                className="w-full accent-brand-red"
              />
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium flex items-start gap-2">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>El precio unitario mejora automáticamente al superar los tramos de 250, 500 y 1000 unidades totales.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COL: PREVIEW & PRICE */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* MOCKUPS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-surface-200 flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Modelo Adulto ({productDataMap[selected.adultCode]?.name})</span>
              <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                {productDataMap[selected.adultCode]?.mainImage ? (
                  <img src={productDataMap[selected.adultCode].mainImage} alt="Adulto" className="object-contain w-[80%] h-[80%] mix-blend-multiply" />
                ) : (
                  <span className="text-gray-300">Sin foto</span>
                )}
                {logoBase64 && (
                  <img src={logoBase64} alt="Logo" className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[20%] object-contain mix-blend-multiply opacity-90 drop-shadow-sm" />
                )}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-surface-200 flex flex-col items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Modelo Infantil ({productDataMap[selected.kidsCode]?.name})</span>
              <div className="relative w-full aspect-square bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                {productDataMap[selected.kidsCode]?.mainImage ? (
                  <img src={productDataMap[selected.kidsCode].mainImage} alt="Niño" className="object-contain w-[70%] h-[70%] mix-blend-multiply" />
                ) : (
                  <span className="text-gray-300">Sin foto</span>
                )}
                {logoBase64 && (
                  <img src={logoBase64} alt="Logo" className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[20%] object-contain mix-blend-multiply opacity-90 drop-shadow-sm" />
                )}
              </div>
            </div>
          </div>

          {/* PRICING BREAKDOWN */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-surface-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Resumen Económico</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Serigrafía a 1 color (Pecho y Espalda)</span>
                <span className="text-gray-900 font-bold">Incluido</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-medium">Costes de fotolitos y pantallas (Setup)</span>
                <span className="text-gray-900 font-bold">Incluido</span>
              </div>
              <div className="flex justify-between items-center text-sm pb-4 border-b border-gray-100">
                <span className="text-gray-600 font-medium">Manipulación y empaquetado</span>
                <span className="text-gray-900 font-bold">Incluido</span>
              </div>
              
              <div className="flex justify-between items-end pt-4">
                <div>
                  <span className="block text-gray-500 text-sm font-medium mb-1">Precio Unitario Promedio</span>
                  <span className="text-3xl font-black text-gray-900">{avgUnitPVP.toFixed(2)}€ <span className="text-sm font-medium text-gray-500">/ud</span></span>
                </div>
                <div className="text-right">
                  <span className="block text-gray-500 text-sm font-medium mb-1">Total (Sin IVA)</span>
                  <span className="text-3xl font-black text-brand-red">{grandTotal.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <button className="w-full bg-brand-red text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30">
              <ShoppingCart size={22} />
              Aprobar Presupuesto y Proceder
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              * El precio corresponde a camisetas en color Blanco. Los colores oscuros pueden tener un suplemento en la prenda base.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
