// Servicio de reservas: es el unico que conoce el arreglo y sus operaciones.
// No usa req, res, vistas ni codigos HTTP: recibe datos y devuelve datos.

// Fabrica del servicio. Recibe la semilla y devuelve las operaciones,
// que comparten el mismo arreglo privado mientras el proceso este encendido.
function crearServicioReservas(reservasIniciales) {
  // Copia de la semilla: los cambios no tocan el arreglo original.
  const reservas = [...reservasIniciales];

  // Devuelve una copia para que nadie de afuera haga push sobre el arreglo.
  function listar() {
    return [...reservas];
  }

  // La reserva con ese id, o null si no existe.
  function obtenerPorId(id) {
    const reserva = reservas.find(function (item) {
      return item.id === id;
    });

    return reserva ?? null;
  }

  function contar() {
    return reservas.length;
  }

  // Recibe datos ya validados, le pone un id (el mas alto + 1) y la agrega.
  function crear(datosValidados) {
    const nueva = { id: proximoId(), ...datosValidados };

    reservas.push(nueva);

    return nueva;
  }

  function proximoId() {
    let mayor = 0;

    reservas.forEach(function (reserva) {
      if (reserva.id > mayor) {
        mayor = reserva.id;
      }
    });

    return mayor + 1;
  }

  return { listar, obtenerPorId, contar, crear };
}

module.exports = { crearServicioReservas };
