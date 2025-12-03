"use client";

import { useState } from "react";
import { databases } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import CategoryForm from "@/components/console/categories/CategoryForm";

export default function CreateCategoryPage() {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";
    const collectionId = "categorias";

    const handleSubmit = async (data) => {
        setLoading(true);
        try {
            await databases.createDocument(
                dbId,
                collectionId,
                ID.unique(),
                data
            );
            showToast("Categoría creada correctamente", "success");
            router.push("/console/categories");
        } catch (error) {
            console.error("Error creating category:", error);
            if (error.message.includes("unique")) {
                showToast("Ya existe una categoría con ese slug", "error");
            } else {
                showToast("Error al crear categoría", "error");
            }
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-bold admin-text">Nueva Categoría</h1>
                    <p className="admin-text-muted">Crea una nueva categoría de anuncios</p>
                </div>
            </div>

            {/* Form */}
            <CategoryForm onSubmit={handleSubmit} loading={loading} />
        </div>
    );
}
