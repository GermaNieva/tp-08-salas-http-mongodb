// Arranque del TP 06: crea las dependencias, arma la app y abre el puerto.
// No declara rutas ni valida formularios.

const { leerConfiguracion } = require("./config/entorno");
const { crearServicioReservas } = require("./servicios/reservas");
const { crearApp } = require("./app");

// Semilla: las reservas con las que arranca el servidor.
// No es persistencia: cada vez que el proceso arranca se vuelve a esta lista.
const reservasIniciales = [
  {
    id: 1,
    estudiante: "Germán Nieva",
    email: "german.nieva@ejemplo.com",
    sala: "Sala Norte",
    fecha: "2026-09-22",
    turno: "Mañana",
    personas: 3,
  },
  {
    id: 2,
    estudiante: "Camila Ruiz",
    email: "camila.ruiz@ejemplo.com",
    sala: "Sala Multimedia",
    fecha: "2026-09-22",
    turno: "Tarde",
    personas: 5,
  },
  {
    id: 3,
    estudiante: "Marcos Ledesma",
    email: "marcos.ledesma@ejemplo.com",
    sala: "Sala Sur",
    fecha: "2026-09-23",
    turno: "Noche",
    personas: 2,
  },
  {
    id: 4,
    estudiante: "Paula Sosa",
    email: "paula.sosa@ejemplo.com",
    sala: "Sala Norte",
    fecha: "2026-09-24",
    turno: "Tarde",
    personas: 6,
  },
];

function main() {
  // Lo primero es la configuracion: si PORT es invalido, no se arma nada.
  let configuracion;

  try {
    configuracion = leerConfiguracion();
  } catch (error) {
    console.error("No se pudo iniciar la aplicación: " + error.message);
    process.exitCode = 1;
    return;
  }

  const { puerto, formatoRegistro } = configuracion;

  // Una sola instancia del servicio, compartida por listado, detalle,
  // /estado y creacion.
  const servicioReservas = crearServicioReservas(reservasIniciales);
  const app = crearApp({ servicioReservas, formatoRegistro });

  app.listen(puerto, function () {
    console.log("Servidor andando en http://localhost:" + puerto);
    console.log("Reservas iniciales: " + servicioReservas.contar());
  });
}

main();
