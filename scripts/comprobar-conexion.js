// Prueba de conexion: conecta, avisa y cierra. No crea ni lee reservas.
// Uso, desde la raiz: node --env-file=.env scripts/comprobar-conexion.js

const {
  conectarBaseDatos,
  desconectarBaseDatos,
  describirErrorConexion,
} = require("../src/config/base-datos");

async function main() {
  try {
    // El aviso va despues del await: recien ahi la conexion existe.
    await conectarBaseDatos();
    console.log("Conexión con MongoDB establecida.");
  } finally {
    // Se cierra salga bien o mal, asi el proceso termina.
    await desconectarBaseDatos();
  }
}

main().catch(function (error) {
  console.error("No se pudo completar la conexión.");
  describirErrorConexion(error).forEach(function (linea) {
    console.error("  " + linea);
  });
  process.exitCode = 1;
});
