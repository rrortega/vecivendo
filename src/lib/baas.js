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
    const url = new URL(`${BAAS_PREFIX}/${path}`, window.location.origin);

    // Append query parameters
    Object.entries(queries).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((v, i) => url.searchParams.append(`${key}[${i}]`, v));
        } else if (value !== undefined && value !== null) {
            url.searchParams.append(key, value);
        }
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.message || error.error || `Request failed: ${response.status}`);
    }

    return response.json();
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
    const queries = {};
    queryArray.forEach((query, index) => {
        queries[`queries[${index}]`] = JSON.stringify(query);
    });
    return queries;
}

/**
 * Helper to create query objects compatible with the BaaS proxy
 * Mimics Appwrite's Query class
 */
export const BaasQuery = {
    equal: (attribute, values) => ({
        method: 'equal',
        attribute,
        values: Array.isArray(values) ? values : [values],
    }),

    notEqual: (attribute, values) => ({
        method: 'notEqual',
        attribute,
        values: Array.isArray(values) ? values : [values],
    }),

    lessThan: (attribute, value) => ({
        method: 'lessThan',
        attribute,
        values: [value],
    }),

    lessThanEqual: (attribute, value) => ({
        method: 'lessThanEqual',
        attribute,
        values: [value],
    }),

    greaterThan: (attribute, value) => ({
        method: 'greaterThan',
        attribute,
        values: [value],
    }),

    greaterThanEqual: (attribute, value) => ({
        method: 'greaterThanEqual',
        attribute,
        values: [value],
    }),

    search: (attribute, value) => ({
        method: 'search',
        attribute,
        values: [value],
    }),

    orderAsc: (attribute) => ({
        method: 'orderAsc',
        attribute,
    }),

    orderDesc: (attribute) => ({
        method: 'orderDesc',
        attribute,
    }),

    limit: (value) => ({
        method: 'limit',
        values: [value],
    }),

    offset: (value) => ({
        method: 'offset',
        values: [value],
    }),

    contains: (attribute, values) => ({
        method: 'contains',
        attribute,
        values: Array.isArray(values) ? values : [values],
    }),

    isNull: (attribute) => ({
        method: 'isNull',
        attribute,
    }),

    isNotNull: (attribute) => ({
        method: 'isNotNull',
        attribute,
    }),

    between: (attribute, start, end) => ({
        method: 'between',
        attribute,
        values: [start, end],
    }),

    startsWith: (attribute, value) => ({
        method: 'startsWith',
        attribute,
        values: [value],
    }),

    endsWith: (attribute, value) => ({
        method: 'endsWith',
        attribute,
        values: [value],
    }),

    select: (attributes) => ({
        method: 'select',
        values: Array.isArray(attributes) ? attributes : [attributes],
    }),
};

export default {
    get: baasGet,
    post: baasPost,
    patch: baasPatch,
    delete: baasDelete,
    buildQueries,
    Query: BaasQuery,
};
