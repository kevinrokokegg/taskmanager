// Elementos de la página.
const formulario = document.getElementById("formulario-tarea");
const campoTitulo = document.getElementById("titulo-tarea");
const campoPrioridad = document.getElementById("prioridad-tarea");
const listaTareas = document.getElementById("lista-tareas");
const mensaje = document.getElementById("mensaje");

// Tareas almacenadas en memoria.
let tareas = [];

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

// Elimina la tarea cuyo id coincide.
function eliminarTarea(id) {
    tareas = tareas.filter((tarea) => tarea.id !== id);
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

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener("click", () => {
            eliminarTarea(tarea.id);
        });

        elemento.append(texto, estado, botonEstado, botonEliminar);
        listaTareas.appendChild(elemento);
    });
}

// Crea una tarea al enviar el formulario.
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

    const nuevaTarea = {
        id: crypto.randomUUID(),
        titulo: titulo,
        prioridad: prioridad,
        completada: false,
        fechaCreacion: Date.now()
    };

    tareas.push(nuevaTarea);
    mostrarTareas();

    formulario.reset();
    campoTitulo.focus();
    mensaje.textContent = "Tarea agregada correctamente.";
});

// Muestra el estado inicial de la lista.
mostrarTareas();