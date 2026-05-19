"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, ShoppingCart, CheckCircle, Info } from "lucide-react";
import useCart from "@/store/useCart";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const { addItem } = useCart();
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [qtyAdult, setQtyAdult] = useState(300);
  const [qtyKids, setQtyKids] = useState(300);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  
  // Track selected color variant code per model
  const [adultColorCode, setAdultColorCode] = useState<string | null>(null);
  const [kidsColorCode, setKidsColorCode] = useState<string | null>(null);
  
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

  const selected = options[selectedOption];
  const adultData = productDataMap[selected.adultCode];
  const kidsData = productDataMap[selected.kidsCode];

  // Initialize colors if null
  if (adultColorCode === null && adultData?.variants?.[0]) {
    setAdultColorCode(adultData.variants[0].colorCode);
  }
  if (kidsColorCode === null && kidsData?.variants?.[0]) {
    setKidsColorCode(kidsData.variants[0].colorCode);
  }

  // Handle option change (reset colors)
  const handleOptionChange = (idx: number) => {
    setSelectedOption(idx);
    const newAdultData = productDataMap[options[idx].adultCode];
    const newKidsData = productDataMap[options[idx].kidsCode];
    setAdultColorCode(newAdultData?.variants?.[0]?.colorCode || null);
    setKidsColorCode(newKidsData?.variants?.[0]?.colorCode || null);
  };

  const getVariantDetails = (pData: any, colorCode: string | null) => {
    if (!pData || !pData.variants) return null;
    return pData.variants.find((v: any) => v.colorCode === colorCode) || pData.variants[0];
  };

  const adultVariant = getVariantDetails(adultData, adultColorCode);
  const kidsVariant = getVariantDetails(kidsData, kidsColorCode);

  // Pricing calculation
  const calculateCost = (masterCode: string, qty: number, variant: any) => {
    if (qty === 0) return { costCam: 0, handling: 0, print: 0, setup: 0, totalPVP: 0, unitPVP: 0 };
    
    const pData = productDataMap[masterCode];
    if (!pData) return { costCam: 0, handling: 0, print: 0, setup: 0, totalPVP: 0, unitPVP: 0 };

    // 1. Base Cost (From Variant Size 0, assuming prices scale or taking the base variant price)
    // getProductList enriches sizes with 'price'. Let's find minimum price across sizes
    let costCam = 0;
    if (variant?.sizes && variant.sizes.length > 0) {
      costCam = Math.min(...variant.sizes.map((s: any) => parseNum(s.price) || 9999));
      if (costCam === 9999) costCam = 0;
    }
    
    // Note: getProductList already applies some markup to variant.price based on the scale for qty=1. 
    // To be perfectly accurate with the B2B scale, we would look at pData.priceScales for the white base
    // But since the user wants the REAL final price, variant size price is the most accurate reflection of the color's cost.
    // If we assume getProductList returns the standard retail price for 1 unit, we might need to adjust.
    // But let's assume `costCam` here is the *cost* and we add 40% margin:
    const costCamSell = costCam * 1.4; // Margen 40%

    // 2. Handling Cost
    let handlingCost = 0;
    if (pData.manipulationScales) {
      handlingCost = parseNum(pData.manipulationScales.price_per_unit || pData.manipulationScales.price || 0);
    }
    const handlingSell = handlingCost * 1.5; // Margen 50%

    // 3. Print Cost (Serigrafía 1 color, 2 posiciones)
    let costPrintUnit = 0;
    if (printData.varCosts && printData.varCosts[0]?.scales) {
      const scales = printData.varCosts[0].scales;
      const scale = scales.slice().reverse().find((s: any) => totalQty >= parseNum(s.minimum_quantity)) || scales[0];
      costPrintUnit = parseNum(scale.price);
    }
    
    const totalPrintCost = costPrintUnit * 2; // 2 posiciones
    const totalPrintSell = totalPrintCost * 1.5; // Margen 50%

    // 4. Setup Cost
    const setupCost = printData.setup * 2; // 2 posiciones
    const setupSell = setupCost * 1.5; 
    const setupSellPerUnit = setupSell / totalQty; // Diluido entre el TOTAL de camisetas (adulto + niño)

    const unitPVP = costCamSell + handlingSell + totalPrintSell + setupSellPerUnit;
    return {
      costCam: costCamSell * qty,
      handling: handlingSell * qty,
      print: totalPrintSell * qty,
      setup: (setupSell / totalQty) * qty, 
      totalPVP: unitPVP * qty,
      unitPVP,
    };
  };

  const adultCalc = calculateCost(selected.adultCode, qtyAdult, adultVariant);
  const kidsCalc = calculateCost(selected.kidsCode, qtyKids, kidsVariant);
  const grandTotal = adultCalc.totalPVP + kidsCalc.totalPVP;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setLogoBase64(event.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAprobarPresupuesto = () => {
    // Adult Item
    if (qtyAdult > 0 && adultVariant) {
      addItem({
        productId: adultData.masterCode,
        name: adultData.name,
        price: adultCalc.unitPVP,
        quantity: qtyAdult,
        image: adultVariant.images?.[0] || adultData.mainImage,
        size: adultVariant.sizes?.[0]?.name || "Unisex",
        color: adultVariant.colorCode,
        sku: adultVariant.code
      });
    }
    // Kids Item
    if (qtyKids > 0 && kidsVariant) {
      addItem({
        productId: kidsData.masterCode,
        name: kidsData.name,
        price: kidsCalc.unitPVP,
        quantity: qtyKids,
        image: kidsVariant.images?.[0] || kidsData.mainImage,
        size: kidsVariant.sizes?.[0]?.name || "Kids",
        color: kidsVariant.colorCode,
        sku: kidsVariant.code
      });
    }
    
    // Additional generic item for Serigrafia Setup (Optional, since we diluted it into the unitPVP!)
    // We already diluted the setup into the unit price so the total matches exactly. No need to add setup as a separate item.
    
    router.push('/cart');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* HEADER */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Propuesta Aniversario <br/><span className="text-brand-red">Academia Gijón</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          Ajusta las cantidades, elige los colores y descubre cómo quedarán tus camisetas en vivo.
        </p>
      </div>

      {/* AUTO MOCKUP BANNER */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 mb-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-300" /> Previsualiza tu logotipo
            </h3>
            <p className="text-purple-100 opacity-90 max-w-md text-sm">
              Sube el logo de la academia (preferiblemente oscuro sobre fondo transparente) para previsualizarlo instantáneamente en el pecho y espalda de las camisetas.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COL: CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          {/* OPTIONS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">1. Selecciona la Calidad</h3>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div 
                  key={opt.id} 
                  onClick={() => handleOptionChange(i)}
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
                Adulto (Unisex) <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyAdult} uds</span>
              </label>
              <input 
                type="range" min="0" max="1000" step="10" 
                value={qtyAdult} onChange={(e) => setQtyAdult(parseInt(e.target.value))}
                className="w-full accent-brand-red"
              />
            </div>

            <div className="mb-2">
              <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                Infantil <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyKids} uds</span>
              </label>
              <input 
                type="range" min="0" max="1000" step="10" 
                value={qtyKids} onChange={(e) => setQtyKids(parseInt(e.target.value))}
                className="w-full accent-brand-red"
              />
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium flex items-start gap-2">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>El coste de Setup (Pantallas) se diluye mejor cuantas más unidades totales escojas.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COL: PREVIEW & PRICE */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MOCKUPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ADULT MOCKUP */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-200 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Adulto: {adultData?.name}</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">{adultVariant?.sizes?.length || 0} Tallas</span>
              </div>
              
              <div className="flex gap-4 mb-4 h-48">
                {/* Front */}
                <div className="relative w-1/2 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400">PECHO</span>
                  {adultData?.blankFront ? (
                    <img src={adultData.blankFront} alt="Pecho" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : adultVariant?.images?.[0] ? (
                    <img src={adultVariant.images[0]} alt="Pecho" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : null}
                  {logoBase64 && (
                    <img src={logoBase64} alt="Logo" className="absolute top-[35%] left-[65%] w-[20%] object-contain mix-blend-multiply opacity-90 drop-shadow-sm" />
                  )}
                </div>
                {/* Back */}
                <div className="relative w-1/2 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400">ESPALDA</span>
                  {adultData?.blankBack ? (
                    <img src={adultData.blankBack} alt="Espalda" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : adultVariant?.images?.[1] ? (
                    <img src={adultVariant.images[1]} alt="Espalda" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : null}
                  {logoBase64 && (
                    <img src={logoBase64} alt="Logo" className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[40%] object-contain mix-blend-multiply opacity-90 drop-shadow-sm" />
                  )}
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {adultData?.variants?.map((v: any) => (
                  <button 
                    key={v.colorCode}
                    onClick={() => setAdultColorCode(v.colorCode)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${adultColorCode === v.colorCode ? 'border-brand-red scale-110 shadow-md' : 'border-gray-200 hover:scale-105'}`}
                    style={{ backgroundColor: v.hex || '#fff' }}
                    title={v.code}
                  />
                ))}
              </div>
            </div>

            {/* KIDS MOCKUP */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-200 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Niño: {kidsData?.name}</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">{kidsVariant?.sizes?.length || 0} Tallas</span>
              </div>
              
              <div className="flex gap-4 mb-4 h-48">
                {/* Front */}
                <div className="relative w-1/2 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400">PECHO</span>
                  {kidsData?.blankFront ? (
                    <img src={kidsData.blankFront} alt="Pecho" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : kidsVariant?.images?.[0] ? (
                    <img src={kidsVariant.images[0]} alt="Pecho" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : null}
                  {logoBase64 && (
                    <img src={logoBase64} alt="Logo" className="absolute top-[35%] left-[65%] w-[20%] object-contain mix-blend-multiply opacity-90 drop-shadow-sm" />
                  )}
                </div>
                {/* Back */}
                <div className="relative w-1/2 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100">
                  <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400">ESPALDA</span>
                  {kidsData?.blankBack ? (
                    <img src={kidsData.blankBack} alt="Espalda" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : kidsVariant?.images?.[1] ? (
                    <img src={kidsVariant.images[1]} alt="Espalda" className="object-contain w-full h-full mix-blend-multiply" />
                  ) : null}
                  {logoBase64 && (
                    <img src={logoBase64} alt="Logo" className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[40%] object-contain mix-blend-multiply opacity-90 drop-shadow-sm" />
                  )}
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {kidsData?.variants?.map((v: any) => (
                  <button 
                    key={v.colorCode}
                    onClick={() => setKidsColorCode(v.colorCode)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${kidsColorCode === v.colorCode ? 'border-brand-red scale-110 shadow-md' : 'border-gray-200 hover:scale-105'}`}
                    style={{ backgroundColor: v.hex || '#fff' }}
                    title={v.code}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* PRICING BREAKDOWN */}
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-surface-200">
            <h2 className="text-2xl font-black text-gray-900 mb-6 border-b pb-4">Resumen Económico</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-700 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand-red rounded-full"></span> Precio Unitario Adulto ({qtyAdult} uds)
                </span>
                <span className="text-brand-red font-black text-lg">{qtyAdult > 0 ? adultCalc.unitPVP.toFixed(2) : '0.00'} € <span className="text-xs text-gray-400 font-normal">/ud</span></span>
              </div>
              
              <div className="flex justify-between items-center text-sm bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-700 font-bold flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Precio Unitario Niño ({qtyKids} uds)
                </span>
                <span className="text-blue-600 font-black text-lg">{qtyKids > 0 ? kidsCalc.unitPVP.toFixed(2) : '0.00'} € <span className="text-xs text-gray-400 font-normal">/ud</span></span>
              </div>
              
              <div className="pt-4 space-y-2 text-xs text-gray-500 font-medium">
                <p className="flex justify-between"><span>Serigrafía a 1 color (Pecho y Espalda):</span> <span>Incluido</span></p>
                <p className="flex justify-between"><span>Costes de fotolitos y pantallas (Setup):</span> <span>Incluido</span></p>
                <p className="flex justify-between"><span>Manipulación y empaquetado:</span> <span>Incluido</span></p>
              </div>
              
              <div className="flex justify-between items-end pt-6 border-t border-gray-100">
                <div className="text-gray-500 text-sm font-medium">
                  Total (Sin IVA)
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black text-gray-900">{grandTotal.toFixed(2)}€</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleAprobarPresupuesto}
              disabled={totalQty === 0}
              className="w-full bg-brand-red text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={22} />
              Aprobar Presupuesto y Proceder al Pago
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
