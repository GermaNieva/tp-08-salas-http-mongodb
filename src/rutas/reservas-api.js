// Router de la API JSON de reservas. Comparte controlador, servicio y modelo
// con el sitio, pero responde JSON: 201 + Location al crear, sin redirigir.

const express = require("express");

const { validarReserva } = require("../middleware/reservas");

function crearRouterReservasApi(controladorReservas) {
  const router = express.Router();

  // Caminos relativos: la app monta este router en /api/reservas.
  router.get("/", controladorReservas.listarApi);
  router.get("/:id", controladorReservas.obtenerApi);
  router.post("/", validarReserva, controladorReservas.crearApi);

  return router;
}

module.exports = { crearRouterReservasApi };
