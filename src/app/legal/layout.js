'use client';

import LegalHeader from '@/components/legal/LegalHeader';
import { Footer } from '@/components/layout/Footer';

export default function LegalLayout({ children }) {
    return (
        <div className="min-h-screen bg-background transition-colors flex flex-col">
            <LegalHeader />
            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    );
}
