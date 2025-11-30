"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import AdminTable from "@/components/console/AdminTable";

export default function MessagesPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "messages"; // Assumed collection ID

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(dbId, collectionId);
            setData(response.documents);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: "$id", label: "ID" },
        { key: "content", label: "Contenido" },
        { key: "type", label: "Tipo" },
        { key: "residential_id", label: "Residencial ID" },
        { key: "$createdAt", label: "Fecha Creación", render: (val) => new Date(val).toLocaleDateString() },
    ];

    const handleEdit = (row) => {
        alert(`Editar mensaje: ${row.$id}`);
    };

    const handleDelete = async (row) => {
        if (confirm("¿Estás seguro de eliminar este mensaje?")) {
            try {
                await databases.deleteDocument(dbId, collectionId, row.$id);
                fetchData();
            } catch (error) {
                console.error("Error deleting message:", error);
                alert("Error al eliminar");
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensajes</h1>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
                    Nuevo Mensaje
                </button>
            </div>

            <AdminTable
                columns={columns}
                data={data}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isLoading={loading}
            />
        </div>
    );
}
