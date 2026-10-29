// Router de reservas: es el mapa del area. Relaciona metodo y camino con
// el middleware y el controlador que corresponden. No toca datos ni renderiza.

const express = require("express");

const {
  prepararAreaReservas,
  validarReserva,
} = require("../middleware/reservas");

function crearRouterReservas(controladorReservas) {
  const router = express.Router();

  // Middleware de area: corre en todo lo que entra por /reservas.
  router.use(prepararAreaReservas);

  // Los caminos son relativos: la app monta este router en /reservas,
  // asi que "/" es /reservas y "/nueva" es /reservas/nueva.
  router.get("/", controladorReservas.listar);
  // "/nueva" va antes de "/:id" para que "nueva" no se tome como un id.
  router.get("/nueva", controladorReservas.mostrarFormulario);
  router.get("/:id", controladorReservas.mostrarDetalle);
  router.post("/", validarReserva, controladorReservas.crear);

  return router;
}

module.exports = { crearRouterReservas };
