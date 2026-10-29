// Crea UNA reserva en MongoDB por cada ejecucion y muestra su _id.
// Uso, desde la raiz: node --env-file=.env scripts/crear-reserva.js
//
// Datos ficticios fijos. Correrlo dos veces crea dos documentos distintos
// (con distinto _id) aunque los campos sean iguales: no hay regla de unicidad.

const {
  conectarBaseDatos,
  desconectarBaseDatos,
  describirErrorConexion,
} = require("../src/config/base-datos");
const { Reserva } = require("../src/modelos/reserva");

async function main() {
  try {
    await conectarBaseDatos();

    // create valida con el esquema y guarda. Si algo falla, no sigue.
    const reserva = await Reserva.create({
      estudiante: "Valentina Ríos",
      email: "valentina.rios@ejemplo.com",
      sala: "Sala Multimedia",
      fecha: "2026-11-09",
      turno: "Tarde",
      personas: 3,
    });

    // Recien aca la escritura esta confirmada por MongoDB.
    console.log("Reserva guardada en MongoDB.");
    console.log("_id:", reserva._id.toString());
  } finally {
    await desconectarBaseDatos();
  }
}

main().catch(function (error) {
  console.error("No se pudo crear la reserva.");

  if (error.name === "ValidationError") {
    console.error(
      "  Tipo de error: ValidationError (los datos no cumplen el modelo)",
    );
    Object.keys(error.errors).forEach(function (campo) {
      const detalle = error.errors[campo];
      const tipo =
        detalle.name === "CastError" ? "no se pudo convertir" : "regla";
      console.error("  Campo a revisar: " + campo + " (" + tipo + ")");
    });
    console.error("  No se escribió ningún documento.");
  } else {
    describirErrorConexion(error).forEach(function (linea) {
      console.error("  " + linea);
    });
  }

  process.exitCode = 1;
});
