// Elementos de la interfaz.
const formulario = document.getElementById("formulario-tarea");
const campoTitulo = document.getElementById("titulo-tarea");
const campoPrioridad = document.getElementById("prioridad-tarea");
const listaTareas = document.getElementById("lista-tareas");
const mensaje = document.getElementById("mensaje");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonGuardar = formulario.querySelector('button[type="submit"]');

const campoBusqueda = document.getElementById("buscar-tarea");
const filtroEstado = document.getElementById("filtro-estado");
const ordenTareas = document.getElementById("orden-tareas");

const totalTareas = document.getElementById("total-tareas");
const tareasPendientes = document.getElementById("tareas-pendientes");
const tareasCompletadas = document.getElementById("tareas-completadas");

// Botón para cancelar la edición.
const botonCancelar = document.createElement("button");
botonCancelar.type = "button";
botonCancelar.textContent = "Cancelar edición";
botonCancelar.hidden = true;
formulario.appendChild(botonCancelar);

// Estado de la aplicación.
const CLAVE_STORAGE = "taskmanager_tareas";
let tareas = [];
let idEnEdicion = null;

// Recupera y valida las tareas guardadas.
function cargarTareas() {
    try {
        const datos = localStorage.getItem(CLAVE_STORAGE);

        if (datos === null) {
            return;
        }

        const tareasGuardadas = JSON.parse(datos);

        if (!Array.isArray(tareasGuardadas)) {
            throw new Error("Los datos no son un arreglo.");
        }

        const sonValidas = tareasGuardadas.every((tarea) => {
            return (
                tarea !== null &&
                typeof tarea === "object" &&
                typeof tarea.id === "string" &&
                typeof tarea.titulo === "string" &&
                tarea.titulo.trim() !== "" &&
                ["alta", "media", "baja"].includes(tarea.prioridad) &&
                typeof tarea.completada === "boolean" &&
                Number.isFinite(tarea.fechaCreacion)
            );
        });

        if (!sonValidas) {
            throw new Error("Hay tareas con datos inválidos.");
        }

        tareas = tareasGuardadas;
    } catch (error) {
        mensaje.textContent =
            "No se pudieron recuperar las tareas guardadas.";
        console.error(error);
    }
}

// Emite un evento personalizado con las métricas actuales.
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

// El dashboard escucha el evento y actualiza sus números.
document.addEventListener("tareasActualizadas", (evento) => {
    totalTareas.textContent = evento.detail.total;
    tareasPendientes.textContent = evento.detail.pendientes;
    tareasCompletadas.textContent = evento.detail.completadas;
});

// Actualiza la interfaz y guarda los cambios.
function guardarYMostrar(textoMensaje) {
    mostrarTareas();
    notificarCambioTareas();

    try {
        localStorage.setItem(CLAVE_STORAGE, JSON.stringify(tareas));
        mensaje.textContent = textoMensaje;
    } catch (error) {
        mensaje.textContent =
            "El cambio se hizo en pantalla, pero no pudo guardarse. " +
            "Se perderá al recargar.";
        console.error(error);
    }
}

// Restablece el formulario.
function reiniciarFormulario() {
    idEnEdicion = null;
    formulario.reset();
    tituloFormulario.textContent = "Nueva tarea";
    botonGuardar.textContent = "Agregar tarea";
    botonCancelar.hidden = true;
}

// Prepara una tarea para editar.
function editarTarea(id) {
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

// Alterna el estado de una tarea.
function cambiarEstado(id) {
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

// Elimina una tarea.
function eliminarTarea(id) {
    tareas = tareas.filter((tarea) => tarea.id !== id);

    if (idEnEdicion === id) {
        reiniciarFormulario();
    }

    guardarYMostrar("Tarea eliminada y cambios guardados.");
}

// filtra y ordena las tareas visibles.
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

// Dibuja las tareas en el DOM.
function mostrarTareas() {
    listaTareas.replaceChildren();

    const tareasVisibles = obtenerTareasVisibles();

    if (tareasVisibles.length === 0) {
        const aviso = document.createElement("li");

        aviso.textContent =
            tareas.length === 0
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

// Crea una tarea o guarda una edición.
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const titulo = campoTitulo.value.trim();
    const prioridad = campoPrioridad.value;

    if (titulo === "") {
        mensaje.textContent = "Escribe el título de la tarea.";
        campoTitulo.focus();
        return;
    }

    if (!["alta", "media", "baja"].includes(prioridad)) {
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

// Cancela la edición.
botonCancelar.addEventListener("click", () => {
    reiniciarFormulario();
    mensaje.textContent = "Edición cancelada.";
    campoTitulo.focus();
});

// Eventos de búsqueda, filtro y ordenamiento.
campoBusqueda.addEventListener("input", mostrarTareas);
filtroEstado.addEventListener("change", mostrarTareas);
ordenTareas.addEventListener("change", mostrarTareas);

// Inicio de la aplicación.
cargarTareas();
mostrarTareas();
notificarCambioTareas();