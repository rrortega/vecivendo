import { useState, useEffect } from "react";
import { Databases, Query } from "appwrite";
import { client } from "@/lib/appwrite";

export const useResidential = (slug) => {
    const [residential, setResidential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchResidential = async () => {
            try {
                setLoading(true);
                const databases = new Databases(client);
                const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

                const response = await databases.listDocuments(
                    dbId,
                    "residenciales",
                    [Query.equal("slug", slug)]
                );

                if (response.documents.length > 0) {
                    setResidential(response.documents[0]);
                } else {
                    setError("Residential not found");
                }
            } catch (err) {
                console.error("Error fetching residential:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResidential();
    }, [slug]);

    return { residential, loading, error };
};
