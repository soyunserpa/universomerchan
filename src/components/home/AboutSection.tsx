import { Heart, Sparkles, Target } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

export async function AboutSection() {
    const t = await getTranslations("About");
    return (
        <section id="sobre-nosotros" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                {/* Left: Image & Decorators */}
                <div className="relative">
                    {/* Decorative Background Blob */}
                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gray-900/5 rounded-full blur-3xl"></div>

                    <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[600px] w-full">
                        <Image
                            src="/images/about-us-hero-v2.jpg"
                            alt="Regalos corporativos premium Universo Merchan"
                            fill
                            sizes="(max-width: 768px) 450px, (max-width: 1200px) 50vw, 600px"
                            className="object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 animate-slide-up hover-lift">
                        <div className="bg-brand-red/10 w-14 h-14 rounded-full flex items-center justify-center shrink-0">
                            <Heart className="text-brand-red" size={24} />
                        </div>
                        <div>
                            <p className="font-display font-black text-xl text-gray-900">{t("float_1")}</p>
                            <p className="text-sm text-gray-900 font-medium">{t("float_2")}</p>
                        </div>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-brand-red/10 text-brand-red-dark text-sm font-bold px-4 py-2 rounded-full mb-6">
                        <Sparkles size={16} /> {t("badge")}
                    </div>

                    <h2 className="font-display font-black text-4xl sm:text-5xl text-gray-900 leading-[1.1] mb-6">
                        {t("title_1")} <br className="hidden sm:block" />
                        <span className="text-brand-red">{t("title_2")}</span>
                    </h2>

                    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                        <p>
                            {t.rich("p1", { b: (chunks) => <b>{chunks}</b> })}
                        </p>
                        <p>
                            {t("p2")}
                        </p>

                        <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200 mt-8 mb-8">
                            <div className="flex gap-4 items-start">
                                <Target className="text-brand-red shrink-0 mt-1" size={24} />
                                <p className="text-gray-800 font-medium">
                                    {t.rich("highlight", { b: (chunks) => <span className="text-brand-red font-bold">{chunks}</span> })}
                                </p>
                            </div>
                        </div>

                        <p>
                            {t("p3")}
                        </p>

                        <p className="font-medium text-gray-900">
                            {t("p4")}
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
}
