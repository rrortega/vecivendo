import { HomeHeader } from "@/components/home/HomeHeader";
import { CommunityAlertBar } from "@/components/layout/CommunityAlertBar";
import { ArrowLeft, Share2, Heart } from "lucide-react";

export function AdDetailSkeleton() {
    return (
        <div className="min-h-screen bg-background pb-24" style={{ paddingTop: 'var(--alert-bar-height, 0px)' }}>
            {/* Header & Alert Bar Skeleton */}
            <div className="w-full h-16 border-b border-border bg-background flex items-center px-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse mr-3" />
                <div className="w-32 h-6 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
            </div>

            <main className="max-w-7xl mx-auto px-4 pt-20 md:pt-24">
                {/* Back Button Skeleton */}
                <div className="flex items-center mb-6">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mr-2" />
                    <div className="w-32 h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Image Gallery Skeleton */}
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden relative animate-pulse">
                            {/* Actions */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                            </div>
                        </div>
                        {/* Thumbnails */}
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>

                    {/* Product Info Skeleton */}
                    <div className="space-y-6">
                        {/* Badge */}
                        <div className="w-24 h-8 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse" />

                        {/* Title & Price */}
                        <div>
                            <div className="w-3/4 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-4" />
                            <div className="w-1/2 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse mb-6" />
                            <div className="w-1/3 h-5 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                        </div>

                        {/* Variants Skeleton */}
                        <div className="space-y-3">
                            <div className="w-32 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            <div className="flex gap-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-24 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                                ))}
                            </div>
                        </div>

                        {/* Expiration */}
                        <div className="w-48 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />

                        {/* Description */}
                        <div className="bg-surface rounded-xl p-6 border border-border space-y-2">
                            <div className="w-32 h-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
                            <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            <div className="w-2/3 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        </div>

                        {/* Advertiser */}
                        <div className="bg-surface rounded-xl p-6 border border-border flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            <div className="space-y-2 flex-1">
                                <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                                <div className="w-1/3 h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
