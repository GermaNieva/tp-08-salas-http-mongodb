// Middleware propio del area de reservas: la seccion y la validacion del POST.

// Las reglas del formulario. Las usa el validador y tambien el controlador
// para dibujar las opciones de los <select>, asi hay una sola lista de cada una.
const SALAS_PERMITIDAS = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const TURNOS_PERMITIDOS = ["Mañana", "Tarde", "Noche"];

// Middleware de area: corre solo para lo que cuelga de /reservas.
function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

function validarReserva(req, res, next) {
  // Si el POST llega sin cuerpo o con un Content-Type que ningun parser
  // entiende (por ejemplo text/plain), req.body queda undefined.
  // En el TP 05 eso terminaba en un 500; con el objeto vacio cae en el 400.
  const datos = req.body ?? {};

  const estudiante = String(datos.estudiante ?? "").trim();
  const email = String(datos.email ?? "").trim();
  const sala = String(datos.sala ?? "").trim();
  const fecha = String(datos.fecha ?? "").trim();
  const turno = String(datos.turno ?? "").trim();
  const personas = Number(datos.personas);

  // Lo que se le devuelve al formulario si algo sale mal,
  // asi la persona no tiene que escribir todo de nuevo.
  const valores = {
    estudiante: estudiante,
    email: email,
    sala: sala,
    fecha: fecha,
    turno: turno,
    personas: String(datos.personas ?? ""),
  };

  let error = null;

  if (
    estudiante === "" ||
    email === "" ||
    sala === "" ||
    fecha === "" ||
    turno === "" ||
    valores.personas === ""
  ) {
    error = "Hay que completar todos los campos.";
  } else if (!SALAS_PERMITIDAS.includes(sala)) {
    error = "Esa sala no está en la lista de salas permitidas.";
  } else if (!TURNOS_PERMITIDOS.includes(turno)) {
    error = "El turno tiene que ser Mañana, Tarde o Noche.";
  } else if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
    error =
      "La cantidad de personas tiene que ser un número entero del 1 al 6.";
  } else if (!email.includes("@")) {
    error = "El email tiene que tener una arroba.";
  }

  // Camino invalido: responde 400 y ahi termina el ciclo. No llama a next().
  if (error) {
    res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      salas: SALAS_PERMITIDAS,
      turnos: TURNOS_PERMITIDOS,
      error: error,
      valores: valores,
    });
    return;
  }

  // Camino valido: deja los datos listos y sigue al controlador.
  req.reservaValidada = {
    estudiante: estudiante,
    email: email,
    sala: sala,
    fecha: fecha,
    turno: turno,
    personas: personas,
  };

  next();
}

module.exports = {
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
  prepararAreaReservas,
  validarReserva,
};
