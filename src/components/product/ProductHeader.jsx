"use client";

import React from "react";
import { ArrowLeft, Heart, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ShareModal } from "@/components/ui/ShareModal";

export const ProductHeader = ({ title = "Anuncio", url = typeof window !== 'undefined' ? window.location.href : '' }) => {
    const router = useRouter();
    const [isShareOpen, setIsShareOpen] = React.useState(false);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Mira este ${title} que ha publicado un vecino en Vecivendo,\n${url}`,
                    url: url,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            setIsShareOpen(true);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:border-primary"
                    onClick={() => router.back()}
                >
                    <ArrowLeft size={24} />
                </Button>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full text-red-500 hover:border-red-500">
                        <Heart size={24} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full hover:border-primary"
                        onClick={handleShare}
                    >
                        <Share size={24} />
                    </Button>
                </div>
            </header>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                url={url}
                title={title}
            />
        </>
    );
};
