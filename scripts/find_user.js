
import { Client, Users, Query } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

const targetPhone = "5215541263382";
// Clean: 5215541263382
// Last 10: 5541263382

async function findUser() {
    try {
        console.log(`Searching for phone: ${targetPhone}`);

        // Try 1: Search parameter with the full number
        console.log("--- Attempt 1: Search by full number ---");
        const res1 = await users.list([], targetPhone);
        if (res1.users.length > 0) {
            console.log("Found via search(full):");
            console.log(JSON.stringify(res1.users[0], null, 2));
        } else {
            console.log("Not found via search(full)");
        }

        // Try 2: Search parameter with last 10
        const last10 = "5541263382";
        console.log(`--- Attempt 2: Search by last 10 (${last10}) ---`);
        const res2 = await users.list([], last10);
        if (res2.users.length > 0) {
            console.log("Found via search(last10):", res2.users[0].$id, res2.users[0].phone);
        } else {
            console.log("Not found via search(last10)");
        }

        // Try 3: Query.equal phone (requires exact format match, usually +52...)
        // Appwrite stores phones as +[country][number]
        const formatted = "+" + targetPhone;
        console.log(`--- Attempt 3: Query.equal('phone', '${formatted}') ---`);
        try {
            const res3 = await users.list([Query.equal("phone", formatted)]);
            if (res3.users.length > 0) {
                console.log("Found via equal(formatted):", res3.users[0].$id, res3.users[0].phone);
            } else {
                console.log("Not found via equal(formatted)");
            }
        } catch (e) {
            console.log("Error in equal query:", e.message);
        }

        // Try 4: Query.equal phone with just +52... without the 1? 
        // Mexico numbers in Appwrite might be stored as +5255...
        const formattedNo1 = "+52" + last10;
        console.log(`--- Attempt 4: Query.equal('phone', '${formattedNo1}') ---`);
        try {
            const res4 = await users.list([Query.equal("phone", formattedNo1)]);
            if (res4.users.length > 0) {
                console.log("Found via equal(formattedNo1):", res4.users[0].$id, res4.users[0].phone);
            } else {
                console.log("Not found via equal(formattedNo1)");
            }
        } catch (e) {
            console.log("Error in equal(no1) query:", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

findUser();
