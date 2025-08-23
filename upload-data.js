require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

// Reutilizamos el esquema del menú
const MenuSchema = new mongoose.Schema({
    lang: { type: String, required: true, unique: true },
    informacionGeneral: mongoose.Schema.Types.Mixed,
    categorias: [mongoose.Schema.Types.Mixed]
});
const Menu = mongoose.model('Menu', MenuSchema);

async function uploadData() {
    if (!process.env.MONGODB_URI) {
        console.error('Error: La variable MONGODB_URI no está definida en el archivo .env');
        return;
    }
    try {
        console.log('Conectando a MongoDB Atlas...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado con éxito.');

        await Menu.deleteMany({});
        console.log('Datos antiguos eliminados.');

        const dataDir = path.join(__dirname, 'data');
        const files = await fs.readdir(dataDir);
        const menuFiles = files.filter(file => file.startsWith('menu_') && file.endsWith('.json'));

        for (const file of menuFiles) {
            const lang = file.split('_')[1].split('.')[0];
            const filePath = path.join(dataDir, file);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const menuData = JSON.parse(fileContent);

            const menuDocument = new Menu({ ...menuData, lang: lang });
            await menuDocument.save();
            console.log(`Menú para '${lang.toUpperCase()}' subido con éxito.`);
        }

        console.log('¡Proceso de subida completado!');
    } catch (error) {
        console.error('Ocurrió un error:', error);
    } finally {
        mongoose.connection.close();
    }
}

uploadData();