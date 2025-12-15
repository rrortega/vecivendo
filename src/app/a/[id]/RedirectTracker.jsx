'use client';

import { useEffect } from 'react';
import { logAdView } from '@/lib/analytics';
import { useRouter } from 'next/navigation';

export default function RedirectTracker({ adId, targetUrl, residentialId, isPaid = false }) {
    const router = useRouter();

    useEffect(() => {
        const trackAndRedirect = async () => {
            try {
                // Log view with source 'sms'
                await logAdView(adId, isPaid, null, 'view', residentialId, 'sms');
            } catch (error) {
                console.error("Error logging redirect view:", error);
            } finally {
                // Perform redirect
                window.location.replace(targetUrl);
            }
        };

        trackAndRedirect();
    }, [adId, targetUrl, residentialId, isPaid]);

    return null;
}
