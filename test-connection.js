require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

async function test() {
    console.log("Endpoint:", process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
    console.log("Project:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    try {
        console.log("Fetching residential...");
        // Use a slug query similar to the failing route
        // We need to implement listDocuments because searching by slug usually requires list
        // api/residentials logic: listDocuments(dbId, 'residenciales', [Query.equal('slug', slug)])
        // But let's just try to list one document to see if connection works.
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';
        const result = await databases.listDocuments(dbId, 'residenciales', []);
        console.log("Success! Found " + result.total + " docs.");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
