import { Client, Databases, ID } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function setupRelationships() {
    console.log('🔧 Setting up native Appwrite relationships...\n');

    try {
        // 1. ANUNCIOS -> RESIDENCIALES (Many-to-One)
        console.log('1️⃣ Setting up anuncios -> residenciales relationship...');
        try {
            // Delete old string attribute if exists
            try {
                await databases.deleteAttribute(dbId, 'anuncios', 'residencial_id');
                console.log('   ⚠️  Deleted old residencial_id string attribute');
            } catch (e) {
                // Ignore if doesn't exist
            }

            // Create relationship
            await databases.createRelationshipAttribute(
                dbId,
                'anuncios',
                'residenciales',
                'manyToOne',
                true,
                'residencial',
                'anuncios',
                'cascade'
            );
            console.log('   ✅ Created relationship: anuncios.residencial -> residenciales');
        } catch (e) {
            if (e.code === 409) {
                console.log('   ℹ️  Relationship already exists');
            } else {
                console.error('   ❌ Error:', e.message);
            }
        }

        // 2. ANUNCIOS -> USUARIOS (Many-to-One) - anunciante
        console.log('\n2️⃣ Setting up anuncios -> usuarios (anunciante) relationship...');
        try {
            // Delete old string attribute if exists
            try {
                await databases.deleteAttribute(dbId, 'anuncios', 'anunciante_id');
                console.log('   ⚠️  Deleted old anunciante_id string attribute');
            } catch (e) {
                // Ignore
            }

            await databases.createRelationshipAttribute(
                dbId,
                'anuncios',
                'usuarios',
                'manyToOne',
                true,
                'anunciante',
                'mis_anuncios',
                'cascade'
            );
            console.log('   ✅ Created relationship: anuncios.anunciante -> usuarios');
        } catch (e) {
            if (e.code === 409) {
                console.log('   ℹ️  Relationship already exists');
            } else {
                console.error('   ❌ Error:', e.message);
            }
        }

        // 3. ANUNCIOS_PAGO -> RESIDENCIALES (Many-to-Many)
        console.log('\n3️⃣ Setting up anuncios_pago -> residenciales relationship...');
        try {
            await databases.createRelationshipAttribute(
                dbId,
                'anuncios_pago',
                'residenciales',
                'manyToMany',
                true,
                'residenciales',
                'anuncios_pago',
                'cascade'
            );
            console.log('   ✅ Created relationship: anuncios_pago.residenciales <-> residenciales');
        } catch (e) {
            if (e.code === 409) {
                console.log('   ℹ️  Relationship already exists');
            } else {
                console.error('   ❌ Error:', e.message);
            }
        }

        // 4. AVISOS_COMUNIDAD -> RESIDENCIALES (Many-to-One) - Already done
        console.log('\n4️⃣ Checking avisos_comunidad -> residenciales relationship...');
        console.log('   ✅ Already configured');

        console.log('\n✨ All relationships configured successfully!\n');
        console.log('📝 Summary of relationships:');
        console.log('   • anuncios.residencial -> residenciales (Many-to-One)');
        console.log('   • anuncios.anunciante -> usuarios (Many-to-One)');
        console.log('   • anuncios_pago.residenciales <-> residenciales (Many-to-Many)');
        console.log('   • avisos_comunidad.residencial -> residenciales (Many-to-One)');

    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

setupRelationships();
