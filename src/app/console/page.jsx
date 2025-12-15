'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { account } from '@/lib/appwrite'; // Ensure this utility exports the account object
import { Loader2 } from 'lucide-react';

export default function ConsolePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await account.get();
                // Check if user has 'admin' label
                const isAdmin = user.labels && user.labels.includes('admin');

                if (isAdmin) {
                    router.push('/console/dashboard');
                } else {
                    // Not admin, redirect to login
                    router.push('/login');
                }
            } catch (error) {
                // Not authenticated, redirect to login
                console.error("Auth check failed", error);
                router.push('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500 font-medium">Verificando acceso...</p>
            </div>
        </div>
    );
}
