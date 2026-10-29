// Arranque del TP 08: lee el entorno, ESPERA la conexion con MongoDB y
// recien entonces abre el puerto. No declara rutas ni valida formularios.
//
// Ya no se importa el servicio en memoria ni la semilla de 4 reservas:
// el sitio y la API leen y escriben solamente en MongoDB.

const { leerConfiguracion } = require("./config/entorno");
const {
  conectarBaseDatos,
  desconectarBaseDatos,
  describirErrorConexion,
} = require("./config/base-datos");
const { crearServicioReservasMongo } = require("./servicios/reservas-mongo");
const { crearApp } = require("./app");

async function main() {
  // PORT invalido: se informa con nuestro mensaje y no se conecta nada.
  let configuracion;

  try {
    configuracion = leerConfiguracion();
  } catch (error) {
    console.error("No se pudo iniciar la aplicación: " + error.message);
    process.exitCode = 1;
    return;
  }

  const { puerto, formatoRegistro } = configuracion;

  // Una sola conexion para todo el proceso. Si falla, salta al catch de
  // abajo y el puerto nunca se abre.
  await conectarBaseDatos();
  console.log("Conexión con MongoDB establecida.");

  // Una sola instancia del servicio, compartida por el sitio y la API.
  const servicioReservas = crearServicioReservasMongo();
  const app = crearApp({ servicioReservas, formatoRegistro });

  // En Express 5 este callback tambien se llama si listen falla (por
  // ejemplo, puerto ocupado), con el error como argumento.
  const servidor = app.listen(puerto, async function (error) {
    if (error) {
      console.error(
        "No se pudo escuchar el puerto " + puerto + ":",
        error.code,
      );
      process.exitCode = 1;
      await cerrarConexion();
      return;
    }

    console.log("Servidor andando en http://localhost:" + puerto);
  });

  // Cierre ordenado con Ctrl + C (SIGINT) o un kill (SIGTERM): se deja de
  // aceptar conexiones, se esperan las solicitudes en curso y recien
  // despues se cierra MongoDB. No se desconecta despues de cada pedido.
  let cerrando = false;

  function cerrar(senal) {
    if (cerrando) {
      return;
    }

    cerrando = true;
    console.log("Recibí " + senal + ": cerrando el servidor...");

    servidor.close(async function () {
      await cerrarConexion();
      console.log("Servidor detenido y conexión con MongoDB cerrada.");
    });
  }

  process.once("SIGINT", function () {
    cerrar("SIGINT");
  });
  process.once("SIGTERM", function () {
    cerrar("SIGTERM");
  });
}

async function cerrarConexion() {
  try {
    await desconectarBaseDatos();
  } catch (error) {
    console.error("Error al cerrar la conexión:", error.name);
    process.exitCode = 1;
  }
}

main().catch(async function (error) {
  // Fallo de entorno, DNS, red o acceso: no se anuncia que el sitio anda.
  console.error("No se pudo iniciar la aplicación.");
  describirErrorConexion(error).forEach(function (linea) {
    console.error("  " + linea);
  });
  process.exitCode = 1;
  await cerrarConexion();
});
