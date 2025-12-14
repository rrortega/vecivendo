
export default function Loading() {
    return (
        <div className="max-w-5xl mx-auto pb-24">
            <div className="animate-pulse space-y-8">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div>
                            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Tabs Skeleton */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <div className="flex space-x-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>

                {/* Content Skeleton */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-4">
                            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
