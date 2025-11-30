import { Client, Databases, ID, Query } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || 'vecivendo-db';

async function seedAnuncios() {
    console.log('🌱 Seeding anuncios with native relationships...\n');

    try {
        // Get residential IDs
        const residenciales = await databases.listDocuments(dbId, 'residenciales');

        if (residenciales.documents.length === 0) {
            console.log('❌ No residentials found. Please create residentials first.');
            return;
        }

        const residencialDemo = residenciales.documents.find(r => r.slug === 'residencial-demo');
        const otroResidencial = residenciales.documents.find(r => r.slug !== 'residencial-demo');

        if (!residencialDemo) {
            console.log('❌ Residencial Demo not found');
            return;
        }

        console.log(`✅ Found Residencial Demo: ${residencialDemo.nombre} (${residencialDemo.$id})`);
        if (otroResidencial) {
            console.log(`✅ Found Other Residential: ${otroResidencial.nombre} (${otroResidencial.$id})\n`);
        }

        // Sample anuncios for Residencial Demo
        const anunciosDemo = [
            {
                titulo: "Bicicleta de montaña Trek",
                descripcion: "Bicicleta Trek en excelente estado, poco uso. Incluye casco y candado.",
                precio: 3500,
                categoria: "deportes",
                imagenes: ["https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&q=80"],
                activo: true,
                residencial: residencialDemo.$id
            },
            {
                titulo: "Sofá 3 plazas gris",
                descripcion: "Sofá moderno en perfecto estado, muy cómodo. Se entrega en el residencial.",
                precio: 5000,
                categoria: "muebles",
                imagenes: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"],
                activo: true,
                residencial: residencialDemo.$id
            },
            {
                titulo: "iPhone 13 Pro 128GB",
                descripcion: "iPhone en excelente estado, sin rayones. Incluye cargador original y funda.",
                precio: 12000,
                categoria: "tecnologia",
                imagenes: ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=800&q=80"],
                activo: true,
                residencial: residencialDemo.$id
            },
            {
                titulo: "Clases de yoga para principiantes",
                descripcion: "Clases de yoga todos los martes y jueves. Primera clase gratis.",
                precio: 200,
                categoria: "servicios",
                imagenes: ["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"],
                activo: true,
                residencial: residencialDemo.$id
            },
            {
                titulo: "Mesa de comedor de madera",
                descripcion: "Mesa de madera maciza para 6 personas. Excelente estado.",
                precio: 4500,
                categoria: "muebles",
                imagenes: ["https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80"],
                activo: true,
                residencial: residencialDemo.$id
            },
            {
                titulo: "Laptop HP Pavilion",
                descripcion: "Laptop HP i5, 8GB RAM, 256GB SSD. Perfecta para trabajo y estudio.",
                precio: 8500,
                categoria: "tecnologia",
                imagenes: ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80"],
                activo: true,
                residencial: residencialDemo.$id
            }
        ];

        // Create anuncios for Demo
        console.log(`📝 Creating ${anunciosDemo.length} anuncios for Residencial Demo...`);
        for (const anuncio of anunciosDemo) {
            try {
                await databases.createDocument(
                    dbId,
                    'anuncios',
                    ID.unique(),
                    anuncio
                );
                console.log(`   ✅ Created: ${anuncio.titulo}`);
            } catch (e) {
                console.error(`   ❌ Error creating ${anuncio.titulo}:`, e.message);
            }
        }

        // Create a few for other residential if exists
        if (otroResidencial) {
            const anunciosOtro = [
                {
                    titulo: "Consola PlayStation 5",
                    descripcion: "PS5 en perfectas condiciones con 2 controles y 3 juegos.",
                    precio: 9500,
                    categoria: "tecnologia",
                    imagenes: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80"],
                    activo: true,
                    residencial: otroResidencial.$id
                },
                {
                    titulo: "Refrigerador Samsung",
                    descripcion: "Refrigerador de 18 pies cúbicos, funciona perfectamente.",
                    precio: 6000,
                    categoria: "electrodomesticos",
                    imagenes: ["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80"],
                    activo: true,
                    residencial: otroResidencial.$id
                }
            ];

            console.log(`\n📝 Creating ${anunciosOtro.length} anuncios for ${otroResidencial.nombre}...`);
            for (const anuncio of anunciosOtro) {
                try {
                    await databases.createDocument(
                        dbId,
                        'anuncios',
                        ID.unique(),
                        anuncio
                    );
                    console.log(`   ✅ Created: ${anuncio.titulo}`);
                } catch (e) {
                    console.error(`   ❌ Error creating ${anuncio.titulo}:`, e.message);
                }
            }
        }

        console.log('\n✨ Seeding completed successfully!');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedAnuncios();
