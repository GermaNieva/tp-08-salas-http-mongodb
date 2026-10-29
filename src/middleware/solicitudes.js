// Middleware global: corre en todas las solicitudes, sin importar la ruta.

// Fabrica del identificador. Se ejecuta una sola vez al armar la app y
// devuelve el middleware que corre en cada solicitud. El contador queda
// encerrado aca adentro, ya no es una variable suelta del archivo principal.
function crearIdentificadorSolicitud() {
  let contador = 0;

  // Le pone un numero a cada solicitud: BIB-0001, BIB-0002, BIB-0003...
  return function identificarSolicitud(req, res, next) {
    contador = contador + 1;

    const numero = String(contador).padStart(4, "0");
    res.locals.solicitudId = "BIB-" + numero;

    next();
  };
}

// Mide cuanto tardo la respuesta. El calculo se hace dentro del evento
// "finish", que se dispara cuando la respuesta ya se termino de enviar.
function medirDuracion(req, res, next) {
  const inicio = Date.now();

  res.on("finish", function () {
    const duracion = Date.now() - inicio;

    console.log(
      res.locals.solicitudId +
        " " +
        req.method +
        " " +
        req.originalUrl +
        " -> " +
        res.statusCode +
        " (" +
        duracion +
        " ms)",
    );
  });

  next();
}

module.exports = { crearIdentificadorSolicitud, medirDuracion };
