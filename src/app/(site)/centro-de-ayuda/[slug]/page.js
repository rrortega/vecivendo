'use client';

import { useState, useEffect } from 'react';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft } from 'lucide-react';
import HelpHeader from '@/components/help/HelpHeader';
import SupportChannels from '@/components/help/SupportChannels';
import { Footer } from '@/components/layout/Footer';

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';

export default function ArticlePage({ params }) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchArticle() {
            try {
                setLoading(true);
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_ID,
                    [
                        Query.equal('slug', params.slug),
                        Query.equal('active', true),
                        Query.limit(1)
                    ]
                );

                if (response.documents.length > 0) {
                    const doc = response.documents[0];
                    setArticle({
                        id: doc.$id,
                        slug: doc.slug,
                        title: doc.titulo,
                        category: doc.category,
                        excerpt: doc.descripcion,
                        content: doc.contenido_largo
                    });
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Error fetching article:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchArticle();
    }, [params.slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <HelpHeader />
                <div className="flex justify-center items-center h-[calc(100vh-200px)]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="min-h-screen bg-background">
                <HelpHeader />
                <div className="max-w-4xl mx-auto py-12 px-4 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Artículo no encontrado</h1>
                    <Link href="/centro-de-ayuda" className="text-primary-600 dark:text-white hover:text-primary-700 font-medium">
                        Volver al Centro de Ayuda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background transition-colors">
            <HelpHeader />

            <main className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/centro-de-ayuda"
                        className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 mb-8 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Volver al Centro de Ayuda
                    </Link>

                    <article className="bg-surface rounded-2xl shadow-sm overflow-hidden transition-colors">
                        <div className="p-8 sm:p-12">
                            <div className="mb-8">
                                <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
                                    {article.category}
                                </span>
                                <h1 className="text-3xl sm:text-4xl font-extrabold   dark:text-white mb-4">
                                    {article.title}
                                </h1>
                                <p className="text-xl  dark:text-white leading-relaxed">
                                    {article.excerpt}
                                </p>
                            </div>

                            <div className="markdown-content">
                                <ReactMarkdown>{article.content}</ReactMarkdown>
                            </div>
                        </div>
                    </article>
                </div>
            </main>

            <SupportChannels />
            <Footer />
        </div>
    );
}
