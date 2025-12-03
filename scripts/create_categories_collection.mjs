import 'dotenv/config';
import { Client, Databases, ID, Permission, Role } from 'node-appwrite';

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = 'vecivendo-db';
const collectionId = 'categorias';

console.log('🚀 Creando colección de categorías...\n');

// Categorías iniciales con iconos de lucide-react
const categoriesData = [
    { nombre: "Comida", icono: "UtensilsCrossed", slug: "comida", descripcion: "Productos alimenticios y bebidas", orden: 1 },
    { nombre: "Servicios", icono: "Wrench", slug: "servicios", descripcion: "Servicios generales", orden: 2 },
    { nombre: "Limpieza", icono: "Sparkles", slug: "limpieza", descripcion: "Servicios y productos de limpieza", orden: 3 },
    { nombre: "Jardín", icono: "Trees", slug: "jardin", descripcion: "Jardinería y plantas", orden: 4 },
    { nombre: "Movilidad", icono: "Bus", slug: "movilidad", descripcion: "Transporte y movilidad", orden: 5 },
    { nombre: "Mudanzas", icono: "Truck", slug: "mudanzas", descripcion: "Servicios de mudanza", orden: 6 },
    { nombre: "Personal doméstico", icono: "Users", slug: "personal-domestico", descripcion: "Empleados del hogar", orden: 7 },
    { nombre: "Servicios técnicos", icono: "Settings", slug: "servicios-tecnicos", descripcion: "Reparaciones y mantenimiento", orden: 8 },
    { nombre: "Servicios profesionales", icono: "Briefcase", slug: "servicios-profesionales", descripcion: "Servicios profesionales", orden: 9 },
    { nombre: "Salud y bienestar", icono: "Heart", slug: "salud-bienestar", descripcion: "Salud, fitness y bienestar", orden: 10 },
    { nombre: "Tecnología", icono: "Laptop", slug: "tecnologia", descripcion: "Productos tecnológicos", orden: 11 },
    { nombre: "Electrónica", icono: "Smartphone", slug: "electronica", descripcion: "Dispositivos electrónicos", orden: 12 },
    { nombre: "Hogar", icono: "Home", slug: "hogar", descripcion: "Artículos para el hogar", orden: 13 },
    { nombre: "Ropa y calzado", icono: "Shirt", slug: "ropa-calzado", descripcion: "Vestimenta y calzado", orden: 14 },
    { nombre: "Mascotas", icono: "Dog", slug: "mascotas", descripcion: "Productos y servicios para mascotas", orden: 15 },
    { nombre: "Juguetes", icono: "Gamepad2", slug: "juguetes", descripcion: "Juguetes y juegos", orden: 16 },
    { nombre: "Deportes", icono: "Dumbbell", slug: "deportes", descripcion: "Artículos deportivos", orden: 17 },
    { nombre: "Vehículos", icono: "Car", slug: "vehiculos", descripcion: "Autos, motos y accesorios", orden: 18 },
    { nombre: "Inmuebles", icono: "Building2", slug: "inmuebles", descripcion: "Propiedades y bienes raíces", orden: 19 },
    { nombre: "Muebles", icono: "Armchair", slug: "muebles", descripcion: "Mobiliario", orden: 20 },
    { nombre: "Electrodomésticos", icono: "Microwave", slug: "electrodomesticos", descripcion: "Aparatos para el hogar", orden: 21 },
    { nombre: "Renta vacacional", icono: "Palmtree", slug: "renta-vacacional", descripcion: "Alquileres vacacionales", orden: 22 },
    { nombre: "Renta fija", icono: "Key", slug: "renta-fija", descripcion: "Alquileres de largo plazo", orden: 23 },
    { nombre: "Tours y experiencias", icono: "Compass", slug: "tours-experiencias", descripcion: "Actividades y experiencias", orden: 24 },
    { nombre: "Otros", icono: "Package", slug: "otros", descripcion: "Otros productos y servicios", orden: 99 }
];

async function createCollection() {
    try {
        // Intentar obtener la colección
        await databases.getCollection(dbId, collectionId);
        console.log('✅ La colección ya existe\n');
    } catch (error) {
        // Si no existe, crearla
        console.log('📝 Creando colección...');
        await databases.createCollection(
            dbId,
            collectionId,
            'Categorías',
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ],
            false // documentSecurity = false (Collection Level)
        );
        console.log('✅ Colección creada\n');
    }
}

async function createAttributes() {
    console.log('📝 Creando atributos...\n');

    const attributes = [
        { fn: 'createStringAttribute', args: ['nombre', 100, true] },
        { fn: 'createStringAttribute', args: ['icono', 50, true] },
        { fn: 'createStringAttribute', args: ['slug', 100, true] },
        { fn: 'createStringAttribute', args: ['descripcion', 500, false] },
        { fn: 'createBooleanAttribute', args: ['activo', false, true] }, // not required, default true
        { fn: 'createIntegerAttribute', args: ['orden', false] }
    ];

    for (const attr of attributes) {
        try {
            await databases[attr.fn](dbId, collectionId, ...attr.args);
            console.log(`  ✅ ${attr.args[0]}`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`  ⏭️  ${attr.args[0]} (ya existe)`);
            } else {
                console.error(`  ❌ ${attr.args[0]}:`, error.message);
            }
        }
    }

    console.log('\n⏳ Esperando 3 segundos para que los atributos estén disponibles...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
}

async function createIndex() {
    console.log('📝 Creando índice único para slug...\n');

    try {
        await databases.createIndex(
            dbId,
            collectionId,
            'slug_unique',
            'unique',
            ['slug'],
            ['asc']
        );
        console.log('✅ Índice creado\n');
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('⏭️  Índice ya existe\n');
        } else {
            console.error('❌ Error creando índice:', error.message);
        }
    }

    console.log('⏳ Esperando 2 segundos para que el índice esté disponible...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
}

async function insertCategories() {
    console.log('📝 Insertando categorías iniciales...\n');

    for (const category of categoriesData) {
        try {
            await databases.createDocument(
                dbId,
                collectionId,
                ID.unique(),
                {
                    ...category,
                    activo: true
                }
            );
            console.log(`  ✅ ${category.nombre} (${category.icono})`);
        } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('unique')) {
                console.log(`  ⏭️  ${category.nombre} (ya existe)`);
            } else {
                console.error(`  ❌ ${category.nombre}:`, error.message);
            }
        }
    }

    console.log('\n✨ Proceso completado!\n');
}

async function main() {
    try {
        await createCollection();
        await createAttributes();
        await createIndex();
        await insertCategories();

        console.log('🎉 ¡Colección de categorías lista para usar!');
        console.log('\n📊 Resumen:');
        console.log(`   - Colección: ${collectionId}`);
        console.log(`   - Categorías: ${categoriesData.length}`);
        console.log(`   - Permisos: Collection Level (any)`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
