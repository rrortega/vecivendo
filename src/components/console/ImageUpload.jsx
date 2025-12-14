'use client';

import { useState, useRef } from 'react';
import { storage, ID } from '@/lib/appwrite';
import { Upload, X, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

export default function ImageUpload({
    value,
    onChange,
    bucketId = 'images',
    label = 'Imagen',
    className = '',
    variant = 'standard' // standard, banner, square
}) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Determine height/aspect classes
    const getContainerClasses = () => {
        if (variant === 'square') return 'aspect-square w-full max-w-[500px] mx-auto';
        if (variant === 'banner') return 'h-64 w-full';
        return value ? 'h-64' : 'h-40';
    };

    const handleFile = async (file) => {
        if (!file) return;

        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona un archivo de imagen válido');
            return;
        }

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no debe superar los 5MB');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            // Si ya existe una imagen, intentar eliminarla del storage primero
            // Nota: Esto asume que la URL contiene el ID del archivo de Appwrite
            // Si la URL es externa, esto fallará silenciosamente, lo cual está bien
            if (value) {
                try {
                    const urlObj = new URL(value);
                    const pathParts = urlObj.pathname.split('/');
                    const fileIdIndex = pathParts.indexOf('files') + 1;
                    if (fileIdIndex > 0 && fileIdIndex < pathParts.length) {
                        const oldFileId = pathParts[fileIdIndex];
                        await storage.deleteFile(bucketId, oldFileId).catch(console.warn);
                    }
                } catch (e) {
                    // Ignorar errores al intentar borrar imagen anterior
                    console.warn('No se pudo eliminar la imagen anterior:', e);
                }
            }

            // Subir nueva imagen
            const response = await storage.createFile(
                bucketId,
                ID.unique(),
                file
            );

            // Obtener URL de visualización
            const result = storage.getFileView(bucketId, response.$id);
            const fileUrl = result.href ? result.href : result;

            if (fileUrl) {
                onChange(fileUrl);
            } else {
                console.error('Error: Could not generate file URL', result);
                setError('Error al generar la URL de la imagen');
            }
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Error al subir la imagen. Por favor intenta de nuevo.');
        } finally {
            setUploading(false);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const checkDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setShowDeleteConfirm(false);

        if (!value) return;

        try {
            setUploading(true);

            // Intentar eliminar del storage
            try {
                const urlObj = new URL(value);
                const pathParts = urlObj.pathname.split('/');
                const fileIdIndex = pathParts.indexOf('files') + 1;
                if (fileIdIndex > 0 && fileIdIndex < pathParts.length) {
                    const fileId = pathParts[fileIdIndex];
                    await storage.deleteFile(bucketId, fileId);
                }
            } catch (e) {
                console.warn('Error al procesar URL para eliminación:', e);
            }

            onChange('');
        } catch (err) {
            console.error('Error deleting image:', err);
            setError('Error al eliminar la imagen');
        } finally {
            setUploading(false);
        }
    };

    const cancelDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteConfirm(false);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    return (
        <div className={`w-full ${className}`}>
            <label className="block text-sm font-medium admin-text mb-2">
                {label}
            </label>

            <div
                className={`relative group cursor-pointer transition-all duration-200 ease-in-out
                    ${getContainerClasses()} 
                    rounded-xl border-2 border-dashed
                    ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'}
                    ${error ? 'border-red-500' : ''}
                    bg-gray-50 dark:bg-gray-800/50 overflow-hidden
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
            >
                {uploading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
                        <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Procesando imagen...</p>
                    </div>
                ) : value ? (
                    <div className="relative w-full h-full group">
                        <img
                            src={value}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current?.click();
                                    }}
                                    className="p-2 bg-white/90 rounded-full text-gray-700 hover:text-primary-600 hover:bg-white transition-all shadow-lg"
                                    title="Cambiar imagen"
                                >
                                    <Upload size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={checkDelete}
                                    className="p-2 bg-white/90 rounded-full text-gray-700 hover:text-red-600 hover:bg-white transition-all shadow-lg"
                                    title="Eliminar imagen"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-xs text-white text-center truncate px-2">
                                Click o arrastrar para reemplazar
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-primary-500 group-hover:scale-110 transition-all duration-300">
                            <ImageIcon size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Click para subir o arrastra la imagen aquí
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            PNG, JPG, GIF hasta 5MB
                        </p>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                    disabled={uploading}
                />
            </div>

            {
                error && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1">
                        <X size={14} />
                        <span>{error}</span>
                    </div>
                )
            }

            {/* Custom Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-xl animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-xl max-w-sm w-full text-center border admin-border">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-3 text-red-600 dark:text-red-400">
                                <Trash2 size={24} />
                            </div>
                            <h4 className="text-lg font-semibold admin-text mb-1">¿Eliminar imagen?</h4>
                            <p className="text-sm admin-text-muted mb-4">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-2 justify-center">
                                <button
                                    type="button"
                                    onClick={cancelDelete}
                                    className="px-4 py-2 rounded-lg border admin-border text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                    Sí, eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
