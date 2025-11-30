import React from "react";
import { X, Copy, Facebook, Twitter, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const ShareModal = ({ isOpen, onClose, url, title }) => {
    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            // Could add a toast here if we had a toast system ready to use easily, 
            // but for now we'll just rely on the user seeing it works or adding it later.
            // Or we can assume the parent handles the "copied" feedback if needed, 
            // but usually a visual cue on the button is nice.
            // Let's keep it simple for now.
            alert("Enlace copiado al portapapeles");
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const shareMessage = `Mira este ${title} que ha publicado un vecino en Vecivendo,\n${url}`;
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const shareLinks = [
        {
            name: "WhatsApp",
            icon: <Smartphone size={20} />,
            href: `https://wa.me/?text=${encodedMessage}`,
            color: "bg-green-500 hover:bg-green-500 border-transparent hover:border-green-600",
        },
        {
            name: "Facebook",
            icon: <Facebook size={20} />,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`,
            color: "bg-blue-600 hover:bg-blue-600 border-transparent hover:border-blue-700",
        },
        {
            name: "Twitter",
            icon: <Twitter size={20} />,
            href: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
            color: "bg-sky-500 hover:bg-sky-500 border-transparent hover:border-sky-600",
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface w-full max-w-md rounded-3xl shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 text-text-secondary hover:text-text-main"
                    onClick={onClose}
                >
                    <X size={20} />
                </Button>

                <h3 className="text-xl font-bold text-text-main mb-6">Compartir anuncio</h3>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {shareLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-2 group"
                            onClick={onClose}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-transform group-hover:scale-110 border ${link.color}`}>
                                {link.icon}
                            </div>
                            <span className="text-xs font-medium text-text-secondary group-hover:text-text-main">
                                {link.name}
                            </span>
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2 p-3 bg-background rounded-xl border border-border">
                    <span className="text-sm text-text-secondary truncate flex-1">
                        {url}
                    </span>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleCopy}
                        className="shrink-0"
                    >
                        <Copy size={16} className="mr-2" />
                        Copiar
                    </Button>
                </div>
            </div>
        </div>
    );
};
