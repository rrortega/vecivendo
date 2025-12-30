import { tablesDB, adsTableId } from "@/lib/appwrite-server";
import { cache } from 'react';
import AdDetailClient from "./AdDetailClient";

// Helper to fetch ad data
import { unstable_cache } from 'next/cache';

// Helper to fetch ad data with ISR cache
const getAd = unstable_cache(
    async (adId) => {
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
    },
    ['ad-details'], // Key prefix
    { revalidate: 60, tags: ['ads'] } // Cache for 60 seconds, tag for revalidation
);

export async function generateMetadata({ params }) {
    const { id: adId } = params;
    const ad = await getAd(adId);

    if (!ad) {
        return {
            title: "Anuncio no encontrado | Vecivendo",
            description: "El anuncio que buscas no existe o ha sido eliminado.",
            robots: {
                index: false,
                follow: false,
            }
        };
    }

    const title = `${ad.titulo} | Vecivendo`;
    const description = ad.descripcion ? ad.descripcion.substring(0, 160) : "Mira este anuncio en Vecivendo";
    const imageUrl = ad.imagenes && ad.imagenes.length > 0 ? ad.imagenes[0] : "https://vecivendo.com/og-image-default.jpg";

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description,
            url: `https://vecivendo.com/${params.residencial}/anuncio/${adId}`,
            images: [
                {
                    url: imageUrl,
                    width: 800,
                    height: 600,
                    alt: ad.titulo,
                },
            ],
            type: "article",
            siteName: "Vecivendo",
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: [imageUrl],
        },
        alternates: {
            canonical: `https://vecivendo.com/${params.residencial}/anuncio/${adId}`,
        }
    };
}

export default async function Page({ params }) {
    const { id: adId } = params;
    const ad = await getAd(adId);

    const jsonLd = ad ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": ad.titulo,
        "description": ad.descripcion,
        "image": ad.imagenes || [],
        "offers": {
            "@type": "Offer",
            "price": ad.precio,
            "priceCurrency": "MXN", // Asumiendo MXN, ajustar si es necesario
            "availability": ad.activo ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        }
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <AdDetailClient params={params} initialAd={ad} />
        </>
    );
}
