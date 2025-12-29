'use client';

export default function HelpCategories({ categories, activeCategory, onSelectCategory }) {
    return (
        <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
                onClick={() => onSelectCategory('all')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all border ${activeCategory === 'all'
                    ? 'border-primary text-primary bg-primary/5 shadow-sm'
                    : 'bg-surface text-sourface border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
            >
                Todos
            </button>
            {categories.map((category) => (
                <button
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all border ${activeCategory === category.id
                        ? 'border-primary text-primary bg-primary/5 shadow-sm'
                        : 'bg-surface text-forewround  border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    {category.name}
                </button>
            ))}
        </div>
    );
}
