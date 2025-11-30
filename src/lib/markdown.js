import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'src/content/legal');

export function getLegalPost(slug) {
    const fullPath = path.join(contentDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
        slug,
        frontmatter: data,
        content,
    };
}

export function getAllLegalSlugs() {
    const fileNames = fs.readdirSync(contentDirectory);
    return fileNames.map((fileName) => {
        return {
            slug: fileName.replace(/\.md$/, ''),
        };
    });
}
