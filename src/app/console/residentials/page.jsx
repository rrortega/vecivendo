"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import AdminTable from "@/components/console/AdminTable";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { Building2, Plus, Search } from "lucide-react";
import { Query } from "node-appwrite";
import AddButton from "@/components/console/AddButton";
import ConfirmModal from "@/components/console/ConfirmModal";

export default function ResidentialsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { showToast } = useToast();
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "residenciales";

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
                queries.push(Query.search('nombre', searchTerm));
            }

            const response = await databases.listDocuments(dbId, collectionId, queries);

            const mappedData = response.documents.map(doc => ({
                ...doc,
                name: doc.nombre,
                address: doc.direccion,
                currency: doc.moneda || "MXN",
                active: doc.active ?? true,
            }));
            setData(mappedData);
        } catch (error) {
            console.error("Error fetching residentials:", error);
            showToast("Error al cargar residenciales", "error");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: "name",
            label: "Nombre",
            render: (value, row) => (
                <div
                    onClick={() => router.push(`/console/residentials/${row.$id}`)}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors">
                        <Building2 size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="font-medium admin-text dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {value}
                    </span>
                </div>
            )
        },
        { key: "country", label: "País" },
        { key: "currency", label: "Moneda" },
        {
            key: "active",
            label: "Estado",
            render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${value ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {value ? "Activo" : "Inactivo"}
                </span>
            )
        },
    ];



    const handleDelete = (row) => {
        setItemToDelete(row);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            await databases.deleteDocument(dbId, collectionId, itemToDelete.$id);
            showToast("Residencial eliminado correctamente", "success");
            fetchData();
        } catch (error) {
            console.error("Error deleting residential:", error);
            showToast("Error al eliminar residencial", "error");
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold admin-text">Residenciales</h1>
                <AddButton href="/console/residentials/new" label="Nuevo Residencial" />

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
                actions={[
                    {
                        label: "Ver más",
                        onClick: (item) => router.push(`/console/residentials/${item.$id}`),
                        className: "text-blue-600 hover:text-blue-800"
                    }
                ]}
                isLoading={loading}
            />

            <ConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Residencial"
                message={`¿Estás seguro de que deseas eliminar el residencial "${itemToDelete?.name}"? Esta acción no se puede deshacer y eliminará todos los datos asociados.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
}
