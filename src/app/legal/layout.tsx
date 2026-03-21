export default function LegalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-white min-h-screen py-16 sm:py-24">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="prose prose-lg prose-gray max-w-none 
                        [&>h1]:font-display [&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mb-8 [&>h1]:text-gray-900 
                        [&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:text-gray-800
                        [&>h3]:font-display [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-gray-800
                        [&>p]:text-gray-600 [&>p]:leading-relaxed [&>p]:mb-6
                        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:text-gray-600 [&>ul]:mb-6
                        [&>li]:mb-2
                        [&>a]:text-brand-red [&>a]:underline [&>a]:hover:text-brand-red-dark">
                    {children}
                </div>
            </div>
        </div>
    );
}
