// Controlador de reservas: convierte la solicitud y lo que devuelve el
// servicio en una respuesta HTTP (vista, JSON, 404, 201 o redireccion).
// El servicio ahora es asincronico: cada operacion se espera con await.
// Si una operacion falla, Express 5 lleva el error al middleware de errores.

const {
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
} = require("../middleware/reservas");

// Fabrica del controlador. Recibe la unica instancia del servicio y todas
// las funciones que devuelve trabajan sobre ella.
function crearControladorReservas(servicioReservas) {
  // ---------------- Sitio HTML ----------------

  // GET /
  async function mostrarInicio(req, res) {
    res.render("inicio", {
      titulo: "Reservas de salas de estudio",
      cantidad: await servicioReservas.contar(),
    });
  }

  // GET /estado. Mismo contrato que antes; el conteo sale de MongoDB.
  async function mostrarEstado(req, res) {
    res.json({
      servicio: "activo",
      reservas: await servicioReservas.contar(),
      solicitudId: res.locals.solicitudId,
    });
  }

  // GET /reservas
  async function listar(req, res) {
    res.render("reservas/lista", {
      titulo: "Listado de reservas",
      reservas: await servicioReservas.listar(),
    });
  }

  // GET /reservas/nueva
  function mostrarFormulario(req, res) {
    res.render("reservas/nueva", {
      titulo: "Nueva reserva",
      salas: SALAS_PERMITIDAS,
      turnos: TURNOS_PERMITIDOS,
      error: null,
      valores: valoresVacios(),
    });
  }

  // GET /reservas/:id. El id es un ObjectId en texto: ya no se usa Number().
  async function mostrarDetalle(req, res) {
    const reserva = await servicioReservas.obtenerPorId(req.params.id);

    if (!reserva) {
      res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "No existe una reserva con el número " + req.params.id + ".",
      });
      return;
    }

    res.render("reservas/detalle", {
      titulo: "Reserva de " + reserva.estudiante,
      reserva: reserva,
    });
  }

  // POST /reservas. Recien despues de guardar se redirige (302).
  async function crear(req, res) {
    await servicioReservas.crear(req.reservaValidada);
    res.redirect("/reservas");
  }

  // ---------------- API JSON ----------------

  // GET /api/reservas y GET /api/reservas?sala=...
  async function listarApi(req, res) {
    res.json(await servicioReservas.listar(req.query.sala));
  }

  // GET /api/reservas/:id
  async function obtenerApi(req, res) {
    const reserva = await servicioReservas.obtenerPorId(req.params.id);

    if (!reserva) {
      res.status(404).json({ error: "Reserva no encontrada." });
      return;
    }

    res.json(reserva);
  }

  // POST /api/reservas. 201 y Location, recien despues de la escritura.
  async function crearApi(req, res) {
    const reserva = await servicioReservas.crear(req.reservaValidada);

    res
      .location("/api/reservas/" + reserva.id)
      .status(201)
      .json(reserva);
  }

  return {
    mostrarInicio,
    mostrarEstado,
    listar,
    mostrarFormulario,
    mostrarDetalle,
    crear,
    listarApi,
    obtenerApi,
    crearApi,
  };
}

// campos vacios, para la primera vez que se abre el formulario
function valoresVacios() {
  return {
    estudiante: "",
    email: "",
    sala: "",
    fecha: "",
    turno: "",
    personas: "",
  };
}

module.exports = { crearControladorReservas };
