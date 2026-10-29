// Comprueba las reglas del modelo SIN conectarse y SIN guardar.
// Sirve para separar "los datos estan mal" de "no hay conexion".
// Uso, desde la raiz: node scripts/validar-reserva.js

const { Reserva } = require("../src/modelos/reserva");

async function main() {
  const reserva = new Reserva({
    estudiante: "Valentina Ríos",
    email: "valentina.rios@ejemplo.com",
    sala: "Sala Multimedia",
    fecha: "2026-11-09",
    turno: "Tarde",
    personas: 3,
  });

  // validate() aplica las reglas del esquema pero no escribe en MongoDB.
  await reserva.validate();

  console.log("Datos válidos; todavía no se guardó nada en MongoDB.");
  // El _id ya existe aunque no se haya guardado: lo genera Mongoose aca mismo.
  console.log("_id asignado en memoria:", reserva._id.toString());
}

main().catch(function (error) {
  console.error("Validación rechazada:", error.name);

  if (error.errors) {
    Object.keys(error.errors).forEach(function (campo) {
      const detalle = error.errors[campo];
      console.error(
        "  " + campo + " (" + detalle.name + "): " + detalle.message,
      );
    });
  }

  process.exitCode = 1;
});
