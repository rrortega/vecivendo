import React from 'react';

export default function Sidebar({
    categories,
    selectedCategory,
    onSelectCategory,
    children
}) {
    return (
        <aside className="hidden lg:block w-64 flex-shrink-0 pr-6 border-r border-border mr-6">
            <div className="sticky top-24 space-y-8">
                {/* Categorías */}
                <div>
                    <h3 className="font-semibold text-lg mb-4 text-text-main">Categorías</h3>
                    <div className="space-y-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => onSelectCategory(cat)}
                                className={`
                                    w-full text-left px-3 py-2 rounded-md text-sm transition-colors border border-transparent
                                    ${selectedCategory === cat
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-text-secondary hover:border-primary hover:text-text-main'
                                    }
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filtros adicionales inyectados como children */}
                {children}
            </div>
        </aside>
    );
}
