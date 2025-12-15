import { requestDeduplicator } from './request-deduplicator';

/**
 * BaaS Client - Wrapper for making requests through the BFF proxy
 * 
 * Instead of calling Appwrite directly from the client:
 *   https://aw.chamba.pro/v1/databases/vecivendo-db/collections/anuncios/documents?queries...
 * 
 * Use this client which proxies through:
 *   /api/baas/databases/vecivendo-db/collections/anuncios/documents?queries...
 * 
 * Benefits:
 * - Hides Appwrite endpoint from browser
 * - Uses server-side API key authentication
 * - Allows caching, rate limiting, logging on server
 * - Better security (API key not exposed)
 */

const BAAS_PREFIX = '/api/baas';

/**
 * Make a GET request through the BaaS proxy
 * @param {string} path - The Appwrite API path (without /v1 prefix)
 * @param {Object} queries - Optional query parameters
 * @returns {Promise<any>} - The response data
 */
export async function baasGet(path, queries = {}) {
    // Check if it's a database document request
    const dbMatch = path.match(/databases\/([^/]+)\/collections\/([^/]+)\/documents\/?(.*)?/);

    let url;
    if (dbMatch) {
        // It is a database request, use the centralized 'records' route
        const [, dbId, colId, rest] = dbMatch;
        const docId = rest ? rest.replace(/^\//, '') : null;

        url = new URL('/api/records', window.location.origin);
        url.searchParams.append('dbId', dbId);
        url.searchParams.append('colId', colId);
        if (docId) url.searchParams.append('docId', docId);

    } else {
        // Fallback for non-database paths (storage, etc.) or just use old method?
        // User said "todas en una ruta". Assuming file storage might still need /files handling.
        // But the immediate request was for DBs.
        // Let's keep using /api/baas for non-db things if any, OR just fail?
        // The user's request focused on "collections". 
        // For safety, I will keep BAAS_PREFIX for others, but redirect DB to /api/records.
        url = new URL(`${BAAS_PREFIX}/${path}`, window.location.origin);
    }

    // Append query parameters
    Object.entries(queries).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(`${key}[]`, v));
        } else if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    const requestKey = url.toString();

    // Use deduplicator to share inflight requests
    return requestDeduplicator.execute(requestKey, async () => {
        const response = await fetch(requestKey);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.message || error.error || `Request failed: ${response.status}`);
        }

        return response.json();
    });
}

/**
 * Make a POST request through the BaaS proxy
 * @param {string} path - The Appwrite API path
 * @param {Object} body - Request body
 * @returns {Promise<any>} - The response data
 */
export async function baasPost(path, body = {}) {
    const response = await fetch(`${BAAS_PREFIX}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Make a PATCH request through the BaaS proxy
 * @param {string} path - The Appwrite API path
 * @param {Object} body - Request body
 * @returns {Promise<any>} - The response data
 */
export async function baasPatch(path, body = {}) {
    const response = await fetch(`${BAAS_PREFIX}/${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Make a DELETE request through the BaaS proxy
 * @param {string} path - The Appwrite API path
 * @returns {Promise<any>} - The response data
 */
export async function baasDelete(path) {
    const response = await fetch(`${BAAS_PREFIX}/${path}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Build Appwrite query strings for the BaaS proxy
 * 
 * Example usage:
 * ```
 * const queries = buildQueries([
 *   Query.equal('residencial', 'abc123'),
 *   Query.orderDesc('$updatedAt'),
 *   Query.limit(24),
 * ]);
 * 
 * baasGet('databases/vecivendo-db/collections/anuncios/documents', queries);
 * ```
 */
export function buildQueries(queryArray) {
    return { queries: queryArray };
}

/**
 * Helper to create query objects compatible with the BaaS proxy
 * Mimics Appwrite's Query class
 */
const formatValues = (values) => {
    return values.map(v => JSON.stringify(v)).join(',');
};

export const BaasQuery = {
    equal: (attribute, value) => `equal("${attribute}",[${formatValues(Array.isArray(value) ? value : [value])}])`,
    notEqual: (attribute, value) => `notEqual("${attribute}",[${formatValues(Array.isArray(value) ? value : [value])}])`,
    lessThan: (attribute, value) => `lessThan("${attribute}",[${formatValues([value])}])`,
    lessThanEqual: (attribute, value) => `lessThanEqual("${attribute}",[${formatValues([value])}])`,
    greaterThan: (attribute, value) => `greaterThan("${attribute}",[${formatValues([value])}])`,
    greaterThanEqual: (attribute, value) => `greaterThanEqual("${attribute}",[${formatValues([value])}])`,
    search: (attribute, value) => `search("${attribute}",[${formatValues([value])}])`,
    orderAsc: (attribute) => `orderAsc("${attribute}")`,
    orderDesc: (attribute) => `orderDesc("${attribute}")`,
    limit: (value) => `limit(${value})`,
    offset: (value) => `offset(${value})`,
    contains: (attribute, value) => `contains("${attribute}",[${formatValues(Array.isArray(value) ? value : [value])}])`,
    isNull: (attribute) => `isNull("${attribute}")`,
    isNotNull: (attribute) => `isNotNull("${attribute}")`,
    between: (attribute, start, end) => `between("${attribute}",[${formatValues([start, end])}])`,
    startsWith: (attribute, value) => `startsWith("${attribute}",[${formatValues([value])}])`,
    endsWith: (attribute, value) => `endsWith("${attribute}",[${formatValues([value])}])`,
    select: (attributes) => `select([${formatValues(Array.isArray(attributes) ? attributes : [attributes])}])`,
};

export default {
    get: baasGet,
    post: baasPost,
    patch: baasPatch,
    delete: baasDelete,
    buildQueries,
    Query: BaasQuery,
};
