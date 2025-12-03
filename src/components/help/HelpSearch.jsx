'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export default function HelpSearch({ onSearch, initialValue = '' }) {
    const [query, setQuery] = useState(initialValue);

    // Update query when initialValue changes (from URL)
    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    placeholder="¿En qué podemos ayudarte hoy?"
                    className="w-full py-4 pl-12 pr-4 text-gray-900 dark:text-white bg-surface border border-gray-200 dark:border-gray-700 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onSearch(e.target.value);
                    }}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                    Buscar
                </button>
            </form>
        </div>
    );
}
