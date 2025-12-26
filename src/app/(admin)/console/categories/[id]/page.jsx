"use client";

import { useState, useEffect } from "react";
import { databases } from "@/lib/appwrite";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryForm from "@/components/console/categories/CategoryForm";

export default function EditCategoryPage({ params }) {
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "categorias";

    useEffect(() => {
        fetchCategory();
    }, [params.id]);

    const fetchCategory = async () => {
        try {
            const doc = await databases.getDocument(dbId, collectionId, params.id);
            setCategory(doc);
        } catch (error) {
            console.error("Error fetching category:", error);
            showToast("Error al cargar categoría", "error");
            router.push("/console/categories");
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        setLoading(true);
        try {
            await databases.updateDocument(
                dbId,
                collectionId,
                params.id,
                data
            );
            showToast("Categoría actualizada correctamente", "success");
            router.push("/console/categories");
        } catch (error) {
            console.error("Error updating category:", error);
            if (error.message.includes("unique")) {
                showToast("Ya existe una categoría con ese slug", "error");
            } else {
                showToast("Error al actualizar categoría", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
        return (
            <div className="p-6">
                <div className="text-center py-12 admin-text-muted">
                    Cargando categoría...
                </div>
            </div>
        );
    }

    if (!category) {
        return null;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/console/categories"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="admin-text" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold admin-text">Editar Categoría</h1>
                    <p className="admin-text-muted">{category.nombre}</p>
                </div>
            </div>

            {/* Form */}
            <CategoryForm category={category} onSubmit={handleSubmit} loading={loading} />
        </div>
    );
}
