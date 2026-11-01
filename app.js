// Elementos de la página.
const formulario = document.getElementById("formulario-tarea");
const campoTitulo = document.getElementById("titulo-tarea");
const campoPrioridad = document.getElementById("prioridad-tarea");
const listaTareas = document.getElementById("lista-tareas");
const mensaje = document.getElementById("mensaje");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonGuardar = formulario.querySelector('button[type="submit"]');

// Creamos un botón para cancelar la edición.
const botonCancelar = document.createElement("button");
botonCancelar.type = "button";
botonCancelar.textContent = "Cancelar edición";
botonCancelar.hidden = true;
formulario.appendChild(botonCancelar);

// Datos de la aplicación.
let tareas = [];
let idEnEdicion = null;

// Devuelve el formulario al modo de creación.
function reiniciarFormulario() {
    idEnEdicion = null;
    formulario.reset();
    tituloFormulario.textContent = "Nueva tarea";
    botonGuardar.textContent = "Agregar tarea";
    botonCancelar.hidden = true;
}

// Carga una tarea en el formulario para editarla.
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

// Cancela sin modificar los datos de la tarea.
botonCancelar.addEventListener("click", () => {
    reiniciarFormulario();
    mensaje.textContent = "Edición cancelada.";
    campoTitulo.focus();
});

// Cambia entre completada y pendiente.
function cambiarEstado(id) {
    const tarea = tareas.find((tarea) => tarea.id === id);

    if (!tarea) {
        return;
    }

    tarea.completada = !tarea.completada;
    mostrarTareas();

    mensaje.textContent = tarea.completada
        ? "Tarea completada."
        : "Tarea marcada como pendiente.";
}

// Elimina una tarea.
function eliminarTarea(id) {
    tareas = tareas.filter((tarea) => tarea.id !== id);

    // Evita seguir editando una tarea que ya no existe.
    if (idEnEdicion === id) {
        reiniciarFormulario();
    }

    mostrarTareas();
    mensaje.textContent = "Tarea eliminada.";
}

// Actualiza la lista en pantalla.
function mostrarTareas() {
    listaTareas.replaceChildren();

    if (tareas.length === 0) {
        const aviso = document.createElement("li");
        aviso.textContent = "Todavía no tienes tareas.";
        listaTareas.appendChild(aviso);
        return;
    }

    tareas.forEach((tarea) => {
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

// Crea una tarea o guarda la edición.
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

        mensaje.textContent = "Tarea actualizada correctamente.";
    } else {
        const nuevaTarea = {
            id: crypto.randomUUID(),
            titulo: titulo,
            prioridad: prioridad,
            completada: false,
            fechaCreacion: Date.now()
        };

        tareas.push(nuevaTarea);
        mensaje.textContent = "Tarea agregada correctamente.";
    }

    mostrarTareas();
    reiniciarFormulario();
    campoTitulo.focus();
});

mostrarTareas();