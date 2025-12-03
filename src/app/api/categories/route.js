import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";

const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
const collectionId = "categorias";

// GET /api/categories - Listar categorías activas
export async function GET() {
    try {
        const response = await databases.listDocuments(
            dbId,
            collectionId,
            [
                Query.equal("activo", true),
                Query.orderAsc("orden")
            ]
        );

        return NextResponse.json({
            documents: response.documents,
            total: response.total,
        });
    } catch (error) {
        console.error("❌ Error fetching categories:", error);
        return NextResponse.json(
            { error: "Error al obtener categorías" },
            { status: 500 }
        );
    }
}
