'use client';

export default function KPISection({ title, children, icon: Icon }) {
    return (
        <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
                {Icon && (
                    <div className="p-2.5  bg-indigo-900/20 rounded-xl">
                        <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                )}
                <h2 className="text-2xl font-bold   tracking-tight">
                    {title}
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {children}
            </div>
        </div>
    );
}
