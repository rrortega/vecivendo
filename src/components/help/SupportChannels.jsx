// Using Lucide icons for consistency and to fix build error
import { Mail, MessageCircle } from 'lucide-react';

export default function SupportChannels() {
    return (
        <div className="py-12   dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold   dark:text-white text-center mb-8">
                    ¿Necesitas más ayuda?
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pb-10">
                    <a
                        href="mailto:ayuda@vecivendo.com"
                        className="flex flex-col items-center p-6 bg-surface rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="p-3 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold  dark:text-white mb-2">
                            Envíanos un correo
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                            Te responderemos en menos de 24 horas.
                        </p>
                        <span className="mt-4 text-primary font-medium text-sm group-hover:underline">
                            ayuda@vecivendo.com
                        </span>
                    </a>

                    <a
                        href="https://wa.me/1234567890" // Replace with actual number if known
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center p-6 bg-surface rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:shadow-md transition-all group"
                    >
                        <div className="p-3 bg-primary/10 rounded-full mb-4 group-hover:scale-110 transition-transform">
                            <MessageCircle className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold  dark:text-white mb-2">
                            Chat por WhatsApp
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                            Soporte inmediato de 9am a 6pm.
                        </p>
                        <span className="mt-4 text-primary font-medium text-sm group-hover:underline">
                            Iniciar chat
                        </span>
                    </a>
                </div>
            </div>
        </div>
    );
}
