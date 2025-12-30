import { tablesDB, dbId, adsTableId, residentialsTableId } from "@/lib/appwrite-server";
import { unstable_cache } from 'next/cache';
import { redirect } from 'next/navigation';

// Helper to fetch ad data
// Helper to fetch ad data with ISR cache
const getAd = unstable_cache(
    async (adId) => {
        try {
            return await tablesDB.getRow({
                databaseId: dbId,
                tableId: adsTableId,
                rowId: adId
            });
        } catch (error) {
            console.error("Error fetching ad for metadata:", error);
            return null;
        }
    },
    ['short-link-ad'],
    { revalidate: 60, tags: ['ads'] }
);

// Helper to fetch residential data
// Helper to fetch residential data with ISR cache
const getResidential = unstable_cache(
    async (resId) => {
        try {
            return await tablesDB.getRow({
                databaseId: dbId,
                tableId: residentialsTableId,
                rowId: resId
            });
        } catch (error) {
            console.error("Error fetching residential for metadata:", error);
            return null;
        }
    },
    ['short-link-residential'],
    { revalidate: 3600, tags: ['residentials'] } // Residential data changes less frequently
);

export async function generateMetadata({ params }) {
    const { id: adId } = params;
    const ad = await getAd(adId);

    if (!ad) {
        return {
            title: "Anuncio no encontrado | Vecivendo",
            description: "El anuncio que buscas no existe o ha sido eliminado.",
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
    };
}

import RedirectTracker from './RedirectTracker';

// ... (existing imports)

// ... (existing generatesMetadata)

export default async function ShortLinkPage({ params }) {
    const { id: adId } = params;
    const ad = await getAd(adId);

    if (!ad) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
                <h1 className="text-xl font-bold mb-2">Anuncio no encontrado</h1>
                <p>El enlace que intentas abrir no es válido o el anuncio ha expirado.</p>
            </div>
        );
    }

    // Get residential slug
    const residential = await getResidential(ad.residencial);
    const residentialSlug = residential ? residential.slug : 'unknown';
    const residentialId = residential ? residential.$id : null;
    const targetUrl = `/${residentialSlug}/anuncio/${adId}`;

    return (
        <html lang="es">
            <head>
                {/* No meta refresh, let JS handle it for logging */}
                <link rel="preconnect" href="https://aw.chamba.pro" />
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                    {`
                        tailwind.config = {
                            theme: {
                                extend: {
                                    colors: {
                                        background: '#ffffff',
                                        surface: '#f3f4f6',
                                        border: '#e5e7eb',
                                    }
                                }
                            }
                        }
                    `}
                </script>
            </head>
            <body className="bg-white min-h-screen">
                <div className="fixed top-0 w-full h-10 bg-gray-200 animate-pulse z-50"></div>
                <div className="pt-10">
                    <div className="w-full h-16 border-b border-gray-200 flex items-center px-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                        <div className="w-32 h-6 rounded bg-gray-200 animate-pulse"></div>
                    </div>

                    <main className="max-w-7xl mx-auto px-4 pt-8 md:pt-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                            {/* Image Skeleton */}
                            <div className="space-y-4">
                                <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse"></div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Skeleton */}
                            <div className="space-y-6">
                                <div className="w-24 h-8 rounded-full bg-gray-100 animate-pulse"></div>
                                <div>
                                    <div className="w-3/4 h-10 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
                                    <div className="w-1/2 h-8 bg-gray-200 rounded-lg animate-pulse mb-6"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="w-full h-4 bg-gray-100 rounded animate-pulse"></div>
                                    <div className="w-full h-4 bg-gray-100 rounded animate-pulse"></div>
                                    <div className="w-2/3 h-4 bg-gray-100 rounded animate-pulse"></div>
                                </div>
                                <div className="flex items-center gap-4 mt-8">
                                    <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="w-1/3 h-3 bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>

                <RedirectTracker
                    adId={adId}
                    targetUrl={targetUrl}
                    residentialId={residentialId}
                />
            </body>
        </html>
    );
}
