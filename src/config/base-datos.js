// Apertura y cierre de la conexion con MongoDB, en un solo lugar.
// Los programas de scripts/ la usan; el sitio HTTP todavia no.

const dns = require("node:dns");
const mongoose = require("mongoose");

const { leerUriMongo } = require("./entorno");

// Correccion usada en el aula para las consultas DNS de Atlas.
// Una URI mongodb+srv:// obliga a consultar registros SRV y TXT; con esto
// esas consultas de ESTE proceso de Node usan 8.8.8.8 y 1.1.1.1.
// No cambia el DNS de Windows, ni la autenticacion, ni la lista de IPs.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function conectarBaseDatos() {
  await mongoose.connect(leerUriMongo(), {
    // Plazo para elegir un servidor: si no hay acceso, falla en 5 s
    // en vez de quedarse esperando.
    serverSelectionTimeoutMS: 5000,
  });
}

async function desconectarBaseDatos() {
  await mongoose.disconnect();
}

const CODIGOS_DNS = [
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEOUT",
  "ESERVFAIL",
  "EAI_AGAIN",
];

// Arma las lineas para explicar un fallo de conexion sin publicar la URI.
// Se muestra el nombre del error, el codigo DNS si es uno conocido y la
// operacion de resolucion; nunca el mensaje completo del driver.
function describirErrorConexion(error) {
  const lineas = ["Tipo de error: " + error.name];

  if (error.name === "ErrorDeConfiguracion") {
    // Este mensaje lo escribimos nosotros en entorno.js, no tiene secretos.
    lineas.push("Configuración: " + error.message);
    lineas.push("Revisar el archivo .env (copiarlo de .env.example).");
    return lineas;
  }

  if (CODIGOS_DNS.includes(error.code)) {
    lineas.push("Código DNS/red: " + error.code);
  }

  if (error.syscall === "querySrv" || error.syscall === "queryTxt") {
    lineas.push("Consulta DNS: " + error.syscall);
    lineas.push("Revisar que el HOST de la URI sea el real copiado de Atlas.");
  }

  // 8000 (AtlasError) y 18 son los codigos de autenticacion rechazada.
  if (error.name === "MongoServerError" && [8000, 18].includes(error.code)) {
    lineas.push("Acceso: Atlas rechazó el usuario o la contraseña de la base.");
  }

  if (error.name === "MongooseServerSelectionError") {
    lineas.push(
      "Servidor: no se pudo llegar al clúster. Revisar la IP permitida " +
        "en Network Access, que el clúster esté activo y la conexión a Internet.",
    );
  }

  lineas.push("Revisar MONGODB_URI, servidor, red y permisos.");
  return lineas;
}

module.exports = {
  conectarBaseDatos,
  desconectarBaseDatos,
  describirErrorConexion,
};
