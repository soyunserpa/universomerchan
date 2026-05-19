"use client";

import { useState, useRef } from "react";
import { Upload, Sparkles, ShoppingCart, CheckCircle, Info } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

const parseBox = (str: string | null) => {
  if (!str) return null;
  try {
    const arr = JSON.parse(str);
    if (Array.isArray(arr) && arr[0]) return arr[0];
    if (typeof arr === 'object' && arr.x !== undefined) return arr;
    return null;
  } catch(e) { return null; }
};

export default function InteractiveProposal({ productDataMap, printData }: { productDataMap: any; printData: any }) {
  const router = useRouter();
  const { addItem } = useCart();
  
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [qtyAdult, setQtyAdult] = useState(300);
  const [qtyKids, setQtyKids] = useState(300);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  
  const [adultColorCode, setAdultColorCode] = useState<string | null>(null);
  const [kidsColorCode, setKidsColorCode] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalQty = qtyAdult + qtyKids;

  const options = [
    {
      id: 0,
      title: "Opción 1: Económica con Calidad",
      desc: "Modelo Regent 150g. Relación calidad-precio inmejorable. Resistente a lavados, ideal para un regalo general sin gastar demasiado.",
      adultCode: "S11380",
      kidsCode: "S11970",
    },
    {
      id: 1,
      title: "Opción 2: Premium (Mayor grosor)",
      desc: "Modelo Imperial 190g. Una camiseta más gruesa y duradera, con un tacto más suave y premium. La mejor si buscas un recuerdo duradero.",
      adultCode: "S11500",
      kidsCode: "S11770",
    },
    {
      id: 2,
      title: "Opción 3: 100% Ecológica",
      desc: "Modelo Pioneer orgánico. Perfectas si la academia valora la sostenibilidad y busca transmitir un mensaje eco-friendly a sus alumnos.",
      adultCode: "S03565",
      kidsCode: "S03578",
    }
  ];

  const selected = options[selectedOption];
  const adultData = productDataMap[selected.adultCode];
  const kidsData = productDataMap[selected.kidsCode];

  // Initialize colors
  if (adultColorCode === null && adultData?.variants?.[0]) {
    setAdultColorCode(adultData.variants[0].colorCode);
  }
  if (kidsColorCode === null && kidsData?.variants?.[0]) {
    setKidsColorCode(kidsData.variants[0].colorCode);
  }

  const handleOptionChange = (idx: number) => {
    setSelectedOption(idx);
    setAdultColorCode(productDataMap[options[idx].adultCode]?.variants?.[0]?.colorCode || null);
    setKidsColorCode(productDataMap[options[idx].kidsCode]?.variants?.[0]?.colorCode || null);
  };

  const adultVariant = adultData?.variants?.find((v: any) => v.colorCode === adultColorCode) || adultData?.variants?.[0];
  const kidsVariant = kidsData?.variants?.find((v: any) => v.colorCode === kidsColorCode) || kidsData?.variants?.[0];

  const calculateCost = (qty: number, variant: any, pData: any) => {
    if (qty === 0 || !pData) return { costCam: 0, handling: 0, print: 0, setup: 0, totalPVP: 0, unitPVP: 0, costCamSellPerUnit: 0 };
    
    // 1. Base Cost
    let costCam = 0;
    if (variant?.sizes?.length > 0) {
      costCam = Math.min(...variant.sizes.map((s: any) => s.price));
    }
    const costCamSell = costCam * 1.4; // 40% Margin

    // 2. Handling Cost
    let handlingCost = 0;
    if (pData.manipulationScales) {
      handlingCost = parseFloat(pData.manipulationScales.price_per_unit || pData.manipulationScales.price || "0");
    }
    const handlingSell = handlingCost * 1.5; // 50% Margin

    // 3. Print Cost
    let costPrintUnit = 0;
    if (printData.varCosts?.length > 0 && printData.varCosts[0]?.scales) {
      const scales = printData.varCosts[0].scales;
      const scale = scales.slice().reverse().find((s: any) => totalQty >= parseFloat(s.minimum_quantity)) || scales[0];
      costPrintUnit = parseFloat(scale.price);
    }
    const totalPrintSell = (costPrintUnit * 2) * 1.5; // 2 pos * 50% Margin

    // 4. Setup Cost
    const setupCost = printData.setup * 2; // 2 pos
    const setupSell = setupCost * 1.5; 
    const setupSellPerUnit = setupSell / totalQty; // Diluted across total order

    const unitPVP = costCamSell + handlingSell + totalPrintSell + setupSellPerUnit;
    return {
      costCamSellPerUnit: costCamSell,
      costCam: costCamSell * qty,
      handling: handlingSell * qty,
      print: totalPrintSell * qty,
      setup: (setupSell / totalQty) * qty, 
      totalPVP: unitPVP * qty,
      unitPVP,
    };
  };

  const adultCalc = calculateCost(qtyAdult, adultVariant, adultData);
  const kidsCalc = calculateCost(qtyKids, kidsVariant, kidsData);
  const grandTotal = adultCalc.totalPVP + kidsCalc.totalPVP;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setLogoBase64(event.target?.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getCustomizationPayload = () => {
    return {
      positions: [
        {
          positionId: "CHEST",
          positionName: "Pecho",
          techniqueId: "ST1",
          techniqueName: "Serigrafía",
          printWidthMm: 100,
          printHeightMm: 100,
          numColors: 1,
          pmsColors: [],
          instructions: ""
        },
        {
          positionId: "BACK",
          positionName: "Espalda",
          techniqueId: "ST1",
          techniqueName: "Serigrafía",
          printWidthMm: 280,
          printHeightMm: 420,
          numColors: 1,
          pmsColors: [],
          instructions: ""
        }
      ],
      artworkUrl: logoBase64 || "",
      artworkFileName: logoBase64 ? "logo_academia.png" : "",
      mockupUrl: null
    };
  };

  const handleAprobarPresupuesto = () => {
    if (!logoBase64) {
      alert("⚠️ Debes subir el logotipo de la academia antes de poder añadir al carrito para confirmar el presupuesto.");
      return;
    }

    if (qtyAdult > 0 && adultVariant) {
      addItem({
        productMasterCode: adultData.masterCode,
        productName: adultData.name,
        variantSku: adultVariant.sizes?.[0]?.sku || adultVariant.code || adultVariant.sku,
        variantId: adultVariant.sizes?.[0]?.sku || adultVariant.code || adultVariant.sku,
        color: adultVariant.colorDescription || adultVariant.colorCode,
        colorCode: adultVariant.colorCode,
        size: adultVariant.sizes?.[0]?.name || "Unisex",
        quantity: qtyAdult,
        unitPriceProduct: adultCalc.costCamSellPerUnit,
        unitPriceTotal: adultCalc.unitPVP,
        totalPrice: adultCalc.totalPVP,
        customization: getCustomizationPayload(),
        orderType: "PRINT",
        productImage: adultVariant.images?.[0] || adultData.mainImage,
      });
    }
    
    if (qtyKids > 0 && kidsVariant) {
      addItem({
        productMasterCode: kidsData.masterCode,
        productName: kidsData.name,
        variantSku: kidsVariant.sizes?.[0]?.sku || kidsVariant.code || kidsVariant.sku,
        variantId: kidsVariant.sizes?.[0]?.sku || kidsVariant.code || kidsVariant.sku,
        color: kidsVariant.colorDescription || kidsVariant.colorCode,
        colorCode: kidsVariant.colorCode,
        size: kidsVariant.sizes?.[0]?.name || "Kids",
        quantity: qtyKids,
        unitPriceProduct: kidsCalc.costCamSellPerUnit,
        unitPriceTotal: kidsCalc.unitPVP,
        totalPrice: kidsCalc.totalPVP,
        customization: getCustomizationPayload(),
        orderType: "PRINT",
        productImage: kidsVariant.images?.[0] || kidsData.mainImage,
      });
    }
    
    router.push('/cart');
  };

  const renderProductImage = (isChest: boolean, variant: any, pData: any) => {
    const box = isChest ? parseBox(pData?.frontBox) : parseBox(pData?.backBox);
    let logoStyle: React.CSSProperties = { top: "32%", left: "58%", width: "12%", objectFit: "contain", mixBlendMode: "multiply", opacity: 0.9, zIndex: 20 };
    
    if (box) {
       // Convert box properties to % for CSS (x, y, w, h are based on 1000x1000 standard images usually, or if <= 1 then they are percentages)
       const scale = box.x <= 1 ? 100 : 0.1; 
       logoStyle = {
         top: `${box.y * scale}%`,
         left: `${box.x * scale}%`,
         width: `${box.w * scale}%`,
         height: `${box.h * scale}%`,
         objectFit: "contain",
         mixBlendMode: "multiply",
         opacity: 0.9,
         zIndex: 20
       };
    } else if (!isChest) {
       logoStyle = { top: "28%", left: "50%", transform: "translateX(-50%)", width: "25%", objectFit: "contain", mixBlendMode: "multiply", opacity: 0.9, zIndex: 20 };
    }

    return (
      <div className="relative w-1/2 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-gray-100 shadow-inner">
        <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400 z-10">{isChest ? "PECHO" : "ESPALDA"}</span>
        {variant?.images?.[isChest ? 0 : 1] && <img src={variant.images[isChest ? 0 : 1]} alt={isChest ? "Pecho" : "Espalda"} className="object-contain w-full h-full mix-blend-multiply relative z-0" />}
        {logoBase64 && <img src={logoBase64} alt="Logo" className="absolute drop-shadow-sm" style={logoStyle} />}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Propuesta Aniversario <br/><span className="text-brand-red">Academia Gijón</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          Ajusta las cantidades, elige los colores y descubre cómo quedarán tus camisetas en vivo.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-8 mb-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-300" /> Previsualiza tu logotipo
            </h3>
            <p className="text-purple-100 opacity-90 max-w-md text-sm">
              Sube el logo de la academia (preferiblemente oscuro sobre fondo transparente) para previsualizarlo instantáneamente en el pecho y espalda de las camisetas. Obligatorio para comprar.
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
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">1. Selecciona la Calidad</h3>
            <div className="space-y-3">
              {options.map((opt, i) => (
                <div 
                  key={opt.id} 
                  onClick={() => handleOptionChange(i)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedOption === i ? 'border-brand-red bg-red-50/30 ring-2 ring-red-100' : 'border-surface-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 text-sm">{opt.title}</span>
                    {selectedOption === i && <CheckCircle size={16} className="text-brand-red" />}
                  </div>
                  <p className="text-xs text-gray-600 leading-snug">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-200">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">2. Ajusta las Cantidades</h3>
            <div className="mb-6">
              <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                Adulto (Unisex) <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyAdult} uds</span>
              </label>
              <input type="range" min="0" max="1000" step="10" value={qtyAdult} onChange={(e) => setQtyAdult(parseInt(e.target.value))} className="w-full accent-brand-red" />
            </div>
            <div className="mb-2">
              <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
                Infantil <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-900">{qtyKids} uds</span>
              </label>
              <input type="range" min="0" max="1000" step="10" value={qtyKids} onChange={(e) => setQtyKids(parseInt(e.target.value))} className="w-full accent-brand-red" />
            </div>
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg text-xs font-medium flex items-start gap-2">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <span>El coste de Setup (Pantallas) se diluye mejor cuantas más unidades totales escojas.</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ADULT */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-200 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Adulto: {adultData?.name}</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">{adultVariant?.sizes?.length || 0} Tallas</span>
              </div>
              <div className="flex gap-4 mb-4 h-64">
                {renderProductImage(true, adultVariant, adultData)}
                {renderProductImage(false, adultVariant, adultData)}
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {adultData?.variants?.map((v: any) => (
                  <button 
                    key={v.colorCode} onClick={() => setAdultColorCode(v.colorCode)}
                    className={`w-8 h-8 rounded-full transition-all ring-offset-2 outline-none ${adultColorCode === v.colorCode ? 'ring-2 ring-brand-red border-brand-red scale-110 shadow-md' : 'border-2 border-surface-200 hover:border-surface-300'}`}
                    style={{ backgroundColor: v.hex || '#fff' }} title={v.colorDescription}
                  />
                ))}
              </div>
            </div>

            {/* KIDS */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-surface-200 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-gray-800 uppercase tracking-wider">Niño: {kidsData?.name}</span>
                <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">{kidsVariant?.sizes?.length || 0} Tallas</span>
              </div>
              <div className="flex gap-4 mb-4 h-64">
                {renderProductImage(true, kidsVariant, kidsData)}
                {renderProductImage(false, kidsVariant, kidsData)}
              </div>
              <div className="flex flex-wrap gap-2 mt-auto pt-2">
                {kidsData?.variants?.map((v: any) => (
                  <button 
                    key={v.colorCode} onClick={() => setKidsColorCode(v.colorCode)}
                    className={`w-8 h-8 rounded-full transition-all ring-offset-2 outline-none ${kidsColorCode === v.colorCode ? 'ring-2 ring-brand-red border-brand-red scale-110 shadow-md' : 'border-2 border-surface-200 hover:border-surface-300'}`}
                    style={{ backgroundColor: v.hex || '#fff' }} title={v.colorDescription}
                  />
                ))}
              </div>
            </div>

          </div>

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
                <div className="text-gray-500 text-sm font-medium">Total (Sin IVA)</div>
                <div className="text-right">
                  <span className="text-4xl font-black text-gray-900">{grandTotal.toFixed(2)}€</span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleAprobarPresupuesto} disabled={totalQty === 0}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg ${!logoBase64 ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' : 'bg-brand-red text-white hover:bg-red-700 shadow-red-500/30'}`}
            >
              <ShoppingCart size={22} />
              {logoBase64 ? 'Aprobar Presupuesto y Proceder al Pago' : 'Sube tu logo para añadir al carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
