'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HelpSearch from '@/components/help/HelpSearch';
import HelpCategories from '@/components/help/HelpCategories';
import ArticleCard from '@/components/help/ArticleCard';
import HelpHeader from '@/components/help/HelpHeader';
import SupportChannels from '@/components/help/SupportChannels';
import { Footer } from '@/components/layout/Footer';
import { categories } from '@/data/helpData'; // Keep categories static for now or fetch if dynamic

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE;
const COLLECTION_ID = 'contenidos';

function HelpCenterContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [activeCategory, setActiveCategory] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    useEffect(() => {
        async function fetchArticles() {
            try {
                setLoading(true);
                const queries = [
                    Query.equal('active', true),
                    Query.limit(100) // Fetch all active articles
                ];

                if (activeCategory !== 'all') {
                    queries.push(Query.equal('category', activeCategory));
                }

                // Search logic in Appwrite is limited to exact match or full text search if enabled.
                // For simple client-side search with small dataset (20 items), we can fetch all and filter client-side,
                // or use Appwrite search if configured. Given the requirement for "search in it", 
                // and likely small scale, client-side filtering after fetching active articles is responsive.
                // However, if we want to use Appwrite search, we need a search index.
                // Let's stick to client-side filtering for the 20 articles for best UX (instant feedback).

                const response = await databases.listDocuments(
                    DATABASE_ID,
                    COLLECTION_ID,
                    [Query.equal('active', true), Query.limit(100)]
                );

                // Map Appwrite documents to our article structure
                const mappedArticles = response.documents.map(doc => ({
                    id: doc.$id,
                    slug: doc.slug,
                    title: doc.titulo, // Note: using titulo as per DB schema
                    category: doc.category,
                    excerpt: doc.descripcion, // Note: using descripcion as per DB schema
                    content: doc.contenido_largo
                }));

                setArticles(mappedArticles);
            } catch (error) {
                console.error('Error fetching articles:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchArticles();
    }, []); // Fetch once on mount

    // Client-side filtering
    const filteredArticles = articles.filter((article) => {
        const matchesCategory = activeCategory === 'all' || article.category === activeCategory;
        const matchesSearch =
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.content.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentArticles = filteredArticles.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);

    return (
        <div className="min-h-screen bg-background transition-colors">
            <HelpHeader />

            <main className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-extrabold    sm:text-5xl mb-4">
                            Centro de Ayuda
                        </h1>
                        <p className="text-xl    max-w-2xl mx-auto">
                            Encuentra respuestas, guías y consejos rápidos.
                        </p>
                    </div>

                    <HelpSearch
                        initialValue={searchQuery}
                        onSearch={(query) => {
                            setSearchQuery(query);
                            setCurrentPage(1);
                        }}
                    />

                    <HelpCategories
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelectCategory={(category) => {
                            setActiveCategory(category);
                            setCurrentPage(1); // Reset to first page on category change
                        }}
                    />

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                        </div>
                    ) : filteredArticles.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                {currentArticles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center md:justify-end items-center mt-12 space-x-4">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border transition-all duration-200 
                                            bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400
                                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:dark:hover:bg-gray-800 disabled:hover:text-gray-600 disabled:dark:hover:text-gray-400"
                                        aria-label="Página anterior"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Página <span className="text-gray-900  font-bold">{currentPage}</span> de {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border transition-all duration-200 
                                            bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-primary-600 hover:border-primary-200
                                            dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-primary-400
                                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:dark:hover:bg-gray-800 disabled:hover:text-gray-600 disabled:dark:hover:text-gray-400"
                                        aria-label="Página siguiente"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="dark:text-gray-400 text-lg">
                                No encontramos artículos que coincidan con tu búsqueda.
                            </p>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setActiveCategory('all');
                                    setCurrentPage(1);
                                }}
                                className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                            >
                                Ver todos los artículos
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <SupportChannels />
            <Footer />
        </div>
    );
}

export default function HelpCenterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
        }>
            <HelpCenterContent />
        </Suspense>
    );
}
