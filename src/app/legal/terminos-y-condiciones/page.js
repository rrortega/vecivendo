import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { getLegalPost } from '@/lib/markdown';

export default function TermsPage() {
    const { content } = getLegalPost('terminos-y-condiciones') || { content: 'Contenido no encontrado.' };

    return (
        <div className="bg-surface rounded-2xl shadow-sm p-8 sm:p-12 transition-colors">
            <MarkdownRenderer content={content} />
        </div>
    );
}
