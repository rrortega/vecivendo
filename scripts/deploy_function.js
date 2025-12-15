
const { Client, Functions, ID } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function deploy() {
    const functionId = 'update_ad_metrics';
    const functionName = 'Update Ad Metrics';
    const funcDir = path.join(__dirname, '../functions/update_ad_metrics');
    const codePath = path.join(funcDir, 'code.tar.gz');

    try {
        // Check if function exists
        try {
            await functions.get(functionId);
            console.log(`Function ${functionId} exists.`);
        } catch (e) {
            if (e.code === 404) {
                console.log(`Function ${functionId} not found. Creating...`);
                await functions.create(
                    functionId,
                    functionName, // name
                    'node-18.0', // runtime
                    // 'execute' permissions (optional, defaults to empty or need to check docs)
                );
                // Also need to set events? create() args vary. 
                // node-appwrite params: functionId, name, runtime, execute, events, schedule, timeout, enabled
                // Actually events are passed to update() in some versions or create.
                // Let's use update to set events after creation or during if signature allows.
                // Signature: create(functionId, name, runtime, execute, events, schedule, timeout, enabled, logging, entrypoint, commands, scopes, installationId, providerRepositoryId, providerBranch, providerSilentMode, providerRootDirectory)

                // Let's try minimal create then update
            } else {
                throw e;
            }
        }

        // Update configuration (events, etc)
        console.log('Updating configuration...');
        await functions.update(
            functionId,
            functionName,
            undefined, // runtime
            ['any'], // execute access
            [
                'databases.vecivendo-db.collections.logs.documents.*.create',
                'databases.vecivendo-db.collections.pedidos.documents.*.create',
                'databases.vecivendo-db.collections.pedidos.documents.*.update',
                'databases.vecivendo-db.collections.pedidos.documents.*.update',
                'databases.vecivendo-db.collections.reviews.documents.*.create',
                'databases.vecivendo-db.collections.anuncios.documents.*.create',
                'databases.vecivendo-db.collections.anuncios.documents.*.update',
                'databases.vecivendo-db.collections.anuncios.documents.*.delete'
            ], // events
            undefined, // schedule
            15, // timeout
            true, // enabled
            true, // logging
            'src/main.js', // entrypoint
            'npm install', // commands
            ['documents.read', 'documents.write'], // scopes
            undefined, // installationId
            undefined, // providerRepositoryId
            undefined, // providerBranch
            undefined, // providerSilentMode
            undefined // providerRootDirectory
        );

        // Manage Environment Variables
        const vars = {
            'APPWRITE_ENDPOINT': process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
            'APPWRITE_PROJECT_ID': process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
            'DATABASE_ID': process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db'
        };

        console.log('Managing environment variables...');
        const currentVars = await functions.listVariables(functionId);
        const varMap = {};
        currentVars.variables.forEach(v => { varMap[v.key] = v.$id });

        for (const [key, value] of Object.entries(vars)) {
            if (value) {
                if (varMap[key]) {
                    console.log(`Updating variable ${key} (ID: ${varMap[key]})...`);
                    await functions.updateVariable(functionId, varMap[key], key, value);
                } else {
                    console.log(`Creating variable ${key}...`);
                    await functions.createVariable(functionId, key, value);
                }
            }
        }

        console.log('Creating archive...');
        execSync(`cd ${funcDir} && tar -czf code.tar.gz .`);

        console.log('Deploying...');
        const file = InputFile.fromPath(codePath, 'code.tar.gz');

        const response = await functions.createDeployment(
            functionId,
            file, // code
            true // activate
        );

        console.log('Deployment created:', response.$id);

        fs.unlinkSync(codePath);

    } catch (e) {
        console.error('Deployment failed:', e);
    }
}

deploy();
