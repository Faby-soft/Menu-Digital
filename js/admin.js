document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = localStorage.getItem('adminUser');
    const greetingText = document.getElementById('greeting-text');
    const logoutButton = document.getElementById('logout-button');
    if (loggedInUser && greetingText) {
        greetingText.textContent = `Hola, ${loggedInUser}`;
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/login.html';
        });
    }
    initializeAdminPanel();
});

function initializeAdminPanel() {
    const API_URL = 'https://menu-trabajo.onrender.com';
    const token = localStorage.getItem('authToken');
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabLinks.length > 0) {
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                tabLinks.forEach(l => l.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                const tabId = link.dataset.tab;
                link.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
    const langSelect = document.getElementById('language-select');
    const menuEditorContainer = document.getElementById('menu-editor-container');
    const saveContentButton = document.getElementById('save-content-button');
    const priceEditorContainer = document.getElementById('price-editor-container');
    const savePricesButton = document.getElementById('save-prices-button');
    let currentLang = 'es';
    let menuData = null;
    async function loadContentEditor(lang) {
        try {
            const response = await fetch(`${API_URL}/api/menu/${lang}`, { headers: authHeaders });
            if (!response.ok) throw new Error('No se pudo cargar el menú para este idioma.');
            menuData = await response.json();
            renderContentEditor(menuData);
        } catch (error) {
            if(menuEditorContainer) menuEditorContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }
    function renderContentEditor(data) {
        if (!menuEditorContainer) return;
        menuEditorContainer.innerHTML = '';
        if (data.categorias && Array.isArray(data.categorias)) {
            data.categorias.forEach((category, catIndex) => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'category';
                let itemsHTML = '';
                if (category.items && Array.isArray(category.items)) {
                    category.items.forEach((item, itemIndex) => {
                        itemsHTML += `<div class="item-editor" data-cat-index="${catIndex}" data-item-index="${itemIndex}"><label>Nombre:</label><input type="text" class="item-name" value="${item.nombre}"><label>Descripción:</label><textarea class="item-desc">${item.descripcion || ''}</textarea></div>`;
                    });
                }
                categoryDiv.innerHTML = `<div class="category-header">${category.nombre}</div>${itemsHTML}`;
                menuEditorContainer.appendChild(categoryDiv);
            });
        }
    }
    async function saveContent() {
        document.querySelectorAll('#menu-editor-container .item-editor').forEach(editor => {
            const catIndex = editor.dataset.catIndex;
            const itemIndex = editor.dataset.itemIndex;
            const item = menuData.categorias[catIndex].items[itemIndex];
            item.nombre = editor.querySelector('.item-name').value;
            item.descripcion = editor.querySelector('.item-desc').value;
        });
        try {
            const response = await fetch(`${API_URL}/api/menu/${currentLang}`, { method: 'POST', headers: authHeaders, body: JSON.stringify(menuData, null, 2) });
            if (!response.ok) throw new Error('No se pudo guardar el menú');
            Toastify({ text: `¡Contenido en ${currentLang.toUpperCase()} guardado con éxito!`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
        } catch (error) {
            Toastify({ text: `Error al guardar: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
        }
    }
    async function loadPriceEditor() {
        try {
            const response = await fetch(`${API_URL}/api/menu/es`, { headers: authHeaders });
            if (!response.ok) throw new Error('No se pudo cargar el menú base para los precios');
            const baseData = await response.json();
            let tableHTML = '<table class="price-table"><thead><tr><th>Plato</th><th>Precio Base (rojo)</th><th>Precio Final (negro)</th></tr></thead><tbody>';
            if (baseData.categorias && Array.isArray(baseData.categorias)) {
                const addItemsToTable = (items) => {
                    if (!items || !Array.isArray(items)) return;
                    items.forEach(item => {
                        tableHTML += `<tr data-item-name="${item.nombre}"><td>${item.nombre}</td><td><input type="text" class="price-base" value="${item.precios.base || ''}"></td><td><input type="text" class="price-final" value="${item.precios.final || ''}"></td></tr>`;
                    });
                };
                baseData.categorias.forEach(category => {
                    addItemsToTable(category.items);
                    if (category.subcategorias) {
                        category.subcategorias.forEach(sub => {
                            addItemsToTable(sub.items);
                            if (sub.tipos) {
                                sub.tipos.forEach(tipo => addItemsToTable(tipo.items));
                            }
                        });
                    }
                });
            }
            tableHTML += '</tbody></table>';
            if(priceEditorContainer) priceEditorContainer.innerHTML = tableHTML;
        } catch (error) {
            if(priceEditorContainer) priceEditorContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }
    async function saveAllPrices() {
        const pricesToUpdate = {};
        document.querySelectorAll('#price-editor-container tr[data-item-name]').forEach(row => {
            const itemName = row.dataset.itemName;
            const basePrice = row.querySelector('.price-base').value;
            const finalPrice = row.querySelector('.price-final').value;
            pricesToUpdate[itemName] = { base: basePrice, final: finalPrice };
        });
        try {
            const response = await fetch(`${API_URL}/api/prices/update`, { method: 'POST', headers: authHeaders, body: JSON.stringify(pricesToUpdate) });
            if (!response.ok) throw new Error('No se pudo guardar los precios');
            Toastify({ text: "¡Precios actualizados en todos los idiomas con éxito!", duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #00b09b, #96c93d)" } }).showToast();
        } catch (error) {
            Toastify({ text: `Error al guardar precios: ${error.message}`, duration: 3000, gravity: "top", position: "right", style: { background: "linear-gradient(to right, #ff5f6d, #ffc371)" } }).showToast();
        }
    }
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            loadContentEditor(currentLang);
        });
    }
    if (saveContentButton) {
        saveContentButton.addEventListener('click', saveContent);
    }
    if (savePricesButton) {
        savePricesButton.addEventListener('click', saveAllPrices);
    }
    loadContentEditor(currentLang);
    loadPriceEditor();
}