// Lista todas las reservas guardadas en MongoDB. Solo lee: no crea ni borra,
// no carga ninguna semilla y no mira las reservas en memoria del sitio.
// Uso, desde la raiz: node --env-file=.env scripts/listar-reservas.js

const {
  conectarBaseDatos,
  desconectarBaseDatos,
  describirErrorConexion,
} = require("../src/config/base-datos");
const { Reserva } = require("../src/modelos/reserva");

async function main() {
  try {
    await conectarBaseDatos();

    // find({}) = todos los documentos. Sin await seria un objeto Query.
    const reservas = await Reserva.find({});

    if (reservas.length > 0) {
      console.table(
        reservas.map(function (reserva) {
          return {
            // El _id es un ObjectId; se pasa a texto solo para mostrarlo.
            id: reserva._id.toString(),
            estudiante: reserva.estudiante,
            sala: reserva.sala,
            fecha: reserva.fecha,
            turno: reserva.turno,
            personas: reserva.personas,
          };
        }),
      );
    }

    // Una coleccion vacia no es un error: es un listado con cantidad 0.
    console.log("Reservas recuperadas:", reservas.length);
  } finally {
    await desconectarBaseDatos();
  }
}

main().catch(function (error) {
  console.error("No se pudieron consultar las reservas.");
  describirErrorConexion(error).forEach(function (linea) {
    console.error("  " + linea);
  });
  process.exitCode = 1;
});
