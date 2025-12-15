/**
 * RequestDeduplicator
 * 
 * Implements "Promise Sharing" pattern.
 * Use this to prevent duplicate inflight requests for the same resource.
 * If a request is already pending for a given key, it returns the existing promise
 * instead of creating a new one.
 */
class RequestDeduplicator {
    constructor() {
        this.inflight = new Map();
    }

    /**
     * Executes a promise-returning function, sharing the result if called multiple times
     * with the same key while the first call is still pending.
     * 
     * @param {string} key - Unique identifier for the request (e.g. URL + params)
     * @param {Function} promiseFactory - Function that returns the promise to execute
     * @returns {Promise} The result of the promise
     */
    execute(key, promiseFactory) {
        // If request is already in flight, return the existing promise
        if (this.inflight.has(key)) {
            // console.log(`[Deduplicator] Sharing promise for: ${key}`);
            return this.inflight.get(key);
        }

        // Create new promise
        const promise = promiseFactory();

        // Store it
        this.inflight.set(key, promise);

        // Clean up when done (success or failure)
        promise.finally(() => {
            this.inflight.delete(key);
        });

        return promise;
    }
}

// Export singleton instance
export const requestDeduplicator = new RequestDeduplicator();
