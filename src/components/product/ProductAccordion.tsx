"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Product");
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
      title: t("accordion_details_title"),
      icon: <FileText size={18} className="text-gray-400" />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-4">
          <p className="leading-relaxed">{product.longDescription || t("accordion_details_no_description")}</p>
          <ul className="space-y-2 text-sm">
            {product.material && (
              <li>
                <span className="font-semibold text-gray-900">{t("accordion_details_material")}</span> {product.material}
              </li>
            )}
            {product.dimensions && (
              <li>
                <span className="font-semibold text-gray-900">{t("accordion_details_dimensions")}</span> {product.dimensions}
              </li>
            )}
            {product.countryOfOrigin && (
              <li>
                <span className="font-semibold text-gray-900">{t("accordion_details_origin")}</span> {product.countryOfOrigin}
              </li>
            )}
          </ul>
        </div>
      ),
    },
    {
      title: t("accordion_sustainability_title"),
      icon: <Leaf size={18} className={product.isGreen ? "text-green-500" : "text-gray-400"} />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-4">
          {product.isGreen ? (
            <div className="bg-green-50 text-green-800 p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Leaf size={18} className="shrink-0 mt-0.5" />
                <p>
                  {t.rich("accordion_sustainability_green", { strong: (c) => <strong>{c}</strong> })}
                </p>
              </div>
            </div>
          ) : (
            <p className="leading-relaxed text-gray-500">
              {t("accordion_sustainability_standard")}
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
              {t("accordion_sustainability_download")}
            </a>
          )}
        </div>
      ),
    },
    {
      title: t("accordion_customization_title"),
      icon: <PaintBucket size={18} className="text-gray-400" />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-3">
          <p>{t("accordion_customization_intro")}</p>
          <p>
            {t.rich("accordion_customization_body", { strong: (c) => <strong>{c}</strong> })}
          </p>
        </div>
      ),
    },
    {
      title: t("accordion_shipping_title"),
      icon: <Truck size={18} className="text-gray-400" />,
      content: (
        <div className="text-sm text-gray-600 font-body space-y-3">
          <p>{t("accordion_shipping_intro")}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{t.rich("accordion_shipping_unbranded", { strong: (c) => <strong>{c}</strong> })}</li>
            <li>{t.rich("accordion_shipping_branded", { strong: (c) => <strong>{c}</strong> })}</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
            {t("accordion_shipping_note")}
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
