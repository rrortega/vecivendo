'use client';

export default function KPISection({ title, children, icon: Icon }) {
    return (
        <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
                {Icon && (
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                )}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {children}
            </div>
        </div>
    );
}
