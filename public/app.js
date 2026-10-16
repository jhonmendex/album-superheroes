const formulario = document.querySelector("#formulario");
const galeria = document.querySelector("#galeria");
const mensaje = document.querySelector("#mensaje");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const datos = new FormData(formulario);
  mensaje.textContent = "Guardando superheroe...";

  try {
    const respuesta = await fetch("/api/superheroes", {
      method: "POST",
      body: datos,
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.error || "Error al guardar");
    }

    formulario.reset();
    mensaje.textContent = "Superheroe guardado.";

    await cargarSuperheroes();
  } catch (error) {
    mensaje.textContent = error.message;
  }
});

async function cargarSuperheroes() {
  const respuesta = await fetch("/api/superheroes");
  const superheroes = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error("No fue posible cargar la galeria");
  }

  galeria.replaceChildren();

  superheroes.forEach((superheroe) => {
    const tarjeta = document.createElement("article");
    const titulo = document.createElement("h3");
    const poder = document.createElement("p");
    const imagen = document.createElement("img");

    titulo.textContent = superheroe.nombre;
    poder.textContent = `Poder: ${superheroe.poder}`;

    imagen.src = `/api/superheroes/${superheroe.id}/imagen`;
    imagen.alt = `Imagen de ${superheroe.nombre}`;

    tarjeta.append(imagen, titulo, poder);
    galeria.append(tarjeta);
  });
}

cargarSuperheroes().catch((error) => {
  mensaje.textContent = error.message;
});
