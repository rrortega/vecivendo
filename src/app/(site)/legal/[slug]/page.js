import React from 'react';
import { getLegalPost, getAllLegalSlugs } from '@/lib/markdown';
import ReactMarkdown from 'react-markdown';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export async function generateStaticParams() {
    const slugs = getAllLegalSlugs();
    return slugs;
}

export async function generateMetadata({ params }) {
    const post = getLegalPost(params.slug);
    if (!post) {
        return {
            title: 'Página no encontrada',
        };
    }
    return {
        title: `${post.frontmatter.title} | Vecivendo`,
    };
}

export default function LegalPage({ params }) {
    const post = getLegalPost(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />
            <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <article className="prose prose-lg prose-slate max-w-none prose-headings:text-gray-900 prose-a:text-primary hover:prose-a:text-primary/80">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </article>
                </div>
            </main>
            <Footer />
        </div>
    );
}
