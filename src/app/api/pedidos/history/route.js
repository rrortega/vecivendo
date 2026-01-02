import { NextResponse } from "next/server";
import { databases } from "@/lib/server/appwrite";
import { Query } from "node-appwrite";

export const dynamic = "force-dynamic";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get("phone");

        if (!phone) {
            return NextResponse.json({ error: "Teléfono es requerido" }, { status: 400 });
        }

        // Extraer los últimos 10 dígitos para la comparación (evitar problemas de prefijos internacionales)
        const last10Digits = phone.replace(/\D/g, '').slice(-10);

        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

        // Fetch pedidos realizados (como comprador)
        const realizadosPromise = databases.listDocuments(dbId, "pedidos", [
            Query.endsWith("comprador_telefono", last10Digits),
            Query.orderDesc("$createdAt"),
            Query.limit(100)
        ]);

        // Fetch pedidos recibidos (como anunciante)
        const recibidosPromise = databases.listDocuments(dbId, "pedidos", [
            Query.endsWith("anunciante_telefono", last10Digits),
            Query.orderDesc("$createdAt"),
            Query.limit(100)
        ]);

        // Ejecutar en paralelo para mayor velocidad
        const [realizadosResponse, recibidosResponse] = await Promise.all([
            realizadosPromise,
            recibidosPromise
        ]);

        return NextResponse.json({
            realizados: realizadosResponse.documents,
            recibidos: recibidosResponse.documents
        });

    } catch (error) {
        console.error("Error en API de historial de pedidos:", error);
        return NextResponse.json(
            { error: "Error al obtener el historial de pedidos" },
            { status: 500 }
        );
    }
}
