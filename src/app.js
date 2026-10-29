// Construye la aplicacion Express: vistas, pipeline global, rutas, 404 y
// manejo de errores. No abre el puerto ni se conecta a MongoDB.

const path = require("node:path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");

const {
  crearIdentificadorSolicitud,
  medirDuracion,
} = require("./middleware/solicitudes");
const { manejarErrores, esRutaApi } = require("./middleware/errores");
const { crearControladorReservas } = require("./controladores/reservas");
const { crearRouterReservas } = require("./rutas/reservas");
const { crearRouterReservasApi } = require("./rutas/reservas-api");

function crearApp({ servicioReservas, formatoRegistro }) {
  const app = express();

  const controladorReservas = crearControladorReservas(servicioReservas);
  const reservasRouter = crearRouterReservas(controladorReservas);
  const reservasApiRouter = crearRouterReservasApi(controladorReservas);

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

  // API JSON y sitio HTML: dos routers con el mismo controlador.
  // Las rutas de adentro son relativas al lugar donde se montan.
  app.use("/api/reservas", reservasApiRouter);
  app.use("/reservas", reservasRouter);

  // 404, al final de las rutas. En la API tambien responde JSON.
  app.use(function (req, res) {
    if (esRutaApi(req)) {
      res.status(404).json({ error: "Ruta no encontrada." });
      return;
    }

    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });

  // Errores, despues de todo lo demas.
  app.use(manejarErrores);

  return app;
}

module.exports = { crearApp };
