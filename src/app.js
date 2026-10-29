// Construye la aplicacion Express: vistas, pipeline global, rutas y 404.
// No abre el puerto (eso lo decide index.js) ni toca el arreglo de reservas.

const path = require("node:path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const {
  crearIdentificadorSolicitud,
  medirDuracion,
} = require("./middleware/solicitudes");
const { crearControladorReservas } = require("./controladores/reservas");
const { crearRouterReservas } = require("./rutas/reservas");

function crearApp({ servicioReservas, formatoRegistro }) {
  const app = express();

  const controladorReservas = crearControladorReservas(servicioReservas);
  const reservasRouter = crearRouterReservas(controladorReservas);

  // Vistas. __dirname aca es src/, por eso se sube un nivel.
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("layout", "layouts/main");

  // Pipeline global, en este orden
  app.use(morgan(formatoRegistro)); // 1. de terceros: "dev" o "combined"
  app.use(crearIdentificadorSolicitud()); // 2. propio: arma el ID de la solicitud
  app.use(medirDuracion); // 3. propio: usa ese ID y mide cuanto tarda
  app.use(expressLayouts); // 4. hace que las vistas usen el layout
  app.use(express.static(path.join(__dirname, "..", "public"))); // 5. archivos de public
  app.use(express.urlencoded({ extended: false })); // 6. arma req.body de los formularios
  app.use(express.json()); // 7. arma req.body cuando el cuerpo viene en JSON

  // Rutas de aplicacion
  app.get("/", controladorReservas.mostrarInicio);
  app.get("/estado", controladorReservas.mostrarEstado);

  // Se monta el router. Las rutas de adentro son relativas a /reservas.
  app.use("/reservas", reservasRouter);

  // Pagina 404, al final de todo
  app.use(function (req, res) {
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });

  return app;
}

module.exports = { crearApp };
