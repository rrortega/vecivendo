import { account } from "./appwrite";

const JWT_KEY = "vecivendo_admin_jwt";
const JWT_EXPIRY_KEY = "vecivendo_admin_jwt_expiry";
const BUFFER_TIME = 60 * 1000; // 1 minute buffer before expiry

/**
 * Service to manage Appwrite JWT tokens with caching and auto-renewal.
 * These tokens are short-lived (max 15 minutes by default in Appwrite).
 */
export const AuthService = {
    /**
     * Get a valid JWT token. 
     * Uses cache if available and not close to expiry, otherwise fetches a new one.
     */
    async getJWT() {
        try {
            const cachedToken = sessionStorage.getItem(JWT_KEY);
            const expiryStr = sessionStorage.getItem(JWT_EXPIRY_KEY);

            if (cachedToken && expiryStr) {
                const expiry = parseInt(expiryStr, 10);
                const now = Date.now();

                // If token is still valid with a buffer, return it
                if (now < (expiry - BUFFER_TIME)) {
                    return cachedToken;
                }
            }

            // Fetch new JWT
            const response = await account.createJWT();
            const newToken = response.jwt;

            // Appwrite JWTs expire in 15 minutes (900 seconds)
            // We set expiry locally to help with cache management
            const localExpiry = Date.now() + (15 * 60 * 1000);

            sessionStorage.setItem(JWT_KEY, newToken);
            sessionStorage.setItem(JWT_EXPIRY_KEY, localExpiry.toString());

            return newToken;
        } catch (error) {
            console.error("Error in AuthService.getJWT:", error);
            throw error;
        }
    },

    /**
     * Clear the cached JWT. Should be called on logout.
     */
    clearJWT() {
        sessionStorage.removeItem(JWT_KEY);
        sessionStorage.removeItem(JWT_EXPIRY_KEY);
    }
};
