"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send } from "lucide-react";

export function ContactSection() {
    const [formData, setFormData] = useState({
        nombre: "",
        empresa: "",
        email: "",
        telefono: "",
        asunto: "",
        mensaje: "",
        consentimiento: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.consentimiento || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMsg("");
        setIsSuccess(false);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Ocurrió un error al enviar el mensaje.");
            }

            // Exito
            setIsSuccess(true);
            setFormData({
                nombre: "",
                empresa: "",
                email: "",
                telefono: "",
                asunto: "",
                mensaje: "",
                consentimiento: false,
            });

            // Ocultar exito despues de 5 segundos
            setTimeout(() => {
                setIsSuccess(false);
            }, 5000);

        } catch (error: any) {
            setErrorMsg(error.message || "Ocurrió un error de red. Intenta nuevamente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // @ts-ignore
        const checked = type === "checkbox" ? e.target.checked : undefined;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    return (
        <section id="contacto" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
            <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-surface-200">
                <div className="grid grid-cols-1 lg:grid-cols-5 h-full">

                    {/* Left panel: Info & Image */}
                    <div className="lg:col-span-2 bg-gray-900 text-white p-10 sm:p-14 flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <img
                                src="/images/contact-us-office.png"
                                alt="Oficina creativa Universo Merchan"
                                className="w-full h-full object-cover mix-blend-luminosity"
                            />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>

                        <div className="relative z-10">
                            <h2 className="font-display font-black text-4xl mb-6">Contacto</h2>
                            <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                                <p>
                                    En <span className="text-white font-bold">Universo Merchan</span> te ayudamos a encontrar regalos corporativos y packs personalizados que conecten de verdad con las personas.
                                </p>
                                <p>
                                    Cuéntanos qué necesitas y te ayudaremos a crear una propuesta alineada con tu marca, tu campaña y la experiencia que quieres generar.
                                </p>
                                <p className="pt-4 border-t border-gray-800">
                                    Si buscas productos personalizados, packs para clientes, detalles para eventos, acciones de fidelización o una propuesta de merchandising con más intención y valor de marca, estamos aquí para ayudarte.
                                </p>
                            </div>

                            <div className="mt-12">
                                <a href="mailto:pedidos@universomerchan.com" className="inline-flex items-center gap-4 group">
                                    <div className="bg-white/10 p-3 rounded-full group-hover:bg-brand-red transition-colors">
                                        <Mail size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400 font-medium">Email de contacto</p>
                                        <p className="text-xl font-bold text-white group-hover:text-brand-red transition-colors">pedidos@universomerchan.com</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right panel: Form */}
                    <div className="lg:col-span-3 p-10 sm:p-14 bg-surface-50">
                        <div className="max-w-xl">
                            <h3 className="font-display font-bold text-2xl text-gray-900 mb-2">Cuéntanos tu idea</h3>
                            <p className="text-gray-500 mb-10">
                                Nos pondremos en contacto contigo para ayudarte a crear una propuesta a medida para tu marca.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                                        <input type="text" id="nombre" name="nombre" required value={formData.nombre} onChange={handleChange}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="empresa" className="block text-sm font-semibold text-gray-700 mb-2">Empresa</label>
                                        <input type="text" id="empresa" name="empresa" value={formData.empresa} onChange={handleChange}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Correo electrónico *</label>
                                        <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                                        <input type="tel" id="telefono" name="telefono" value={formData.telefono} onChange={handleChange}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="asunto" className="block text-sm font-semibold text-gray-700 mb-2">Asunto *</label>
                                    <input type="text" id="asunto" name="asunto" required value={formData.asunto} onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="mensaje" className="block text-sm font-semibold text-gray-700 mb-2">Mensaje *</label>
                                    <textarea id="mensaje" name="mensaje" required rows={4} value={formData.mensaje} onChange={handleChange}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex items-start gap-3 pt-2">
                                    <div className="flex items-center h-5 mt-1">
                                        <input id="consentimiento" name="consentimiento" type="checkbox" required checked={formData.consentimiento} onChange={handleChange}
                                            className="w-5 h-5 border-gray-300 rounded text-brand-red focus:ring-brand-red cursor-pointer"
                                        />
                                    </div>
                                    <label htmlFor="consentimiento" className="text-sm text-gray-600 leading-snug cursor-pointer">
                                        He leído y acepto la <Link href="/legal/privacidad" className="text-brand-red hover:underline" target="_blank">política de privacidad</Link>, y consiento el tratamiento de mis datos para gestionar mi consulta. *
                                    </label>
                                </div>

                                {errorMsg && (
                                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                                        {errorMsg}
                                    </div>
                                )}
                                
                                {isSuccess && (
                                    <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl text-sm font-medium border border-green-200 shadow-sm transition-all">
                                        🎉 ¡Mensaje enviado con éxito! Nos pondremos en contacto contigo en breve.
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button type="submit" disabled={!formData.consentimiento || isSubmitting}
                                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 bg-brand-red text-white font-bold px-8 py-4 rounded-xl hover:bg-brand-red-dark transition-colors focus:outline-none focus:ring-4 focus:ring-brand-red/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} className={isSubmitting ? "animate-pulse" : ""} />
                                        {isSubmitting ? "Enviando mensaje..." : "Enviar consulta"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
