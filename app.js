"use strict";

// Elementos de la interfaz.
const formulario = document.getElementById("formulario-tarea");
const campoTitulo = document.getElementById("titulo-tarea");
const campoPrioridad = document.getElementById("prioridad-tarea");
const listaTareas = document.getElementById("lista-tareas");
const mensaje = document.getElementById("mensaje");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonGuardar = formulario.querySelector('button[type="submit"]');
const botonCancelar = document.getElementById("cancelar-edicion");

const campoBusqueda = document.getElementById("buscar-tarea");
const filtroEstado = document.getElementById("filtro-estado");
const ordenTareas = document.getElementById("orden-tareas");

const totalTareas = document.getElementById("total-tareas");
const tareasPendientes = document.getElementById("tareas-pendientes");
const tareasCompletadas = document.getElementById("tareas-completadas");

// Configuración y estado.
const CLAVE_STORAGE = "taskmanager_tareas";
const URL_API = "https://jsonplaceholder.typicode.com/todos";
const PRIORIDADES = ["alta", "media", "baja"];

let tareas = [];
let idEnEdicion = null;
let cargando = true;
let permitirGuardado = true;

// Descarga y adapta las tareas de la API.
async function obtenerTareasAPI() {
    const controlador = new AbortController();

    const temporizador = setTimeout(() => {
        controlador.abort();
    }, 15000);

    try {
        const respuesta = await fetch(URL_API, {
            signal: controlador.signal
        });

        if (!respuesta.ok) {
            throw new Error(
                `El servidor respondió con el código ${respuesta.status}.`
            );
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
            throw new Error("La API no devolvió una lista.");
        }

        const datosValidos = datos.every((tarea) => {
            return (
                tarea !== null &&
                typeof tarea === "object" &&
                Number.isInteger(tarea.id) &&
                typeof tarea.title === "string" &&
                tarea.title.trim() !== "" &&
                typeof tarea.completed === "boolean"
            );
        });

        if (!datosValidos) {
            throw new Error("La API devolvió tareas inválidas.");
        }

        const identificadores = new Set();
        const fechaImportacion = Date.now();

        return datos
            .filter((tarea) => {
                if (identificadores.has(tarea.id)) {
                    return false;
                }

                identificadores.add(tarea.id);
                return true;
            })
            .map((tarea) => ({
                id: `api-${tarea.id}`,
                titulo: tarea.title.trim(),
                prioridad: "media",
                completada: tarea.completed,
                fechaCreacion: fechaImportacion
            }));
    } finally {
        // Se ejecuta tanto si la descarga funciona como si falla.
        clearTimeout(temporizador);
    }
}

// Recupera los datos locales.
// false significa que la clave todavía no existe.
function cargarTareasLocales() {
    const datos = localStorage.getItem(CLAVE_STORAGE);

    if (datos === null) {
        return false;
    }

    const tareasGuardadas = JSON.parse(datos);

    if (!Array.isArray(tareasGuardadas)) {
        throw new Error("Los datos guardados no son un arreglo.");
    }

    const identificadores = new Set();

    const sonValidas = tareasGuardadas.every((tarea) => {
        const esValida =
            tarea !== null &&
            typeof tarea === "object" &&
            typeof tarea.id === "string" &&
            tarea.id.trim() !== "" &&
            typeof tarea.titulo === "string" &&
            tarea.titulo.trim() !== "" &&
            PRIORIDADES.includes(tarea.prioridad) &&
            typeof tarea.completada === "boolean" &&
            Number.isFinite(tarea.fechaCreacion);

        if (!esValida || identificadores.has(tarea.id)) {
            return false;
        }

        identificadores.add(tarea.id);
        return true;
    });

    if (!sonValidas) {
        throw new Error("Hay tareas inválidas o IDs repetidos.");
    }

    tareas = tareasGuardadas;
    return true;
}

// Guarda las tareas y devuelve si el guardado tuvo éxito.
function guardarTareas() {
    if (!permitirGuardado) {
        return false;
    }

    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(tareas));
        return true;
    } catch (error) {
        console.error("Error al guardar las tareas:", error);
        return false;
    }
}

// Técnica investigada: CustomEvent.
// Comunica las métricas actuales a los elementos que escuchan el evento.
function notificarCambioTareas() {
    const total = tareas.length;
    const completadas = tareas.filter(
        (tarea) => tarea.completada
    ).length;

    const evento = new CustomEvent("tareasActualizadas", {
        detail: {
            total: total,
            pendientes: total - completadas,
            completadas: completadas
        }
    });

    document.dispatchEvent(evento);
}

// El dashboard actualiza el DOM cuando recibe el evento.
document.addEventListener("tareasActualizadas", (evento) => {
    totalTareas.textContent = evento.detail.total;
    tareasPendientes.textContent = evento.detail.pendientes;
    tareasCompletadas.textContent = evento.detail.completadas;
});

// Guarda los cambios y actualiza la interfaz.
function guardarYMostrar(textoMensaje) {
    const guardado = guardarTareas();

    mostrarTareas();
    notificarCambioTareas();

    mensaje.textContent = guardado
        ? textoMensaje
        : "El cambio se hizo en pantalla, pero no pudo guardarse. " +
          "Se perderá al recargar.";
}

// Restablece el formulario para crear una nueva tarea.
function reiniciarFormulario() {
    idEnEdicion = null;
    formulario.reset();
    tituloFormulario.textContent = "Nueva tarea";
    botonGuardar.textContent = "Agregar tarea";
    botonCancelar.hidden = true;
}

// Coloca los datos de una tarea en el formulario.
function editarTarea(id) {
    if (cargando) {
        return;
    }

    const tarea = tareas.find((tarea) => tarea.id === id);

    if (!tarea) {
        return;
    }

    idEnEdicion = id;
    campoTitulo.value = tarea.titulo;
    campoPrioridad.value = tarea.prioridad;

    tituloFormulario.textContent = "Editar tarea";
    botonGuardar.textContent = "Guardar cambios";
    botonCancelar.hidden = false;

    mensaje.textContent = "Modifica los datos y pulsa Guardar cambios.";
    campoTitulo.focus();
}

// Alterna el estado de la tarea.
function cambiarEstado(id) {
    if (cargando) {
        return;
    }

    const tarea = tareas.find((tarea) => tarea.id === id);

    if (!tarea) {
        return;
    }

    tarea.completada = !tarea.completada;

    guardarYMostrar(
        tarea.completada
            ? "Tarea completada y guardada."
            : "Tarea marcada como pendiente y guardada."
    );
}

// Elimina una tarea por su identificador.
function eliminarTarea(id) {
    if (cargando) {
        return;
    }

    tareas = tareas.filter((tarea) => tarea.id !== id);

    if (idEnEdicion === id) {
        reiniciarFormulario();
    }

    guardarYMostrar("Tarea eliminada y cambios guardados.");
}

// Aplica búsqueda, filtro de estado y ordenamiento.
function obtenerTareasVisibles() {
    const busqueda = campoBusqueda.value.trim().toLowerCase();
    const estado = filtroEstado.value;
    const orden = ordenTareas.value;

    const tareasVisibles = tareas.filter((tarea) => {
        const coincideTitulo = tarea.titulo
            .toLowerCase()
            .includes(busqueda);

        const coincideEstado =
            estado === "todas" ||
            (estado === "pendientes" && !tarea.completada) ||
            (estado === "completadas" && tarea.completada);

        return coincideTitulo && coincideEstado;
    });

    const valorPrioridad = {
        alta: 1,
        media: 2,
        baja: 3
    };

    // filter() creó otro arreglo; sort() ordena ese resultado.
    tareasVisibles.sort((a, b) => {
        if (orden === "antiguas") {
            return a.fechaCreacion - b.fechaCreacion;
        }

        if (orden === "prioridad") {
            return (
                valorPrioridad[a.prioridad] -
                    valorPrioridad[b.prioridad] ||
                b.fechaCreacion - a.fechaCreacion
            );
        }

        return b.fechaCreacion - a.fechaCreacion;
    });

    return tareasVisibles;
}

// Dibuja las tareas usando elementos del DOM.
function mostrarTareas() {
    listaTareas.replaceChildren();

    if (cargando) {
        const aviso = document.createElement("li");
        aviso.textContent = "Cargando tareas...";
        listaTareas.appendChild(aviso);
        return;
    }

    const tareasVisibles = obtenerTareasVisibles();

    if (tareasVisibles.length === 0) {
        const aviso = document.createElement("li");

        aviso.textContent = tareas.length === 0
            ? "Todavía no tienes tareas."
            : "No hay tareas que coincidan con la búsqueda y el filtro.";

        listaTareas.appendChild(aviso);
        return;
    }

    tareasVisibles.forEach((tarea) => {
        const elemento = document.createElement("li");

        const texto = document.createElement("p");
        texto.textContent =
            `${tarea.titulo} — Prioridad: ${tarea.prioridad}`;

        if (tarea.completada) {
            texto.style.textDecoration = "line-through";
        }

        const estado = document.createElement("p");
        estado.textContent = tarea.completada
            ? "Estado: completada"
            : "Estado: pendiente";

        const botonEstado = document.createElement("button");
        botonEstado.type = "button";
        botonEstado.textContent = tarea.completada
            ? "Marcar pendiente"
            : "Completar";

        botonEstado.addEventListener("click", () => {
            cambiarEstado(tarea.id);
        });

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.textContent = "Editar";

        botonEditar.addEventListener("click", () => {
            editarTarea(tarea.id);
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", () => {
            eliminarTarea(tarea.id);
        });

        elemento.append(
            texto,
            estado,
            botonEstado,
            botonEditar,
            botonEliminar
        );

        listaTareas.appendChild(elemento);
    });
}

// Valida y procesa la creación o edición.
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (cargando) {
        mensaje.textContent = "Espera a que termine la carga.";
        return;
    }

    const titulo = campoTitulo.value.trim();
    const prioridad = campoPrioridad.value;

    if (titulo === "") {
        mensaje.textContent = "Escribe el título de la tarea.";
        campoTitulo.focus();
        return;
    }

    if (!PRIORIDADES.includes(prioridad)) {
        mensaje.textContent = "Selecciona una prioridad válida.";
        return;
    }

    let textoMensaje;

    if (idEnEdicion !== null) {
        const tarea = tareas.find(
            (tarea) => tarea.id === idEnEdicion
        );

        if (!tarea) {
            reiniciarFormulario();
            mensaje.textContent = "La tarea ya no está disponible.";
            return;
        }

        tarea.titulo = titulo;
        tarea.prioridad = prioridad;
        textoMensaje = "Tarea actualizada y guardada.";
    } else {
        tareas.push({
            id: crypto.randomUUID(),
            titulo: titulo,
            prioridad: prioridad,
            completada: false,
            fechaCreacion: Date.now()
        });

        textoMensaje = "Tarea creada y guardada.";
    }

    guardarYMostrar(textoMensaje);
    reiniciarFormulario();
    campoTitulo.focus();
});

// Cancela la edición sin modificar la tarea.
botonCancelar.addEventListener("click", () => {
    reiniciarFormulario();
    mensaje.textContent = "Edición cancelada.";
    campoTitulo.focus();
});

// Actualización de la lista al usar los controles.
campoBusqueda.addEventListener("input", mostrarTareas);
filtroEstado.addEventListener("change", mostrarTareas);
ordenTareas.addEventListener("change", mostrarTareas);

// Carga inicial: primero almacenamiento local; después API si hace falta.
async function iniciarAplicacion() {
    botonGuardar.disabled = true;
    mostrarTareas();

    try {
        let existenDatosLocales;

        try {
            existenDatosLocales = cargarTareasLocales();
        } catch (error) {
            // Protege los datos existentes si no se pudieron leer.
            permitirGuardado = false;
            console.error("Error al recuperar las tareas:", error);

            mensaje.textContent =
                "No pudimos leer las tareas guardadas. " +
                "No sobrescribiremos esos datos. " +
                "Las tareas que crees ahora serán temporales.";
            return;
        }

        // Una lista guardada vacía también cuenta como datos existentes.
        if (existenDatosLocales) {
            mensaje.textContent = "Tareas recuperadas del navegador.";
            return;
        }

        mensaje.textContent = "Descargando tareas iniciales...";

        try {
            tareas = await obtenerTareasAPI();
        } catch (error) {
            console.error("Error al descargar las tareas:", error);

            mensaje.textContent =
                "No pudimos descargar las tareas. " +
                "Revisa tu conexión y recarga para intentarlo de nuevo. " +
                "También puedes crear tus propias tareas.";
            return;
        }

        const guardado = guardarTareas();

        mensaje.textContent = guardado
            ? `${tareas.length} tareas importadas y guardadas.`
            : "Las tareas se descargaron, pero no pudieron guardarse. " +
              "Se perderán al recargar.";
    } finally {
        cargando = false;
        botonGuardar.disabled = false;
        mostrarTareas();
        notificarCambioTareas();
    }
}

iniciarAplicacion();