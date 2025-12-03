"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import AdminTable from "@/components/console/AdminTable";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Query } from "node-appwrite";

export default function WhatsAppGroupsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "grupos_whatsapp";

    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchData();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const queries = [Query.orderDesc('$createdAt')];

            if (searchTerm) {
                queries.push(Query.search('nombre_grupo', searchTerm));
            }

            const response = await databases.listDocuments(dbId, collectionId, queries);
            setData(response.documents);
        } catch (error) {
            console.error("Error fetching whatsapp groups:", error);
        } finally {
            setLoading(false);
        }
    };

    const router = useRouter();

    const columns = [
        { key: "nombre_grupo", label: "Nombre del Grupo" },
        { key: "whatsapp_group_id", label: "WhatsApp ID" },
        {
            key: "residencial",
            label: "Residencial",
            render: (value) => value ? value.nombre : "Sin asignar"
        },
    ];

    const handleRowClick = (row) => {
        router.push(`/console/whatsapp/${row.$id}`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold admin-text">Grupos de WhatsApp</h1>
            </div>

            {/* Filters */}
            <div className="admin-surface p-4 rounded-xl shadow-sm border admin-border mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative col-span-1 md:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border admin-border admin-bg admin-text focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            <AdminTable
                columns={columns}
                data={data}
                onRowClick={handleRowClick}
                isLoading={loading}
            />
        </div>
    );
}
