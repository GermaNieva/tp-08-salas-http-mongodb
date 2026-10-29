// Lee y valida las variables de entorno en un solo lugar.
// Leer la configuracion no abre conexiones ni imprime nada: devuelve valores
// o lanza un error. Ninguna lectura se ejecuta al importar este archivo.

// Configuracion del sitio HTTP (la misma del TP 06).
function leerConfiguracion(entorno = process.env) {
  // process.env siempre trae texto: "3000", "abc"... Si PORT no existe, 3000.
  const puerto = Number(entorno.PORT ?? 3000);

  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    throw new Error(
      "PORT tiene que ser un número entero entre 1 y 65535 (llegó: " +
        entorno.PORT +
        ").",
    );
  }

  // Solo cambia el formato de registro de Morgan: "combined" en produccion,
  // "dev" en cualquier otro caso. No cambia nada mas de la aplicacion.
  const formatoRegistro =
    entorno.NODE_ENV === "production" ? "combined" : "dev";

  return { puerto, formatoRegistro };
}

// URI de MongoDB. Solo la piden los programas de scripts/, por eso el sitio
// arranca aunque MONGODB_URI no exista.
function leerUriMongo(entorno = process.env) {
  const uri = entorno.MONGODB_URI?.trim();

  if (!uri) {
    throw errorDeConfiguracion("Falta MONGODB_URI en el entorno.");
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    throw errorDeConfiguracion(
      "MONGODB_URI tiene que empezar con mongodb:// o mongodb+srv://.",
    );
  }

  return uri;
}

// Error con nombre propio para distinguir "falta configurar" de un problema
// de red o de acceso. El mensaje es nuestro: nunca incluye la URI.
function errorDeConfiguracion(mensaje) {
  const error = new Error(mensaje);
  error.name = "ErrorDeConfiguracion";
  return error;
}

module.exports = { leerConfiguracion, leerUriMongo };
