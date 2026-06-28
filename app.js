// --- CEREBRO DE LA APLICACIÓN V7: REDISEÑO PREMIUM SOPHISTICATED ---

// 1. CARGA INICIAL DE DATOS (localStorage)
let movimientos = JSON.parse(localStorage.getItem('movimientos')) || [];
let presupuesto = parseFloat(localStorage.getItem('presupuesto')) || 0.0;
let temaSeleccionado = localStorage.getItem('temaSeleccionado') || 'ciruela-oscura';

// Categorías por defecto iniciales si no existen
let categorias = JSON.parse(localStorage.getItem('categorias')) || [
    'Alimentación', 'Transporte', 'Trabajo', 'Entretenimiento', 'Servicios', 'Otros'
];

// 2. REFERENCIAS A LOS ELEMENTOS VISUALES (HTML)
const pantallaSaldo = document.getElementById('saldo-pantalla');
const pantallaIngresosDiarios = document.getElementById('ingresos-diarios-pantalla');
const pantallaIngresosSemanales = document.getElementById('ingresos-semanales-pantalla');
const pantallaIngresosMensuales = document.getElementById('ingresos-mensuales-pantalla');
const pantallaGastos = document.getElementById('gastos-pantalla');
const pantallaDisponible = document.getElementById('disponible-pantalla');
const pantallaPresupuestoGrande = document.getElementById('pantalla-presupuesto-grande');

const inputPresupuesto = document.getElementById('presupuesto-input');
const selectorTema = document.getElementById('selector-tema');
const indicadorMesTexto = document.getElementById('indicador-mes-texto');

const formulario = document.getElementById('formulario-transaccion');
const selectTipo = document.getElementById('tipo-select');
const selectCategoria = document.getElementById('categoria-select');
const inputDescripcion = document.getElementById('descripcion-input');
const inputMonto = document.getElementById('monto-input');

const tablaMovimientos = document.getElementById('tabla-movimientos');
const mensajeVacioTabla = document.getElementById('mensaje-vacio-tabla');
const selectorMesFiltro = document.getElementById('filtro-mes-select');

// Nuevas referencias V6
const inputNuevaCategoria = document.getElementById('nueva-categoria-input');
const btnAgregarCategoria = document.getElementById('btn-agregar-categoria');
const listaCategoriasConfig = document.getElementById('lista-categorias-config');
const chipsTema = document.querySelectorAll('.btn-tema-chip');

// 3. ESTADO DEL FILTRO DE MES
const hoy = new Date();
const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
let mesSeleccionado = mesActual;
selectorMesFiltro.value = mesSeleccionado;

// 4. MIGRACIÓN DE DATOS (Compatibilidad)
movimientos.forEach(mov => {
    if (mov.fecha && mov.fecha.includes('/')) {
        const partes = mov.fecha.split('/');
        if (partes.length === 3) {
            const dia = partes[0].padStart(2, '0');
            const mes = partes[1].padStart(2, '0');
            const anio = partes[2];
            mov.fecha = `${anio}-${mes}-${dia}`;
        }
    }
});
localStorage.setItem('movimientos', JSON.stringify(movimientos));

// 5. FUNCIONES DE GUARDADO EN localStorage
function guardarEnNavegador() {
    localStorage.setItem('movimientos', JSON.stringify(movimientos));
}

function guardarCategoriasEnNavegador() {
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

// 6. FORMATEADORES DE MONTO PARA DECIMALES REDUCIDOS (HTML)
function formatearMontoHTML(monto, tipo = '') {
    const montoAbsoluto = Math.abs(monto).toFixed(2);
    const partes = montoAbsoluto.split('.');
    
    // Separador de miles argentino
    const entero = parseInt(partes[0], 10).toLocaleString('es-AR');
    const decimales = partes[1];

    let signo = '';
    if (tipo === 'ingreso') signo = '+ $';
    else if (tipo === 'gasto') signo = '- $';
    else signo = '$';

    return `${signo}${entero}<span class="decimales">.${decimales}</span>`;
}

function formatearSaldoHTML(monto) {
    const esNegativo = monto < 0;
    const montoAbsoluto = Math.abs(monto).toFixed(2);
    const partes = montoAbsoluto.split('.');
    const entero = parseInt(partes[0], 10).toLocaleString('es-AR');
    const decimales = partes[1];

    const signo = esNegativo ? '- $' : '$';
    return `${signo}${entero}<span class="decimales">.${decimales}</span>`;
}

// Helper: Convierte "AAAA-MM-DD" a legible "DD/MM/AAAA"
function formatearFecha(fechaIso) {
    if (!fechaIso) return '-';
    const partes = fechaIso.split('-');
    if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaIso;
}

// Helper: Convierte "AAAA-MM" a "Mes AAAA" (ej: "Junio 2026")
function formatearMesLegible(mesIso) {
    if (!mesIso) return '-';
    const partes = mesIso.split('-');
    if (partes.length === 2) {
        const anio = partes[0];
        const numeroMes = parseInt(partes[1], 10);
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${nombresMeses[numeroMes - 1]} ${anio}`;
    }
    return mesIso;
}

function obtenerMovimientosFiltrados() {
    return movimientos.filter(mov => mov.fecha && mov.fecha.startsWith(mesSeleccionado));
}

// 7. CÁLCULO Y ACTUALIZACIÓN DEL DASHBOARD Y PRESUPUESTO
function actualizarDashboard() {
    let totalIngresosDiarios = 0.0;
    let totalIngresosSemanales = 0.0;
    let totalIngresosMensuales = 0.0;
    let totalGastosMensuales = 0.0;

    const hoyInterno = new Date();
    const hoyISO = `${hoyInterno.getFullYear()}-${String(hoyInterno.getMonth() + 1).padStart(2, '0')}-${String(hoyInterno.getDate()).padStart(2, '0')}`;

    const diaSemana = hoyInterno.getDay(); 
    const diasParaRestar = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunes = new Date(hoyInterno);
    lunes.setDate(hoyInterno.getDate() - diasParaRestar);
    const lunesISO = `${lunes.getFullYear()}-${String(lunes.getMonth() + 1).padStart(2, '0')}-${String(lunes.getDate()).padStart(2, '0')}`;

    // Acumular diario y semanal
    movimientos.forEach(mov => {
        if (mov.tipo === 'ingreso' && mov.fecha) {
            if (mov.fecha === hoyISO) {
                totalIngresosDiarios += mov.monto;
            }
            if (mov.fecha >= lunesISO && mov.fecha <= hoyISO) {
                totalIngresosSemanales += mov.monto;
            }
        }
    });

    // Acumular mensual
    const movimientosDelMes = obtenerMovimientosFiltrados();
    movimientosDelMes.forEach(mov => {
        if (mov.tipo === 'ingreso') {
            totalIngresosMensuales += mov.monto;
        } else if (mov.tipo === 'gasto') {
            totalGastosMensuales += mov.monto;
        }
    });

    const saldoTotal = totalIngresosMensuales - totalGastosMensuales;
    const disponibleTotal = presupuesto - totalGastosMensuales;

    indicadorMesTexto.textContent = formatearMesLegible(mesSeleccionado);
    pantallaPresupuestoGrande.innerHTML = formatearMontoHTML(presupuesto);

    pantallaIngresosDiarios.innerHTML = formatearMontoHTML(totalIngresosDiarios);
    pantallaIngresosSemanales.innerHTML = formatearMontoHTML(totalIngresosSemanales);
    pantallaIngresosMensuales.innerHTML = formatearMontoHTML(totalIngresosMensuales);
    pantallaGastos.innerHTML = formatearMontoHTML(totalGastosMensuales);
    pantallaSaldo.innerHTML = formatearSaldoHTML(saldoTotal);
    pantallaDisponible.innerHTML = formatearSaldoHTML(disponibleTotal);

    // Colores de Saldo
    if (saldoTotal > 0) {
        pantallaSaldo.className = 'texto-verde';
        pantallaSaldo.parentElement.style.borderTopColor = 'var(--color-ingreso)';
    } else if (saldoTotal < 0) {
        pantallaSaldo.className = 'texto-rojo';
        pantallaSaldo.parentElement.style.borderTopColor = 'var(--color-gasto)';
    } else {
        pantallaSaldo.className = '';
        pantallaSaldo.parentElement.style.borderTopColor = 'var(--border-color)';
    }

    // Colores de Disponible
    if (presupuesto === 0) {
        pantallaDisponible.className = '';
        pantallaDisponible.parentElement.style.borderTopColor = 'var(--border-color)';
    } else if (disponibleTotal < 0) {
        pantallaDisponible.className = 'texto-rojo';
        pantallaDisponible.parentElement.style.borderTopColor = 'var(--color-gasto)';
    } else if (disponibleTotal <= (presupuesto * 0.15)) {
        pantallaDisponible.className = 'texto-naranja';
        pantallaDisponible.parentElement.style.borderTopColor = 'var(--color-alerta-naranja)';
    } else {
        pantallaDisponible.className = 'texto-verde';
        pantallaDisponible.parentElement.style.borderTopColor = 'var(--color-ingreso)';
    }
}

// 8. DIBUJAR LA TABLA DE HISTORIAL
function renderizarTabla() {
    tablaMovimientos.innerHTML = '';
    const movimientosDelMes = obtenerMovimientosFiltrados();

    if (movimientosDelMes.length === 0) {
        mensajeVacioTabla.style.display = 'block';
        return;
    } else {
        mensajeVacioTabla.style.display = 'none';
    }

    movimientosDelMes.slice().reverse().forEach(mov => {
        const fila = document.createElement('tr');

        const badgeClase = mov.tipo === 'ingreso' ? 'badge badge-ingreso' : 'badge badge-gasto';
        const montoHTML = mov.tipo === 'ingreso' ? formatearMontoHTML(mov.monto, 'ingreso') : formatearMontoHTML(mov.monto, 'gasto');
        const montoClase = mov.tipo === 'ingreso' ? 'texto-verde' : 'texto-rojo';
        const descTexto = mov.descripcion || '-';

        fila.innerHTML = `
            <td>${formatearFecha(mov.fecha)}</td>
            <td><strong>${descTexto}</strong></td>
            <td>${mov.categoria}</td>
            <td><span class="${badgeClase}">${mov.tipo}</span></td>
            <td class="${montoClase}"><strong>${montoHTML}</strong></td>
            <td>
                <button class="btn-eliminar" onclick="eliminarMovimiento(${mov.id})">Eliminar</button>
            </td>
        `;

        tablaMovimientos.appendChild(fila);
    });
}

// 9. GESTIÓN Y RENDERIZADO DE CATEGORÍAS (V6)
// Repobla el selector de transacciones y el gestor de la barra de ajustes
function renderizarCategorias() {
    // A. Guardar selección actual en el formulario para no romper carga
    const valorSeleccionado = selectCategoria.value;
    
    // B. Llenar el selector dropdown
    selectCategoria.innerHTML = '';
    categorias.forEach(cat => {
        const opcion = document.createElement('option');
        opcion.value = cat;
        opcion.textContent = cat;
        selectCategoria.appendChild(opcion);
    });

    // Restaurar valor previo si aún existe
    if (categorias.includes(valorSeleccionado)) {
        selectCategoria.value = valorSeleccionado;
    }

    // C. Llenar la lista visual del configurador
    listaCategoriasConfig.innerHTML = '';
    categorias.forEach(cat => {
        const item = document.createElement('li');
        item.innerHTML = `
            <span>${cat}</span>
            <div class="categoria-acciones">
                <button type="button" class="btn-cat-editar" onclick="editarCategoria('${cat}')" title="Renombrar">✏️</button>
                <button type="button" class="btn-cat-eliminar" onclick="eliminarCategoria('${cat}')" title="Eliminar">❌</button>
            </div>
        `;
        listaCategoriasConfig.appendChild(item);
    });
}

// Agregar nueva categoría
btnAgregarCategoria.addEventListener('click', () => {
    const nueva = inputNuevaCategoria.value.trim();
    if (!nueva) return;

    // Evitar duplicados (Filtro insensible a mayúsculas/minúsculas)
    if (categorias.map(c => c.toLowerCase()).includes(nueva.toLowerCase())) {
        alert('Esta categoría ya existe.');
        return;
    }

    categorias.push(nueva);
    guardarCategoriasEnNavegador();
    renderizarCategorias();
    inputNuevaCategoria.value = '';
});

// Registrar evento de tecla Enter en el input de nueva categoría
inputNuevaCategoria.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        btnAgregarCategoria.click();
    }
});

// Eliminar categoría
window.eliminarCategoria = function(nombre) {
    if (categorias.length <= 1) {
        alert('Debés tener al menos una categoría en el sistema.');
        return;
    }

    const confirmar = confirm(`¿Estás segura de eliminar la categoría "${nombre}"?`);
    if (!confirmar) return;

    categorias = categorias.filter(c => c !== nombre);
    guardarCategoriasEnNavegador();
    renderizarCategorias();
    // Nota: Las transacciones históricas en localStorage conservan el nombre de la categoría eliminada como respaldo.
};

// Editar/Renombrar categoría
window.editarCategoria = function(nombre) {
    const nuevoNombre = prompt(`Editar nombre para la categoría "${nombre}":`, nombre);
    if (nuevoNombre === null) return; // Cancelado

    const nuevoClean = nuevoNombre.trim();
    if (!nuevoClean || nuevoClean === nombre) return;

    // Evitar colisión con otras categorías existentes
    if (categorias.map(c => c.toLowerCase()).includes(nuevoClean.toLowerCase()) && nuevoClean.toLowerCase() !== nombre.toLowerCase()) {
        alert('Ese nombre de categoría ya está en uso.');
        return;
    }

    // Actualizar lista de categorías
    const index = categorias.indexOf(nombre);
    if (index !== -1) {
        categorias[index] = nuevoClean;
    }
    guardarCategoriasEnNavegador();

    // Cascading: Actualizar la categoría de todas las transacciones existentes en localStorage
    movimientos.forEach(mov => {
        if (mov.categoria === nombre) {
            mov.categoria = nuevoClean;
        }
    });
    guardarEnNavegador();

    // Actualizar UI
    renderizarCategorias();
    actualizarDashboard();
    renderizarTabla();
};

// 10. GESTIÓN AVANZADA DE TEMAS (V6)
function aplicarTema(tema) {
    temaSeleccionado = tema;
    localStorage.setItem('temaSeleccionado', temaSeleccionado);
    
    // Aplicar clase en body
    document.body.className = `tema-${temaSeleccionado}`;

    // Sincronizar el dropdown del Navbar
    selectorTema.value = temaSeleccionado;

    // Sincronizar los chips del panel de ajustes
    chipsTema.forEach(chip => {
        if (chip.getAttribute('data-tema') === temaSeleccionado) {
            chip.classList.add('activo');
        } else {
            chip.classList.remove('activo');
        }
    });
}

// Vincular chips de temas visuales
chipsTema.forEach(chip => {
    chip.addEventListener('click', () => {
        const tema = chip.getAttribute('data-tema');
        aplicarTema(tema);
    });
});

// Vincular el selector desplegable del Navbar
selectorTema.addEventListener('change', () => {
    aplicarTema(selectorTema.value);
});

// 11. CARGAR NUEVO MOVIMIENTO
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const tipo = selectTipo.value;
    const categoria = selectCategoria.value;
    const descripcion = inputDescripcion.value.trim();
    const monto = parseFloat(inputMonto.value);

    if (isNaN(monto) || monto <= 0) {
        alert('Por favor, ingresá un monto válido.');
        return;
    }

    const hoyRegistro = new Date();
    const fechaActualISO = `${hoyRegistro.getFullYear()}-${String(hoyRegistro.getMonth() + 1).padStart(2, '0')}-${String(hoyRegistro.getDate()).padStart(2, '0')}`;

    const nuevoMovimiento = {
        id: Date.now(),
        tipo: tipo,
        categoria: categoria,
        descripcion: descripcion,
        monto: monto,
        fecha: fechaActualISO
    };

    movimientos.push(nuevoMovimiento);
    guardarEnNavegador();

    if (mesSeleccionado !== mesActual) {
        mesSeleccionado = mesActual;
        selectorMesFiltro.value = mesSeleccionado;
    }

    actualizarDashboard();
    renderizarTabla();
    formulario.reset();
});

// 12. ELIMINAR MOVIMIENTO
window.eliminarMovimiento = function(id) {
    const confirmar = confirm('¿Estás segura de eliminar este movimiento?');
    if (!confirmar) return;

    movimientos = movimientos.filter(mov => mov.id !== id);
    guardarEnNavegador();
    actualizarDashboard();
    renderizarTabla();
};

// 13. ESCUCHAR ENTRADA DE PRESUPUESTO
inputPresupuesto.addEventListener('input', () => {
    const valor = parseFloat(inputPresupuesto.value);
    presupuesto = isNaN(valor) || valor < 0 ? 0.0 : valor;
    localStorage.setItem('presupuesto', presupuesto);
    actualizarDashboard();
});

if (presupuesto > 0) {
    inputPresupuesto.value = presupuesto;
}

// 14. ESCUCHAR FILTRO POR MES
selectorMesFiltro.addEventListener('change', () => {
    const valorMes = selectorMesFiltro.value;
    if (!valorMes) {
        mesSeleccionado = mesActual;
        selectorMesFiltro.value = mesSeleccionado;
    } else {
        mesSeleccionado = valorMes;
    }
    actualizarDashboard();
    renderizarTabla();
});

// 15. RENDERIZACIÓN INICIAL AL ABRIR LA APLICACIÓN
aplicarTema(temaSeleccionado);
renderizarCategorias();
actualizarDashboard();
renderizarTabla();

// Lógica para instalar la aplicación en el celular
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Evita que el navegador muestre el cartel automático
  e.preventDefault();
  deferredPrompt = e;
  
  // Creamos un botón flotante para instalar (si no tenés uno en tu HTML)
  if (!document.getElementById('btn-instalar')) {
    const botonInstalar = document.createElement('button');
    botonInstalar.id = 'btn-instalar';
    botonInstalar.innerHTML = '📲 Instalar Aplicación';
    // Estilo elegante ciruela y rosé gold
    botonInstalar.style.position = 'fixed';
    botonInstalar.style.bottom = '20px';
    botonInstalar.style.right = '20px';
    botonInstalar.style.backgroundColor = '#4A154B'; // Ciruela
    botonInstalar.style.color = '#FFF';
    botonInstalar.style.border = '2px solid #E0A96D'; // Toque rosé gold
    botonInstalar.style.padding = '12px 20px';
    botonInstalar.style.borderRadius = '25px';
    botonInstalar.style.cursor = 'pointer';
    botonInstalar.style.fontWeight = 'bold';
    botonInstalar.style.zIndex = '1000';
    botonInstalar.style.boxShadow = '0px 4px 10px rgba(0,0,0,0.3)';
    
    document.body.appendChild(botonInstalar);

    botonInstalar.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('¡Milagros instaló la app con éxito!');
        }
        deferredPrompt = null;
        botonInstalar.remove();
      }
    });
  }
});

window.addEventListener('appinstalled', () => {
  console.log('App instalada');
  const btn = document.getElementById('btn-instalar');
  if (btn) btn.remove();
});
