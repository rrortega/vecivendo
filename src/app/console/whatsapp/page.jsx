"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import AdminTable from "@/components/console/AdminTable";

export default function WhatsAppGroupsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "whatsapp_groups"; // Assumed collection ID

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await databases.listDocuments(dbId, collectionId);
            setData(response.documents);
        } catch (error) {
            console.error("Error fetching whatsapp groups:", error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: "$id", label: "ID" },
        { key: "name", label: "Nombre del Grupo" },
        {
            key: "link",
            label: "Enlace",
            render: (value) => (
                <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ver Grupo
                </a>
            )
        },
        { key: "residential_id", label: "Residencial ID" },
    ];

    const handleEdit = (row) => {
        alert(`Editar grupo: ${row.name}`);
    };

    const handleDelete = async (row) => {
        if (confirm("¿Estás seguro de eliminar este grupo?")) {
            try {
                await databases.deleteDocument(dbId, collectionId, row.$id);
                fetchData();
            } catch (error) {
                console.error("Error deleting group:", error);
                alert("Error al eliminar");
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Grupos de WhatsApp</h1>
                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
                    Nuevo Grupo
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
