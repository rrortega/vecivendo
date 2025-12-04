import 'dotenv/config';
import { Client, Storage } from "node-appwrite";

// Initialize client
const client = new Client();
client.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
client.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
client.setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

async function main() {
    const bucketId = 'images';
    const name = 'images';

    try {
        // Check if bucket exists
        await storage.getBucket(bucketId);
        console.log(`Bucket ${name} already exists`);
    } catch (e) {
        console.log(`Creating bucket ${name}`);
        try {
            // createBucket(bucketId, name, permissions, fileSecurity, enabled, maximumFileSize, allowedFileExtensions, compression, encryption, antivirus)
            await storage.createBucket(
                bucketId,
                name,
                [], // permissions
                false, // fileSecurity
                true, // enabled
                undefined, // maximumFileSize
                [], // allowedFileExtensions
                'none', // compression
                false, // encryption (User requested to disable this)
                true // antivirus
            );
            console.log(`Bucket ${name} created successfully with encryption disabled.`);
        } catch (createError) {
            console.error(`Error creating bucket: ${createError.message}`);
        }
    }
}

main();
