document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang') || 'es';
    const rtlLanguages = ['he', 'ar'];
    if (rtlLanguages.includes(lang)) {
        document.documentElement.setAttribute('dir', 'rtl');
    }
    fetchMenuData(lang);
});

async function fetchMenuData(lang) {
    const filePath = `data/menu_${lang}.json`;
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Archivo de menú no encontrado: ${filePath}`);
        const menuData = await response.json();
        renderMenu(menuData, lang);
    } catch (error) {
        console.error('Error al cargar los datos del menú:', error);
        const container = document.getElementById('menu-container');
        if (container) {
            container.innerHTML = `<p style="text-align: center; color: red;">No se pudo cargar el menú. Verifique que el archivo ${filePath} exista y no tenga errores.</p>`;
        }
    }
}
function renderMenu(data, lang) {
    const container = document.getElementById('menu-container');
    const subtitleElement = document.querySelector('.menu__subtitle');
    const healthWarningElement = document.querySelector('.health-warning');
    const footerElement = document.querySelector('.menu__footer');
    if (!container || !subtitleElement || !healthWarningElement || !footerElement) {
        console.error('Error: Faltan elementos esenciales del HTML.');
        return;
    }
    container.innerHTML = '';
    footerElement.innerHTML = '';
    if (data.informacionGeneral) {
        subtitleElement.textContent = data.informacionGeneral.notasSuperiores.join(' - ');
        const advertencias = { es: "El consumo excesivo de sal es perjudicial para la salud", en: "Excessive salt consumption is harmful to health", pt: "O consumo excessivo de sal é prejudicial à saúde", it: "Il consumo eccessivo di sale è dannoso per la salute", fr: "La consommation excessive de sel est nocive pour la santé", de: "Übermäßiger Salzkonsum ist gesundheitsschädlich", cn: "过量摄入盐分有害健康", ru: "Чрезмерное потребление соли вредно для здоровья", ja: "塩分の過剰摂取は健康に害を及ぼす可能性があります", ko: "과도한 소금 섭취는 건강에 해롭습니다", he: "צריכה מופרזת של מלח מזיקה לבריאות", ar: "الاستهلاك المفرط للملح ضار بالصحة" };
        healthWarningElement.innerHTML = `<span>${advertencias[lang] || advertencias['es']}</span> <i class="fa-solid fa-heart"></i>`;
        data.informacionGeneral.notasInferiores.forEach(note => {
            footerElement.innerHTML += `<p>${note}</p>`;
        });
    }
    if (!data.categorias || !Array.isArray(data.categorias)) {
        console.error('El archivo JSON no contiene una lista de "categorias" válida.');
        return;
    }
    data.categorias.forEach(categoria => {
        const section = document.createElement('section');
        section.className = 'menu__section';
        let sectionHTML = `<h2 class="menu__section-title">${categoria.nombre}</h2>`;
        if (categoria.nota) {
            sectionHTML += `<p class="menu__section-notes">${categoria.nota}</p>`;
        }
        if (categoria.items) {
            categoria.items.forEach(item => {
                sectionHTML += renderMenuItem(item);
            });
        }
        section.innerHTML = sectionHTML;
        container.appendChild(section);
    });
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item, index) => {
        setTimeout(() => {
            item.classList.add('is-visible');
        }, index * 75);
    });
    positionHealthWarning();
}
function renderMenuItem(item) {
    let preciosHTML = '';
    if (item.precios) {
        preciosHTML = `<div class="menu-item__price-container">${item.precios.base ? `<span class="price-base">${item.precios.base}</span>` : ''}<span class="price-final">${item.precios.final}</span></div>`;
    }
    let itemHTML = `<article class="menu-item"><div class="menu-item__details"><p class="menu-item__name">${item.nombre}</p>${item.descripcion ? `<p class="menu-item__description">${item.descripcion}</p>` : ''}</div>${preciosHTML}</article>`;
    if (item.opciones) {
        item.opciones.forEach(opcion => {
            let opcionPreciosHTML = '';
            if (opcion.precios) {
                opcionPreciosHTML = `<div class="menu-item__price-container">${opcion.precios.base ? `<span class="price-base">${opcion.precios.base}</span>` : ''}<span class="price-final">${opcion.precios.final}</span></div>`;
            }
            itemHTML += `<article class="menu-item"><div class="menu-item__details"><p class="menu-item__description" style="padding-left: 1.5rem;">*** ${opcion.nombre}</p></div>${opcionPreciosHTML}</article>`;
        });
    }
    return itemHTML;
}
function positionHealthWarning() {
    const menu = document.querySelector('.menu');
    const warning = document.querySelector('.health-warning');
    if (!menu || !warning) return;
    const menuRect = menu.getBoundingClientRect();
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
    const gap = 40;
    if (isRTL) {
        const warningPosition = menuRect.right + gap;
        warning.style.left = 'auto';
        warning.style.right = `calc(100vw - ${warningPosition}px)`;
        warning.style.transform = 'translateY(-50%) rotate(90deg)';
    } else {
        const warningWidth = warning.getBoundingClientRect().height;
        const warningPosition = menuRect.left - warningWidth - gap;
        warning.style.left = `${warningPosition}px`;
        warning.style.transform = 'translateY(-50%) rotate(-90deg)';
    }
    warning.classList.add('is-visible');
}
window.addEventListener('resize', positionHealthWarning);