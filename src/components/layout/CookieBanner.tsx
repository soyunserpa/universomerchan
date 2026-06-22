"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { X, Cookie } from "lucide-react";

export function CookieBanner() {
    const t = useTranslations("Misc");
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted or rejected cookies
        const cookiePreference = localStorage.getItem("cookies_accepted");
        if (!cookiePreference) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookies_accepted", "true");
        setIsVisible(false);
    };

    const handleReject = () => {
        localStorage.setItem("cookies_accepted", "false");
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-safe pointer-events-none">
            <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 sm:p-6 pointer-events-auto flex flex-col sm:flex-row gap-5 items-start sm:items-center border border-gray-800">

                <div className="flex-1 flex gap-4 items-start sm:items-center">
                    <div className="bg-gray-800 p-2 rounded-full shrink-0 flex items-center justify-center">
                        <Cookie size={20} className="text-brand-red" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm mb-1">{t("cookie_privacy_title")}</h3>
                        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                            {t.rich("cookie_privacy_text", {
                                link: (chunks) => (
                                    <Link href="/legal/cookies" className="underline hover:text-white transition-colors">
                                        {chunks}
                                    </Link>
                                ),
                            })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end mt-2 sm:mt-0">
                    <button
                        onClick={handleReject}
                        className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                    >
                        {t("cookie_reject")}
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-5 py-2 text-sm font-bold bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors whitespace-nowrap"
                    >
                        {t("cookie_accept_all")}
                    </button>
                    <button
                        onClick={handleReject}
                        className="sm:hidden ml-2 text-gray-500 hover:text-white"
                        aria-label={t("cookie_close")}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
