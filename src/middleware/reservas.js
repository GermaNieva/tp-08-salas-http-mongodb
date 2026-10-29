// Middleware propio del area de reservas: la seccion y la validacion del POST.
// La validacion la usan el formulario HTML y la API JSON.

// Las reglas del formulario. Las usa el validador, el controlador para
// dibujar los <select> y el modelo de Mongoose, asi hay una sola lista.
const SALAS_PERMITIDAS = ["Sala Norte", "Sala Sur", "Sala Multimedia"];
const TURNOS_PERMITIDOS = ["Mañana", "Tarde", "Noche"];

// Middleware de area: corre solo para lo que cuelga de /reservas.
function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

// Solo se acepta texto. Un numero, un booleano, un arreglo o un objeto
// cuentan como campo vacio: no se convierten a la fuerza en un texto.
function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

// Lo que se le devuelve al formulario si algo sale mal, asi la persona no
// tiene que escribir todo de nuevo. Lo usa tambien el manejador de errores.
function valoresDelFormulario(datos) {
  const personas = datos.personas;

  return {
    estudiante: texto(datos.estudiante),
    email: texto(datos.email),
    sala: texto(datos.sala),
    fecha: texto(datos.fecha),
    turno: texto(datos.turno),
    personas:
      typeof personas === "string" || typeof personas === "number"
        ? String(personas)
        : "",
  };
}

function validarReserva(req, res, next) {
  // Sin cuerpo, o con un Content-Type que ningun parser entiende,
  // req.body queda undefined: con el objeto vacio cae en el 400.
  const datos = req.body ?? {};
  const valores = valoresDelFormulario(datos);

  // personas puede llegar como numero (JSON) o como texto (formulario).
  // true, [3] o {} no son una cantidad aunque Number() los convierta.
  const recibidas = datos.personas;
  const tipoValido =
    typeof recibidas === "number" ||
    (typeof recibidas === "string" && recibidas.trim() !== "");
  const personas = tipoValido ? Number(recibidas) : NaN;
  const faltanPersonas =
    recibidas === undefined ||
    recibidas === null ||
    (typeof recibidas === "string" && recibidas.trim() === "");

  let error = null;
  let campos = [];

  const vacios = ["estudiante", "email", "sala", "fecha", "turno"].filter(
    function (campo) {
      return valores[campo] === "";
    },
  );

  if (vacios.length > 0 || faltanPersonas) {
    error = "Hay que completar todos los campos.";
    campos = faltanPersonas ? vacios.concat("personas") : vacios;
  } else if (!SALAS_PERMITIDAS.includes(valores.sala)) {
    error = "Esa sala no está en la lista de salas permitidas.";
    campos = ["sala"];
  } else if (!TURNOS_PERMITIDOS.includes(valores.turno)) {
    error = "El turno tiene que ser Mañana, Tarde o Noche.";
    campos = ["turno"];
  } else if (!Number.isInteger(personas) || personas < 1 || personas > 6) {
    error =
      "La cantidad de personas tiene que ser un número entero del 1 al 6.";
    campos = ["personas"];
  } else if (!valores.email.includes("@")) {
    error = "El email tiene que tener una arroba.";
    campos = ["email"];
  }

  // Camino invalido: responde 400 y ahi termina el ciclo. No llama a next().
  if (error) {
    if (req.baseUrl === "/api/reservas") {
      res.status(400).json({ error: error, campos: campos });
      return;
    }

    res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      salas: SALAS_PERMITIDAS,
      turnos: TURNOS_PERMITIDOS,
      error: error,
      valores: valores,
    });
    return;
  }

  // Camino valido: solo los seis campos admitidos siguen al controlador.
  req.reservaValidada = {
    estudiante: valores.estudiante,
    email: valores.email,
    sala: valores.sala,
    fecha: valores.fecha,
    turno: valores.turno,
    personas: personas,
  };

  next();
}

module.exports = {
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
  prepararAreaReservas,
  validarReserva,
  valoresDelFormulario,
};
