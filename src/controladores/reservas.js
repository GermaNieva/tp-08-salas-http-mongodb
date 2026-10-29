// Controlador de reservas: convierte la solicitud y lo que devuelve el
// servicio en una respuesta HTTP (vista, JSON, 404 o redireccion).
// No guarda el arreglo ni sabe como se buscan los datos.

const {
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
} = require("../middleware/reservas");

// Fabrica del controlador. Recibe la unica instancia del servicio y todas
// las funciones que devuelve trabajan sobre ella.
function crearControladorReservas(servicioReservas) {
  // GET /
  function mostrarInicio(req, res) {
    res.render("inicio", {
      titulo: "Reservas de salas de estudio",
      cantidad: servicioReservas.contar(),
    });
  }

  // GET /estado. No renderiza vistas ni depende de "seccion": devuelve JSON.
  function mostrarEstado(req, res) {
    res.json({
      servicio: "activo",
      reservas: servicioReservas.contar(),
      solicitudId: res.locals.solicitudId,
    });
  }

  // GET /reservas
  function listar(req, res) {
    res.render("reservas/lista", {
      titulo: "Listado de reservas",
      reservas: servicioReservas.listar(),
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

  // GET /reservas/:id
  function mostrarDetalle(req, res) {
    const id = Number(req.params.id);
    const reserva = servicioReservas.obtenerPorId(id);

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

  // POST /reservas. Confia en el validador, no repite las comprobaciones.
  function crear(req, res) {
    servicioReservas.crear(req.reservaValidada);

    // 302: el navegador pide de nuevo el listado con un GET.
    res.redirect("/reservas");
  }

  return {
    mostrarInicio,
    mostrarEstado,
    listar,
    mostrarFormulario,
    mostrarDetalle,
    crear,
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
