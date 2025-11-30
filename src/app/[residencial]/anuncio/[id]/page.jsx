import { Client, Databases } from "appwrite";
import AdDetailClient from "./AdDetailClient";

// Helper to fetch ad data
async function getAd(adId) {
    try {
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

        const databases = new Databases(client);
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

        return await databases.getDocument(dbId, "anuncios", adId);
    } catch (error) {
        console.error("Error fetching ad for metadata:", error);
        return null;
    }
}

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
    const imageUrl = ad.imagenes && ad.imagenes.length > 0 ? ad.imagenes[0] : "/og-image-default.jpg"; // Fallback image if needed

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
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: title,
            description: description,
            images: [imageUrl],
        },
    };
}

export default function Page({ params }) {
    return <AdDetailClient params={params} />;
}
