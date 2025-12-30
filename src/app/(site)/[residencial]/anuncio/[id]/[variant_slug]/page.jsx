import AdDetailClient from "../AdDetailClient";
import { tablesDB, adsTableId } from "@/lib/appwrite-server";
import { cache } from 'react';

// Helper to fetch ad data (reused from parent page logic if needed, or just let client handle it)
// For metadata, we might want to fetch the specific variant info if possible, 
// but for now we'll reuse the main ad metadata logic or similar.

const getAd = cache(async (adId) => {
    try {
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
        return await tablesDB.getRow({
            databaseId: dbId,
            tableId: adsTableId || "anuncios",
            rowId: adId
        });
    } catch (error) {
        console.error("Error fetching ad for metadata:", error);
        return null;
    }
});

export async function generateMetadata({ params }) {
    const { id: adId, variant_slug } = params;
    const ad = await getAd(adId);

    if (!ad) {
        return {
            title: "Variante no encontrada | Vecivendo",
            description: "La variante del anuncio que buscas no existe.",
        };
    }

    // Try to find the variant to customize metadata
    let variantTitle = ad.titulo;
    let variantDescription = ad.descripcion;
    let imageUrl = ad.imagenes && ad.imagenes.length > 0 ? ad.imagenes[0] : "/og-image-default.jpg";

    if (ad.variants && ad.variants.length > 0) {
        try {
            const decodedVariants = ad.variants.map(v => JSON.parse(atob(v)));
            // Simple slug generation match (should match client logic)
            const generateSlug = (text) => text.toString().toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-]+/g, '')
                .replace(/\-\-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');

            const match = decodedVariants.find(v => generateSlug(v.type) === variant_slug);

            if (match) {
                variantTitle = `${match.type} - ${ad.titulo} | Vecivendo`;
                // Could customize description or image if variant has specific ones
            }
        } catch (e) {
            console.error("Error parsing variants for metadata", e);
        }
    }

    return {
        title: variantTitle,
        description: variantDescription ? variantDescription.substring(0, 160) : "Mira este anuncio en Vecivendo",
        openGraph: {
            title: variantTitle,
            description: variantDescription,
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 600,
                    alt: variantTitle,
                },
            ],
            type: "website",
        },
    };
}

export default async function Page({ params }) {
    const { id: adId } = params;
    const ad = await getAd(adId);
    return <AdDetailClient params={params} initialAd={ad} />;
}
