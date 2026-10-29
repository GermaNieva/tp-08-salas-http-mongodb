// Servicio de reservas sobre MongoDB. Lo usan el sitio HTML y la API JSON.
// No importa Express ni elige codigos HTTP: devuelve datos, null o lanza
// errores con un "codigo" que despues traduce el middleware de errores.

const mongoose = require("mongoose");

const { Reserva } = require("../modelos/reserva");

// Lo que sale del servicio: un objeto simple con "id" en texto.
// Las vistas ya usaban reserva.id; MongoDB guarda _id como ObjectId.
function representarReserva(documento) {
  return {
    id: documento._id.toString(),
    estudiante: documento.estudiante,
    email: documento.email,
    sala: documento.sala,
    fecha: documento.fecha,
    turno: documento.turno,
    personas: documento.personas,
    estado: documento.estado,
  };
}

function errorDeEntrada(codigo, mensaje) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

function crearServicioReservasMongo() {
  // Todas las reservas, o solo las de una sala si llega el filtro.
  async function listar(sala) {
    // El criterio se arma aca, campo por campo. Nunca se pasa req.query
    // entero, asi el cliente no puede mandar operadores de MongoDB.
    const filtro = {};

    if (sala !== undefined) {
      // Si "sala" viene repetida, llega como arreglo: se rechaza.
      if (typeof sala !== "string" || sala.trim() === "") {
        throw errorDeEntrada(
          "FILTRO_INVALIDO",
          "El filtro sala tiene que ser un solo texto.",
        );
      }

      // Igualdad exacta: no es busqueda parcial ni ignora mayusculas.
      filtro.sala = sala.trim();
    }

    // lean() devuelve objetos simples en vez de documentos de Mongoose.
    const documentos = await Reserva.find(filtro).lean();
    return documentos.map(representarReserva);
  }

  // La reserva con ese id, o null si no existe.
  async function obtenerPorId(id) {
    // Formato invalido ("1", "abc") no es lo mismo que "no existe".
    if (!mongoose.isObjectIdOrHexString(id)) {
      throw errorDeEntrada(
        "ID_INVALIDO",
        "El identificador tiene que tener 24 caracteres hexadecimales.",
      );
    }

    const documento = await Reserva.findById(id).lean();
    return documento ? representarReserva(documento) : null;
  }

  async function contar() {
    return Reserva.countDocuments({});
  }

  // Se copian solo los seis campos admitidos: un estado o un _id que
  // mande el cliente nunca llegan a Mongoose.
  async function crear(datos) {
    const documento = await Reserva.create({
      estudiante: datos.estudiante,
      email: datos.email,
      sala: datos.sala,
      fecha: datos.fecha,
      turno: datos.turno,
      personas: datos.personas,
    });

    return representarReserva(documento);
  }

  return { listar, obtenerPorId, contar, crear };
}

module.exports = { crearServicioReservasMongo };
