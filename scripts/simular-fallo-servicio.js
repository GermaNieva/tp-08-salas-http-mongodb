/* global fetch */ // fetch es global en Node 18 o superior.

// Simulacion controlada de un fallo inesperado durante una operacion.
// Arma la app real con un servicio FALSO que siempre falla, como si la base
// dejara de responder. No se conecta a MongoDB ni toca Atlas.
// Uso, desde la raiz: node scripts/simular-fallo-servicio.js

const { crearApp } = require("../src/app");

// El error trae una URI inventada en el mensaje para comprobar que la
// respuesta no la publica.
function falla() {
  const error = new Error(
    "connection refused mongodb+srv://usuario:secreto@ejemplo.mongodb.net",
  );
  error.name = "MongooseServerSelectionError";
  return Promise.reject(error);
}

const servicioQueFalla = {
  listar: falla,
  obtenerPorId: falla,
  contar: falla,
  crear: falla,
};

const reservaValida = {
  estudiante: "Ana Ejemplo",
  email: "ana@example.com",
  sala: "Sala Norte",
  fecha: "2026-10-21",
  turno: "Mañana",
  personas: 2,
};

async function main() {
  const app = crearApp({
    servicioReservas: servicioQueFalla,
    formatoRegistro: "tiny",
  });

  // Puerto 0: el sistema elige uno libre.
  const servidor = app.listen(0);
  await new Promise(function (resolver) {
    servidor.once("listening", resolver);
  });
  const base = "http://localhost:" + servidor.address().port;

  const pedidos = [
    ["GET", "/api/reservas"],
    ["GET", "/api/reservas/000000000000000000000000"],
    ["POST", "/api/reservas"],
    ["GET", "/reservas"],
    ["GET", "/estado"],
  ];

  let todoBien = true;

  try {
    for (const [metodo, ruta] of pedidos) {
      const respuesta = await fetch(base + ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: metodo === "POST" ? JSON.stringify(reservaValida) : undefined,
      });
      const cuerpo = await respuesta.text();

      const filtraSecretos = /secreto|mongodb\+srv|at .*\.js/.test(cuerpo);
      const esperado = respuesta.status === 500 && !filtraSecretos;
      todoBien = todoBien && esperado;

      const muestra = cuerpo.includes("<html")
        ? "(HTML) " + (cuerpo.match(/<h1>([^<]*)<\/h1>/) ?? [])[1]
        : cuerpo;

      console.log(
        metodo.padEnd(4) + " " + ruta.padEnd(42) + " -> " + respuesta.status,
        "| " + muestra,
        "| ¿publica secretos o traza?: " + (filtraSecretos ? "SÍ" : "no"),
      );
    }
  } finally {
    servidor.close();
  }

  console.log(
    todoBien
      ? "Resultado: todas las respuestas son 500 y no publican la URI."
      : "Resultado: alguna respuesta no fue la esperada.",
  );

  if (!todoBien) {
    process.exitCode = 1;
  }
}

main().catch(function (error) {
  console.error("No se pudo ejecutar la simulación:", error.name);
  process.exitCode = 1;
});
