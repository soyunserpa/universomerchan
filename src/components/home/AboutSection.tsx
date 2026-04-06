import { Heart, Sparkles, Target } from "lucide-react";
import Image from "next/image";

export function AboutSection() {
    return (
        <section id="sobre-nosotros" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                {/* Left: Image & Decorators */}
                <div className="relative">
                    {/* Decorative Background Blob */}
                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-gray-900/5 rounded-full blur-3xl"></div>

                    <div className="relative rounded-3xl overflow-hidden shadow-2xl h-[600px] w-full">
                        <img
                            src="/images/about-us-hero-new.webp"
                            alt="Regalos corporativos premium Universo Merchan"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                        />
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 animate-slide-up hover-lift">
                        <div className="bg-brand-red/10 w-14 h-14 rounded-full flex items-center justify-center shrink-0">
                            <Heart className="text-brand-red" size={24} />
                        </div>
                        <div>
                            <p className="font-display font-black text-xl text-gray-900">Conexión</p>
                            <p className="text-sm text-gray-900 font-medium">Emocional Real</p>
                        </div>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-brand-red/10 text-brand-red-dark text-sm font-bold px-4 py-2 rounded-full mb-6">
                        <Sparkles size={16} /> Sobre nosotros
                    </div>

                    <h2 className="font-display font-black text-4xl sm:text-5xl text-gray-900 leading-[1.1] mb-6">
                        Más que un objeto, <br className="hidden sm:block" />
                        <span className="text-brand-red">una forma de emocionar.</span>
                    </h2>

                    <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                        <p>
                            En Universo Merchan creemos que un regalo corporativo puede ser mucho más que un objeto. Puede ser una forma de agradecer, de dar la bienvenida, de reconocer, de inspirar y de crear un <b>vínculo real</b> entre una marca y las personas.
                        </p>
                        <p>
                            Creamos Universo Merchan con un propósito muy claro: ayudar a las empresas a transformar el merchandising en una herramienta de conexión emocional. En un entorno cada vez más digital, creemos en el valor de lo tangible, en esos detalles que se tocan, se usan y se recuerdan.
                        </p>

                        <div className="bg-surface-50 p-6 rounded-2xl border border-surface-200 mt-8 mb-8">
                            <div className="flex gap-4 items-start">
                                <Target className="text-brand-red shrink-0 mt-1" size={24} />
                                <p className="text-gray-800 font-medium">
                                    Lo que nos diferencia es nuestra forma de entender el merchandising: no como un simple soporte promocional, sino como una <span className="text-brand-red font-bold">oportunidad para emocionar, fidelizar y dejar huella</span>.
                                </p>
                            </div>
                        </div>

                        <p>
                            Nuestra propuesta de valor consiste en acompañar a las marcas en la creación de regalos corporativos y packs personalizados con sentido, alineados con su identidad, sus valores y el momento que quieren generar en sus clientes, equipos o colaboradores. No se trata solo de elegir productos, sino de construir experiencias memorables a través de ellos.
                        </p>

                        <p className="font-medium text-gray-900">
                            Y, sobre todo, estamos aquí para ayudarte. Si necesitas encontrar el producto adecuado, diseñar un pack personalizado o dar forma a una acción especial para tu marca, en Universo Merchan queremos acompañarte en el proceso.
                        </p>
                    </div>
                </div>

            </div>
        </section>
    );
}
