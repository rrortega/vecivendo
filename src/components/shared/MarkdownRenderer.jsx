'use client';

import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
    return (
        <div className="markdown-content prose dark:prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
        </div>
    );
}
