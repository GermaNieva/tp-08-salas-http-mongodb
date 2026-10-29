// Esquema y modelo de una reserva en MongoDB.
// El esquema define que es una reserva valida; el modelo Reserva ofrece las
// operaciones (create, find...) sobre la coleccion "reservas".
// Importar este archivo no conecta ni guarda nada.

const mongoose = require("mongoose");

// Las mismas listas que usa el formulario del sitio, asi las reglas no se
// separan: si se agrega una sala, cambia en un solo lugar.
const {
  SALAS_PERMITIDAS,
  TURNOS_PERMITIDOS,
} = require("../middleware/reservas");

const reservaSchema = new mongoose.Schema(
  {
    estudiante: {
      type: String,
      required: [true, "El nombre del estudiante es obligatorio."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "El email es obligatorio."],
      trim: true,
      // Solo comprueba que haya una arroba, no valida el email completo.
      match: [/@/, "El email tiene que tener una arroba."],
    },
    sala: {
      type: String,
      required: [true, "La sala es obligatoria."],
      enum: {
        values: SALAS_PERMITIDAS,
        message: "La sala {VALUE} no está permitida.",
      },
    },
    fecha: {
      // Texto como en el sitio: no se controla todavia que sea una fecha real.
      type: String,
      required: [true, "La fecha es obligatoria."],
      trim: true,
    },
    turno: {
      type: String,
      required: [true, "El turno es obligatorio."],
      enum: {
        values: TURNOS_PERMITIDOS,
        message: "El turno {VALUE} no está permitido.",
      },
    },
    personas: {
      type: Number,
      required: [true, "La cantidad de personas es obligatoria."],
      min: [1, "Tiene que haber al menos 1 persona."],
      max: [6, "No pueden ser más de 6 personas."],
      // Se pasa la funcion, no se la llama: Mongoose la ejecuta sobre el
      // valor ya convertido a numero. 2.5 cumple el rango pero no es entero.
      validate: {
        validator: Number.isInteger,
        message: "La cantidad de personas tiene que ser un número entero.",
      },
    },
    // Lo pone el servidor, no el cliente: toda reserva nueva arranca pendiente.
    // El default se aplica al crear; no reescribe documentos viejos.
    estado: {
      type: String,
      enum: {
        values: ["pendiente", "confirmada"],
        message: "El estado {VALUE} no existe.",
      },
      default: "pendiente",
    },
  },
  // Coleccion explicita, para no depender de como Mongoose arma el plural.
  { collection: "reservas" },
);

const Reserva = mongoose.model("Reserva", reservaSchema);

module.exports = { Reserva };
