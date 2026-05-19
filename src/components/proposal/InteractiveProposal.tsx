"use client";

import { useState } from "react";
import { ShoppingCart, CheckCircle, Package } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

export default function InteractiveProposal({ productDataMap, printData }: { productDataMap: any; printData: any }) {
  const router = useRouter();
  const { addItem } = useCart();
  
  const [qtyAdult, setQtyAdult] = useState(300);
  const [qtyKids, setQtyKids] = useState(300);
  const totalQty = qtyAdult + qtyKids;

  const [colorCodes, setColorCodes] = useState<{ [key: string]: string }>({});

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

  const handleAddToCart = (opt: any) => {
    const adultData = productDataMap[opt.adultCode];
    const kidsData = productDataMap[opt.kidsCode];
    
    const adultColor = colorCodes[opt.adultCode] || adultData?.variants?.[0]?.colorCode;
    const kidsColor = colorCodes[opt.kidsCode] || kidsData?.variants?.[0]?.colorCode;
    
    const adultVariant = adultData?.variants?.find((v: any) => v.colorCode === adultColor) || adultData?.variants?.[0];
    const kidsVariant = kidsData?.variants?.find((v: any) => v.colorCode === kidsColor) || kidsData?.variants?.[0];

    const adultCalc = calculateCost(qtyAdult, adultVariant, adultData);
    const kidsCalc = calculateCost(qtyKids, kidsVariant, kidsData);

    const getCustomizationPayload = () => ({
      positions: [
        { positionId: "CHEST", positionName: "Pecho", techniqueId: "ST1", techniqueName: "Serigrafía", printWidthMm: 100, printHeightMm: 100, numColors: 1, pmsColors: [], instructions: "" },
        { positionId: "BACK", positionName: "Espalda", techniqueId: "ST1", techniqueName: "Serigrafía", printWidthMm: 280, printHeightMm: 420, numColors: 1, pmsColors: [], instructions: "" }
      ],
      artworkUrl: "",
      artworkFileName: "logo_pendiente.png",
      mockupUrl: null
    });

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Propuesta Aniversario <br/><span className="text-brand-red">Academia Gijón</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto font-medium">
          Selección de camisetas de alta calidad. Todos los precios incluyen marcaje a 1 color en Pecho y Espalda.
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-surface-200 mb-12 max-w-2xl mx-auto">
        <h3 className="font-bold text-gray-900 mb-6 flex items-center justify-center gap-2 text-xl">
          <Package className="text-brand-red" /> Ajuste de Cantidades
        </h3>
        <div className="space-y-6">
          <div>
            <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
              Adulto (Unisex) <span className="bg-gray-100 px-3 py-1 rounded-md text-gray-900">{qtyAdult} uds</span>
            </label>
            <input type="range" min="0" max="1000" step="10" value={qtyAdult} onChange={(e) => setQtyAdult(parseInt(e.target.value))} className="w-full accent-brand-red" />
          </div>
          <div>
            <label className="flex justify-between text-sm font-semibold text-gray-700 mb-2">
              Infantil <span className="bg-gray-100 px-3 py-1 rounded-md text-gray-900">{qtyKids} uds</span>
            </label>
            <input type="range" min="0" max="1000" step="10" value={qtyKids} onChange={(e) => setQtyKids(parseInt(e.target.value))} className="w-full accent-brand-red" />
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {options.map((opt, idx) => {
          const adultData = productDataMap[opt.adultCode];
          const kidsData = productDataMap[opt.kidsCode];
          
          if (!adultData || !kidsData) return null;

          const adultColor = colorCodes[opt.adultCode] || adultData?.variants?.[0]?.colorCode;
          const kidsColor = colorCodes[opt.kidsCode] || kidsData?.variants?.[0]?.colorCode;
          
          const adultVariant = adultData?.variants?.find((v: any) => v.colorCode === adultColor) || adultData?.variants?.[0];
          const kidsVariant = kidsData?.variants?.find((v: any) => v.colorCode === kidsColor) || kidsData?.variants?.[0];

          const adultCalc = calculateCost(qtyAdult, adultVariant, adultData);
          const kidsCalc = calculateCost(qtyKids, kidsVariant, kidsData);
          const grandTotal = adultCalc.totalPVP + kidsCalc.totalPVP;

          return (
            <div key={idx} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 bg-gray-50 p-6 md:p-8 flex flex-col justify-center border-r border-gray-100">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Versión Adulto</span>
                    <img src={adultVariant?.images?.[0] || adultData.mainImage} className="w-full aspect-square object-contain mix-blend-multiply drop-shadow-sm bg-white rounded-xl border border-gray-100 p-2" alt="Adulto" />
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                      {adultData.variants?.map((v: any) => (
                        <button 
                          key={v.colorCode} onClick={() => setColorCodes(prev => ({ ...prev, [opt.adultCode]: v.colorCode }))}
                          className={`w-6 h-6 rounded-full transition-all outline-none ${adultColor === v.colorCode ? 'ring-2 ring-brand-red ring-offset-1 scale-110' : 'border border-gray-200'}`}
                          style={{ backgroundColor: v.hex || '#fff' }} title={v.colorDescription}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Versión Niño</span>
                    <img src={kidsVariant?.images?.[0] || kidsData.mainImage} className="w-full aspect-square object-contain mix-blend-multiply drop-shadow-sm bg-white rounded-xl border border-gray-100 p-2" alt="Niño" />
                    <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
                      {kidsData.variants?.map((v: any) => (
                        <button 
                          key={v.colorCode} onClick={() => setColorCodes(prev => ({ ...prev, [opt.kidsCode]: v.colorCode }))}
                          className={`w-6 h-6 rounded-full transition-all outline-none ${kidsColor === v.colorCode ? 'ring-2 ring-brand-red ring-offset-1 scale-110' : 'border border-gray-200'}`}
                          style={{ backgroundColor: v.hex || '#fff' }} title={v.colorDescription}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-3/5 p-6 md:p-10 flex flex-col">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{opt.title}</h2>
                <p className="text-gray-600 mb-6">{opt.desc}</p>
                
                <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 text-sm">Adulto ({qtyAdult} uds)</span>
                    <span className="font-bold text-lg">{qtyAdult > 0 ? adultCalc.unitPVP.toFixed(2) : '0.00'} € <span className="text-xs text-gray-500 font-normal">/ud</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700 text-sm">Niño ({qtyKids} uds)</span>
                    <span className="font-bold text-lg">{qtyKids > 0 ? kidsCalc.unitPVP.toFixed(2) : '0.00'} € <span className="text-xs text-gray-500 font-normal">/ud</span></span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <ul className="text-xs text-gray-500 space-y-1.5 font-medium">
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Serigrafía a 1 color incluida (Pecho pequeño y Espalda grande)</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Costes fijos de fotolitos y pantallas incluidos</li>
                      <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500"/> Manipulación y preparación incluidas</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Precio Total (Sin IVA)</span>
                    <span className="text-3xl font-black text-brand-red">{grandTotal.toFixed(2)} €</span>
                  </div>
                  <button 
                    onClick={() => handleAddToCart(opt)}
                    disabled={totalQty === 0}
                    className="w-full md:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-red transition-all shadow-lg disabled:opacity-50"
                  >
                    Elegir Opción <ShoppingCart size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
