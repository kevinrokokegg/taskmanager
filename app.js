// Seleccionamos los elementos del HTML por su id.
const formulario = document.getElementById("formulario-tarea");
const campoTitulo = document.getElementById("titulo-tarea");
const campoPrioridad = document.getElementById("prioridad-tarea");
const listaTareas = document.getElementById("lista-tareas");
const mensaje = document.getElementById("mensaje");

// Aquí almacenamos las tareas mientras la página está abierta.
const tareas = [];

// Dibuja en pantalla las tareas del arreglo.
function mostrarTareas() {
    listaTareas.replaceChildren();

    tareas.forEach((tarea) => {
        const elemento = document.createElement("li");

        elemento.textContent =
            `${tarea.titulo} — Prioridad: ${tarea.prioridad}`;

        listaTareas.appendChild(elemento);
    });
}

// Escuchamos el envío del formulario.
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    const titulo = campoTitulo.value.trim();
    const prioridad = campoPrioridad.value;

    // Rechazamos títulos vacíos o escritos solo con espacios.
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