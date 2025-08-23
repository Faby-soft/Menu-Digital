require('dotenv').config();
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB Atlas con éxito.'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

const PreciosSchema = new mongoose.Schema({ base: String, final: String }, { _id: false });
const OpcionSchema = new mongoose.Schema({ nombre: String, precios: PreciosSchema }, { _id: false });
const ItemSchema = new mongoose.Schema({ nombre: String, descripcion: String, precios: PreciosSchema, opciones: [OpcionSchema] }, { _id: false });
const TipoSchema = new mongoose.Schema({ nombre: String, items: [ItemSchema] }, { _id: false });
const SubcategoriaSchema = new mongoose.Schema({ nombre: String, nota: String, items: [ItemSchema], tipos: [TipoSchema] }, { _id: false });
const CategoriaSchema = new mongoose.Schema({ nombre: String, nota: String, items: [ItemSchema], subcategorias: [SubcategoriaSchema] }, { _id: false });
const MenuSchema = new mongoose.Schema({
    lang: { type: String, required: true, unique: true },
    informacionGeneral: mongoose.Schema.Types.Mixed,
    categorias: [CategoriaSchema]
});
const Menu = mongoose.model('Menu', MenuSchema);

app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '10mb' }));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
        const token = jwt.sign({ user: username }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ message: 'Login exitoso', token });
    } else {
        res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }
});

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(403).send({ message: 'No se proveyó un token.' });
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: 'No autorizado.' });
        req.user = decoded;
        next();
    });
}

app.get('/api/menu/:lang', async (req, res) => {
    try {
        const menu = await Menu.findOne({ lang: req.params.lang });
        if (!menu) return res.status(404).send({ message: 'Menú no encontrado.' });
        res.json(menu);
    } catch (error) {
        res.status(500).send({ message: 'Error al obtener el menú.' });
    }
});

app.post('/api/menu/:lang', verifyToken, async (req, res) => {
    try {
        const lang = req.params.lang;
        const { informacionGeneral, categorias } = req.body;
        await Menu.findOneAndUpdate({ lang: lang }, { informacionGeneral, categorias });
        res.status(200).send({ message: 'Menú guardado con éxito.' });
    } catch (error) {
        res.status(500).send({ message: 'Error al guardar el menú.' });
    }
});

app.post('/api/prices/update', verifyToken, async (req, res) => {
    const pricesToUpdate = req.body;
    try {
        const menus = await Menu.find({});
        for (const menu of menus) {
            menu.categorias.forEach(category => {
                const updateItems = (items) => {
                    if (!items) return;
                    items.forEach(item => {
                        if (pricesToUpdate[item.nombre]) {
                            item.precios = pricesToUpdate[item.nombre];
                        }
                    });
                };
                updateItems(category.items);
                if (category.subcategorias) {
                    category.subcategorias.forEach(sub => {
                        updateItems(sub.items);
                        if (sub.tipos) {
                            sub.tipos.forEach(tipo => updateItems(tipo.items));
                        }
                    });
                }
            });
            await menu.save();
        }
        res.status(200).send({ message: 'Precios actualizados en todos los idiomas.' });
    } catch (error) {
        console.error("Error updating prices:", error);
        res.status(500).send({ message: 'Error al actualizar los precios.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});