import React from 'react';

export const MarketplaceSkeleton = () => {
    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            {/* Header Skeleton */}
            <header className="fixed top-0 md:top-[var(--alert-bar-height,0px)] left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border h-16">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto pt-20 md:pt-24 md:flex md:px-4 md:gap-6">
                {/* Sidebar Skeleton (Desktop) */}
                <div className="hidden md:block w-64 shrink-0 space-y-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                    ))}
                </div>

                <main className="flex-1 min-w-0">
                    {/* Mobile Category Chips Skeleton */}
                    <div className="md:hidden flex gap-3 overflow-x-hidden pb-4 px-4 mb-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse shrink-0" />
                        ))}
                    </div>

                    {/* Banner Skeleton */}
                    <div className="px-4 mb-6">
                        <div className="aspect-[21/9] md:aspect-[32/9] rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
                    </div>

                    {/* Product Grid Skeleton */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-12">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-surface rounded-xl overflow-hidden border border-border">
                                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 animate-pulse" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2 animate-pulse" />
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/3 animate-pulse" />
                                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};
