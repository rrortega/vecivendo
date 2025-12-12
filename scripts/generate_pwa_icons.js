
// Wrapper to handle Jimp import differences
async function getJimp() {
    let jimp;
    try {
        jimp = require('jimp');
        if (typeof jimp.read !== 'function' && jimp.Jimp) {
            jimp = jimp.Jimp;
        } else if (typeof jimp.read !== 'function' && jimp.default) {
            jimp = jimp.default;
        }
    } catch (e) {
        console.error("Could not require jimp", e);
    }
    return jimp;
}

const path = require('path');

const SOURCE = 'public/vecivendo_logo_primary.png';
const OUTPUT_DIR = 'public';

async function generateIcons() {
    try {
        const Jimp = await getJimp();

        // Debug
        // console.log("Jimp object keys:", Object.keys(Jimp));

        console.log(`Reading source image from ${SOURCE}...`);

        let image;
        // Handle new Jimp usage if .read is definitely missing on the default export
        if (Jimp.read) {
            image = await Jimp.read(SOURCE);
        } else {
            // Maybe it is the class itself?
            // const img = new Jimp();
            // console.log("Manual read invalid");
            throw new Error("Jimp.read is missing");
        }

        console.log('Generating icons in parallel...');

        const tasks = [
            { w: 192, h: 192, name: 'icon-192x192.png' },
            { w: 512, h: 512, name: 'icon-512x512.png' },
            { w: 32, h: 32, name: 'favicon-32x32.png' },
            { w: 180, h: 180, name: 'apple-touch-icon.png' }
        ];

        await Promise.all(tasks.map(async (task) => {
            console.log(`Generating ${task.name}...`);
            const clone = await image.clone();
            await clone.resize({ w: task.w, h: task.h });
            await clone.write(path.join(OUTPUT_DIR, task.name));
            console.log(`Finished ${task.name}`);
        }));

        console.log('Icons generated successfully!');

    } catch (error) {
        console.error("Error generating icons:", error);
    }
}

generateIcons();
