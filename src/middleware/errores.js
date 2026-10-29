// Middleware de errores: lo reconoce Express porque tiene CUATRO parametros.
// Va despues de todas las rutas y del 404. Separa tres casos:
//   - entrada invalida (datos, id mal formado, filtro, JSON roto) -> 400
//   - fallo inesperado (por ejemplo, la base no responde)          -> 500
// Nunca devuelve la traza, la URI ni el mensaje interno del error.

const {
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
  valoresDelFormulario,
} = require("./reservas");

function esRutaApi(req) {
  return /^\/api(\/|\?|$)/.test(req.originalUrl);
}

function manejarErrores(error, req, res, next) {
  // Si ya se empezo a mandar la respuesta, solo Express puede cortarla.
  if (res.headersSent) {
    next(error);
    return;
  }

  const esValidacion = error.name === "ValidationError";
  // express.json() marca asi el JSON mal formado.
  const esJsonRoto = error.type === "entity.parse.failed";
  const esEntrada =
    esValidacion ||
    esJsonRoto ||
    error.name === "CastError" ||
    error.codigo === "ID_INVALIDO" ||
    error.codigo === "FILTRO_INVALIDO";

  const estado = esEntrada ? 400 : 500;

  let mensaje = esEntrada
    ? "Revisá los datos enviados."
    : "No se pudo completar la operación. Probá de nuevo más tarde.";

  if (error.codigo === "ID_INVALIDO" || error.codigo === "FILTRO_INVALIDO") {
    // Estos mensajes los escribimos nosotros en el servicio.
    mensaje = error.message;
  } else if (esJsonRoto) {
    mensaje = "El cuerpo no es un JSON válido.";
  }

  // Diagnostico en la terminal, sin datos sensibles: ID, tipo y codigo.
  console.error(
    "Solicitud fallida:",
    res.locals.solicitudId,
    error.name,
    error.codigo ?? error.code ?? "",
  );

  if (esRutaApi(req)) {
    res.status(estado).json({
      error: mensaje,
      campos: esValidacion ? Object.keys(error.errors) : [],
    });
    return;
  }

  // Un rechazo del esquema en el formulario vuelve al formulario con 400.
  if (esValidacion && req.method === "POST") {
    res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      salas: SALAS_PERMITIDAS,
      turnos: TURNOS_PERMITIDOS,
      error: mensaje,
      valores: valoresDelFormulario(req.body ?? {}),
    });
    return;
  }

  res.status(estado).render("no-encontrado", {
    titulo: esEntrada ? "Solicitud inválida" : "Error del servicio",
    mensaje: mensaje,
  });
}

module.exports = { manejarErrores, esRutaApi };
