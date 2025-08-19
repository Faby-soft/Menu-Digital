const express = require('express');
const fs = require('fs').promises; // Usamos la versión de promesas de fs
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const ordersFilePath = path.join(__dirname, 'orders.json');

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Sirve archivos estáticos como index.html

// --- Funciones de Utilidad ---
// Función para leer las comandas de forma segura
async function readOrders() {
    try {
        const data = await fs.readFile(ordersFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, lo creamos con un array vacío
        if (error.code === 'ENOENT') {
            await writeOrders([]);
            return [];
        }
        // Si hay otro error (ej. JSON corrupto), lanzamos la excepción
        console.error('Error al leer o parsear orders.json:', error);
        throw new Error('El archivo de comandas podría estar corrupto.');
    }
}

// Función para escribir las comandas de forma segura
async function writeOrders(orders) {
    await fs.writeFile(ordersFilePath, JSON.stringify(orders, null, 2), 'utf8');
}

// --- Endpoints de la API ---

// GET /api/orders: Obtener todas las comandas
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await readOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// POST /api/orders: Crear una nueva comanda
app.post('/api/orders', async (req, res) => {
    try {
        const newOrderData = req.body;
        const orders = await readOrders();
        
        // Generamos el ID en el backend para asegurar que sea único y secuencial
        const newId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
        
        const newOrder = {
            ...newOrderData,
            id: newId, // Asignamos el ID generado
            startTime: Date.now(), // Asignamos el tiempo de inicio en el servidor
            status: 'in-progress' // Estado inicial
        };

        orders.push(newOrder);
        await writeOrders(orders);
        
        res.status(201).json(newOrder); // Devolvemos la comanda creada
    } catch (error) {
        res.status(500).send('Error interno del servidor al guardar la comanda.');
    }
});

// PUT /api/orders/:id: Actualizar el estado de una comanda
app.put('/api/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        const { status } = req.body;

        if (!status) {
            return res.status(400).send('El estado es requerido.');
        }

        const orders = await readOrders();
        const orderIndex = orders.findIndex(order => order.id === orderId);

        if (orderIndex === -1) {
            return res.status(404).send('Comanda no encontrada.');
        }

        orders[orderIndex].status = status;
        await writeOrders(orders);
        
        res.status(200).json(orders[orderIndex]);
    } catch (error) {
        res.status(500).send('Error interno del servidor al actualizar la comanda.');
    }
});

// DELETE /api/orders/:id: Eliminar una comanda
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id, 10);
        const orders = await readOrders();
        
        const updatedOrders = orders.filter(order => order.id !== orderId);

        if (orders.length === updatedOrders.length) {
            return res.status(404).send('Comanda no encontrada.');
        }

        await writeOrders(updatedOrders);
        res.status(200).send('Comanda eliminada correctamente.');
    } catch (error) {
        res.status(500).send('Error interno del servidor al eliminar la comanda.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de comandas escuchando en http://localhost:${PORT}`);
});