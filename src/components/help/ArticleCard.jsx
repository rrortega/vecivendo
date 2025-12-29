import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function ArticleCard({ article }) {
    return (
        <Link href={`/centro-de-ayuda/${article.slug}`} className="group">
            <div className="h-full bg-surface p-6 rounded-xl border    border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:border-primary dark:hover:border-primary">
                <div className="flex-1">
                    <span className="inline-block px-3 py-1 mb-3 text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
                        {article.category}
                    </span>
                    <h3 className="text-xl font-bold  text-forewround mb-3 group-hover:text-primary transition-colors">
                        {article.title}
                    </h3>
                    <p className="text-sourface text-sm leading-relaxed line-clamp-3">
                        {article.excerpt}
                    </p>
                </div>
                <div className="mt-4 flex items-center   font-medium text-sm">
                    Leer artículo
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
}
