import { Client, Account, ID } from 'appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);

async function createAdmin() {
    try {
        console.log('Creating user admin@vecivendo.com...');
        // userId, email, password, name
        const response = await account.create(
            ID.unique(),
            'admin@vecivendo.com',
            'L4cl4v3!',
            'Admin'
        );
        console.log('User created successfully!');
        console.log('ID:', response.$id);
        console.log('Email:', response.email);
    } catch (error) {
        console.error('Error creating user:', error.message);
        if (error.code === 409) {
            console.log('User already exists.');
        }
    }
}

createAdmin();
