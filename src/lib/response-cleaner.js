/**
 * Cleans an Appwrite document or object by removing system attributes
 * and null values.
 * 
 * @param {Object} doc - The document to clean
 * @returns {Object} - The cleaned document
 */
export function cleanDocument(doc) {
    try {
        if (!doc || typeof doc !== 'object') return doc;

        const cleaned = { ...doc };

        // Remove Appwrite system attributes
        // delete cleaned['$createdAt'];
        // delete cleaned['$updatedAt'];
        delete cleaned['$permissions'];
        delete cleaned['$databaseId'];
        delete cleaned['$collectionId'];
        delete cleaned['sequence']; // Often internal
        delete cleaned['$sequence'];

        // Remove null values
        Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === null) {
                delete cleaned[key];
            }
        });

        return cleaned;
    } catch (e) {
        console.error("Error cleaning document:", e);
        return doc; // Fallback to original
    }
}

/**
 * Cleans an array of Appwrite documents
 * 
 * @param {Array} documents - Array of documents
 * @returns {Array} - Array of cleaned documents
 */
export function cleanDocuments(documents) {
    if (!Array.isArray(documents)) return [];
    return documents.map(cleanDocument);
}
