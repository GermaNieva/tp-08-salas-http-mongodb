# Trabajo práctico 08

Endpoints persistentes de reservas de salas: el sitio HTML y una API JSON
leen y escriben en MongoDB Atlas.

## Origen de la copia

`tp-08-salas-http-mongodb` es una copia de mi TP 07
(`tp-07-salas-mongodb`), copiada sin `.git`, `node_modules`, `.env` ni la
captura del TP anterior. El TP 07 quedó intacto en su carpeta y su
repositorio.

Antes de cambiar nada ejecuté la matriz HTTP del sitio (todavía en memoria)
sobre la copia y dio igual que en el TP 06/07. La conexión con la base nueva
también funcionó: `Conexión con MongoDB establecida.`.

Los commits siguen los pasos de la clase:

| Commit | Qué se hizo |
| ------ | ----------- |
| Paso 1 | Copia del TP 07 y base `reservas_salas_u8` en la plantilla |
| Paso 2 | Campo `estado` con default en el modelo y servicio asíncrono `reservas-mongo.js` |
| Paso 3 | Sitio conectado a MongoDB: arranque con una sola conexión, controlador async, validación de tipos y middleware de errores |
| Paso 4 | Router de la API, simulación de fallo 500, cierre ordenado y `/estado` con errores en JSON |
| README | Este documento, colección de Postman y evidencia |

## Versiones y Atlas

| Herramienta | Versión |
| ----------- | ------- |
| Node.js | 24.11.1 |
| npm | 11.6.2 |
| Express | 5.2.1 |
| Mongoose | 9.10.3 |
| EJS / express-ejs-layouts | 6.0.1 / 2.5.1 |
| Morgan | 1.12.1 |
| Prettier / ESLint | 3.9.10 / 10.13.0 |

La base de datos es **MongoDB Atlas Free (M0)**, el mismo clúster del TP 07,
con una base nueva para esta unidad:

| Base | Colección |
| ---- | --------- |
| `reservas_salas_u8` | `reservas` |

La base del TP 07 (`reservas_salas_u7`) no se borró ni se migró.

### Preparar Atlas desde cero

1. En [Atlas](https://cloud.mongodb.com), crear un clúster **Free / M0**, o
   reutilizar el que ya existe (se admite uno por proyecto).
2. **Database Access:** crear un usuario de base con contraseña y permiso de
   lectura y escritura. No es la cuenta del panel.
3. **Network Access:** agregar la IP actual (*Add My Current IP Address*) y
   esperar a que figure como activa.
4. **Connect → Drivers → Node.js:** copiar la cadena, poner la contraseña y
   escribir `reservas_salas_u8` entre el host y el `?`.

La base aparece sola con la primera escritura.

## Entorno, DNS y comando de inicio

```
npm install
cp .env.example .env      # en PowerShell: Copy-Item .env.example .env
```

En `.env`, y solo ahí, reemplazar `USUARIO`, `CLAVE` y `HOST` por los datos
reales:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u8?retryWrites=true&w=majority
```

Con los marcadores de la plantilla **no se puede conectar**: `HOST` no es un
servidor real.

**Iniciar el servidor:**

```
npm run start:local
```

(es lo mismo que `node --env-file=.env src/index.js`). El servidor se
detiene con **Ctrl + C**.

`npm start` solo funciona si la terminal ya tiene `MONGODB_URI` definida. Sin
eso, avisa `Falta MONGODB_URI en el entorno.` y no abre el puerto.

**DNS:** se mantiene en `src/config/base-datos.js` la corrección de clase,
`dns.setServers(["8.8.8.8", "1.1.1.1"])`. Se ejecuta una sola vez, al cargar
el módulo, y no en cada solicitud. En mi red (Windows 11, conexión hogareña)
la conexión también funciona sin esa línea (lo probé en el TP 07), así que no
hubo que hacer ningún ajuste.

Otros comandos:

| Para... | Comando |
| ------- | ------- |
| Probar la conexión | `node --env-file=.env scripts/comprobar-conexion.js` |
| Simular un fallo 500 (no conecta) | `node scripts/simular-fallo-servicio.js` |
| Formatear / revisar | `npm run format` / `npm run check` |

Los programas del TP 07 (`crear-reserva.js` y `listar-reservas.js`) siguen
funcionando y usan la base que indique la URI. No los importa el servidor.

## Estructura por capas

```
src/
  index.js                  lee entorno, ESPERA la conexión, después escucha; cierre ordenado
  app.js                    vistas, pipeline, routers, 404 y middleware de errores
  config/
    entorno.js              PORT, NODE_ENV y MONGODB_URI (sin cambios)
    base-datos.js           DNS, conectar, desconectar, describir errores (sin cambios)
  modelos/
    reserva.js              esquema: agrega estado con default "pendiente"
  servicios/
    reservas-mongo.js       NUEVO: listar, obtenerPorId, contar, crear (async)
    reservas.js             referencia del servicio en memoria: YA NO SE IMPORTA
  controladores/
    reservas.js             async: espera al servicio y responde HTML o JSON
  rutas/
    reservas.js             router HTML (/reservas)
    reservas-api.js         NUEVO: router API (/api/reservas)
  middleware/
    solicitudes.js          ID BIB- y medición (sin cambios)
    reservas.js             sección y validación de entrada (HTML y API)
    errores.js              NUEVO: 400 / 500 sin trazas ni secretos
scripts/                    laboratorio del TP 07 + simular-fallo-servicio.js
views/, public/             sin cambios
docs/                       colección de Postman y capturas
```

```
Solicitud -> app.js (pipeline) -> router HTML o API -> validarReserva (solo POST)
          -> controlador (await) -> servicio (await) -> modelo -> MongoDB Atlas
                                  <- objeto con id en texto <-
          -> render / redirect 302 / json 201 / 404
   si algo falla: -> middleware de errores -> 400 o 500
```

- **El modelo** valida y persiste.
- **El servicio** hace las operaciones y devuelve objetos simples con `id` en
  texto. No conoce Express ni elige códigos HTTP.
- **El controlador** espera al servicio y decide la respuesta.
- **Los routers** asocian método y dirección.

El HTML y la API usan **el mismo controlador y la misma instancia del
servicio**, por eso ven los mismos documentos.

### Qué dejó de importarse

`src/index.js` ya no importa `servicios/reservas.js` (el arreglo en memoria)
ni tiene la semilla de cuatro reservas. El archivo del servicio en memoria
queda en el repositorio solo como referencia, pero nadie lo importa (lo
comprobé con `grep`). Así no hay dos fuentes activas de reservas. Al arrancar
no se insertan datos y al listar no se carga ninguna semilla.

### Arranque, conexión y cierre

1. `leerConfiguracion()`: si `PORT` es inválido, termina con un mensaje.
2. `await conectarBaseDatos()`: si falla (URI ausente, DNS, contraseña, IP),
   salta al `catch`, muestra el diagnóstico sin la URI y **el puerto nunca se
   abre**.
3. `app.listen(...)`: recién ahí aparece `Servidor andando en ...`.

El servidor mantiene **una sola conexión** mientras está encendido, a
diferencia de los scripts, que conectan y cierran.

En Express 5 el callback de `listen` también se ejecuta cuando `listen`
falla, con el error como argumento. Por eso adentro se revisa `error`: con el
puerto ocupado, el programa muestra
`No se pudo escuchar el puerto 3000: EADDRINUSE`, cierra la conexión y
termina, en vez de decir que está disponible.

Con **SIGINT** (Ctrl + C) o **SIGTERM**, `servidor.close()` deja de aceptar
conexiones, espera las solicitudes en curso y recién después cierra MongoDB.

## Endpoints

| Método y dirección | Resultado |
| ------------------ | --------- |
| `GET /api/reservas` | 200 y arreglo (vacío es válido) |
| `GET /api/reservas?sala=Sala%20Norte` | 200 y solo las de esa sala (igualdad exacta) |
| `GET /api/reservas/:id` | 200 y la reserva; 400 si el id está mal formado; 404 si no existe |
| `POST /api/reservas` | 201, la reserva guardada y cabecera `Location`; 400 si es inválida |
| `GET /`, `GET /estado` | Inicio y JSON de estado; el conteo sale de MongoDB |
| `GET /reservas`, `GET /reservas/nueva`, `GET /reservas/:id` | Sitio HTML: listado, formulario y detalle |
| `POST /reservas` | Formulario: 302 a `/reservas` después de guardar; 400 si es inválido |
| Otra dirección | 404 HTML; bajo `/api/` es 404 JSON |

No hay PUT, PATCH ni DELETE. Este servidor no está pensado para publicarse
en Internet: todavía no tiene autenticación ni protecciones.

### Representación JSON

```json
{
  "id": "6ae295b8b704934978e16d39",
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-21",
  "turno": "Mañana",
  "personas": 2,
  "estado": "pendiente"
}
```

`id` es el `_id` (ObjectId) pasado a texto. La API no expone `_id` ni `__v`.
En MongoDB el `_id` sigue siendo un ObjectId. Ya no se aplica `Number` al
parámetro, porque `Number("6ae2...")` da `NaN`.

Errores:

```json
{ "error": "El email tiene que tener una arroba.", "campos": ["email"] }
{ "error": "El identificador tiene que tener 24 caracteres hexadecimales.", "campos": [] }
{ "error": "Reserva no encontrada." }
{ "error": "No se pudo completar la operación. Probá de nuevo más tarde.", "campos": [] }
```

## Modelo y entrada admitida

| Campo | Regla |
| ----- | ----- |
| `estudiante` | String obligatorio, `trim` |
| `email` | String obligatorio, `trim`, `match: /@/` |
| `sala` | String obligatorio, `enum` Sala Norte / Sala Sur / Sala Multimedia |
| `fecha` | String obligatorio, `trim` |
| `turno` | String obligatorio, `enum` Mañana / Tarde / Noche |
| `personas` | Number obligatorio, `min: 1`, `max: 6`, `validate: Number.isInteger` |
| `estado` | String, `enum` pendiente / confirmada, **default `"pendiente"`** |

`estado` lo pone el servidor: el cliente no lo puede asignar al crear, y esta
API no tiene forma de confirmar una reserva. El default no es autenticación
ni autorización, y no modifica documentos viejos.

La validación ocurre en **dos lugares**:

1. **`validarReserva`** (middleware), antes del controlador, para el
   formulario y para la API:
   - Los textos tienen que llegar como **texto**. Un número, un booleano, un
     arreglo o un objeto en `estudiante`, `email`, `sala`, `fecha` o `turno`
     cuenta como vacío.
   - `personas` puede llegar como número (JSON) o como texto no vacío
     (formulario). `true`, `[3]` o `{"n":3}` se rechazan, aunque `Number()`
     los convertiría en `1` o `3`.
   - Se arma `req.reservaValidada` copiando **solo los seis campos**.
2. **El esquema de Mongoose**, que sigue validando todo al crear. Si algo
   pasara el middleware, el `ValidationError` lo traduce el middleware de
   errores a 400.

Además, el servicio copia otra vez los seis campos uno por uno, y nunca pasa
`req.body` entero a Mongoose. Por eso un `estado` o un `_id` mandados por el
cliente se ignoran.

**Filtro:** el servicio arma el criterio a mano, `{ sala: "..." }`, y nunca
usa `req.query` entero. Si `sala` llega repetida (arreglo) o vacía, responde
400. Con el parser de consultas de Express 5, `?sala[$ne]=x` llega como una
clave literal `"sala[$ne]"` y no como un operador, así que se ignora.

**Límites que todavía no se controlan:**
- que el email sea válido de verdad;
- que la fecha sea real o futura;
- que dos reservas se superpongan;
- el cupo de una sala;
- los duplicados: enviar dos veces el mismo POST crea dos reservas.

No hay índice único.

## Matriz de resultados

Probé la API con un script que usa `fetch` de Node como cliente HTTP, y el
formulario con `curl`, contra Atlas, base `reservas_salas_u8`. Después de
cada rechazo conté las reservas con `GET /api/reservas`.

| Caso | Esperado | Observado | Cantidad |
| ---- | -------- | --------- | -------- |
| Listado con la base nueva | 200, `[]` | `/estado` → `"reservas":0`; `/reservas` → "Todavía no hay ninguna sala reservada" | 0 |
| Formulario inválido (email sin @) | 400 | 400, "El email tiene que tener una arroba.", conserva `value="Tomás Paz"` | 0 → 0 |
| Formulario sin cuerpo / `text/plain` | 400 | 400, "Hay que completar todos los campos." | 0 → 0 |
| Formulario `personas=true` | 400 | 400, mensaje de personas | 0 → 0 |
| Formulario válido | 302 | 302 → `/reservas`; aparece Tomás Paz | 0 → 1 |
| Detalle HTML del creado | 200 | 200, "Reserva número 6ae29578f2687983a6e3ae21" | - |
| `GET /reservas/1` (HTML) | 400 | 400, "Solicitud inválida" | - |
| `GET /reservas/000…0` (HTML) | 404 | 404, "Reserva no encontrada" | - |
| `POST /api/reservas` válido | 201 + Location | 201, `Location: /api/reservas/6ae295b8b704934978e16d39`, `estado: "pendiente"` | 1 → 2 |
| GET a la Location | 200, mismo recurso | 200, mismo `id` y campos, sin `_id`/`__v` | - |
| `GET /api/reservas/1` | 400 | 400 JSON | - |
| `GET /api/reservas/no-es-un-id` | 400 | 400 JSON | - |
| `GET /api/reservas/000000000000000000000000` | 404 | 404 `{"error":"Reserva no encontrada."}` | - |
| `?sala=Sala%20Norte` | Solo coincidencias | 200, 2 resultados, todos Sala Norte | - |
| `?sala=Sala%20Sur` (en ese momento no había) | `[]` | 200, `[]` | - |
| `?sala=sala%20norte` (minúsculas) | Igualdad exacta | 200, `[]` | - |
| `?sala=Sala%20Norte&sala=Sala%20Sur` | 400 | 400 "El filtro sala tiene que ser un solo texto." | - |
| `?sala=` (vacía) | 400 | 400 | - |
| `?sala[$ne]=x` | Sin operadores | 200, mismo resultado que sin filtro | - |
| Estudiante vacío | 400 | 400, campos `["estudiante"]` | 2 → 2 |
| Email sin @ | 400 | 400, campos `["email"]` | 2 → 2 |
| Sala no permitida | 400 | 400, campos `["sala"]` | 2 → 2 |
| Turno no permitido | 400 | 400, campos `["turno"]` | 2 → 2 |
| Fecha vacía (`"   "`) | 400 | 400, campos `["fecha"]` | 2 → 2 |
| Personas 0 / 7 / 2.5 / `"abc"` | 400 | 400 cada uno, campos `["personas"]` | 2 → 2 |
| Personas `true` / `[3]` / `{"n":3}` | 400 | 400 cada uno, campos `["personas"]` | 2 → 2 |
| Estudiante `123` / `["Ana"]` | 400 | 400, campos `["estudiante"]` | 2 → 2 |
| POST sin cuerpo | 400 JSON | 400, los seis campos en `campos` | 2 → 2 |
| POST `text/plain` | 400 JSON | 400 | 2 → 2 |
| JSON mal formado | 400 JSON | 400 `{"error":"El cuerpo no es un JSON válido."}` | 2 → 2 |
| Campos extra `estado: "confirmada"` y `_id` | El cliente no los asigna | 201 con `id` propio (`6ae295bbb704934978e16d3a`) y `estado: "pendiente"` | 2 → 3 |
| Listar dos veces | Estable | 3 y 3 | 3 |
| `/estado` | Conteo de MongoDB | `{"servicio":"activo","reservas":3,...}` | 3 |
| CSS / inicio / ruta inexistente | 200 / 200 / 404 | 200 `text/css` / 200 / 404 HTML; `/api/no-existe` → 404 JSON | - |
| Fallo inesperado (simulado) | 500 sin traza | 500 en API, HTML y `/estado`; el mensaje no publica la URI (ver abajo) | - |
| Arranque con URI ausente | No abre el puerto | `ErrorDeConfiguracion: Falta MONGODB_URI`, salida 1, puerto cerrado | - |
| Arranque con HOST falso | No abre el puerto | `ENOTFOUND` / `querySrv`, salida 1, puerto cerrado | - |
| Arranque con el puerto ocupado | No anuncia disponible | `No se pudo escuchar el puerto 3000: EADDRINUSE`, salida 1 | - |
| Cierre con SIGINT | Cierre ordenado | `Recibí SIGINT: cerrando el servidor...` → `Servidor detenido y conexión con MongoDB cerrada.`, salida 0 | - |

### Fallo inesperado (simulación controlada)

`scripts/simular-fallo-servicio.js` arma la aplicación real con un servicio
**falso** que siempre falla. El error trae una URI inventada con la palabra
"secreto", como si la base dejara de responder. No conecta a Atlas ni toca a
ningún usuario.

```
GET  /api/reservas                          -> 500 | {"error":"No se pudo completar la operación. Probá de nuevo más tarde.","campos":[]} | ¿publica secretos o traza?: no
GET  /api/reservas/000000000000000000000000 -> 500 | (mismo JSON) | no
POST /api/reservas                          -> 500 | (mismo JSON) | no
GET  /reservas                              -> 500 | (HTML) Error del servicio | no
GET  /estado                                -> 500 | (mismo JSON) | no
Resultado: todas las respuestas son 500 y no publican la URI.
```

En la terminal del servidor solo queda
`Solicitud fallida: BIB-0001 MongooseServerSelectionError`: el ID, el tipo y
un código, nunca el mensaje completo.

El cierre con SIGINT lo probé emitiendo la señal dentro del mismo proceso
(`process.emit("SIGINT")`). En Windows no se le puede mandar un SIGINT real a
otro proceso desde la terminal. Con **Ctrl + C** en la terminal donde corre
el servidor aparecen los mismos dos mensajes.

## Prueba de reinicio

1. `GET /api/reservas`: cantidad inicial **1** (la del formulario).
2. `POST /api/reservas`: 201, `id` **`6ae295b8b704934978e16d39`**,
   `Location: /api/reservas/6ae295b8b704934978e16d39`.
3. GET a la Location: 200, mismo id, `estado: "pendiente"`.
4. Detuve el servidor y lo volví a iniciar con `node --env-file=.env src/index.js`.
5. **Sin repetir el POST**:
   - `GET /api/reservas/6ae295b8b704934978e16d39` → **200**, la misma
     reserva (Ana Ejemplo, Sala Norte, Mañana, 2, pendiente);
   - `GET /reservas/6ae295b8b704934978e16d39` (sitio) → **200**.
6. Listado dos veces después del reinicio: **3 y 3** (Tomás Paz desde el
   formulario, Ana Ejemplo y Bruno Ejemplo desde la API).

Con el TP 07, al reiniciar el sitio volvía a sus 4 reservas de la semilla.
Ahora no: los datos están en Atlas, no en el proceso de Node.

## Cómo reproducir las solicitudes en Postman

Importar `docs/tp08-reservas.postman_collection.json` en Postman de escritorio
(*Import*). La variable de colección `base` vale `http://localhost:3000`. El
POST válido guarda el `id` recibido en la variable `id`. Antes de enviar,
iniciar el servidor con `npm run start:local`.

| Solicitud | Método y URL | Body | Cabecera | Esperado |
| --------- | ------------ | ---- | -------- | -------- |
| Listado | `GET {{base}}/api/reservas` | none | - | 200 y arreglo |
| Crear | `POST {{base}}/api/reservas` | raw / JSON (ver abajo) | `Content-Type: application/json` | 201, cuerpo con `id` y `estado: "pendiente"`, `Location` en los Headers de la **respuesta** |
| Ver la creada | `GET {{base}}/api/reservas/{{id}}` | none | - | 200, mismo id |
| ID inválido | `GET {{base}}/api/reservas/1` | none | - | 400 JSON |
| ID inexistente | `GET {{base}}/api/reservas/000000000000000000000000` | none | - | 404 JSON |
| Filtro | `GET {{base}}/api/reservas` con Params `sala = Sala Norte` | none | - | 200, solo Sala Norte |
| Filtro repetido | dos filas `sala` activas con valores distintos | none | - | 400 |
| Inválidas | `POST`, cambiando un campo por vez | raw / JSON | `Content-Type: application/json` | 400; después volver al listado y comparar la cantidad |
| Sin cuerpo | `POST` | **none** | - | 400 |
| JSON roto | `POST` | raw: `{"estudiante": "Ana", ` | `Content-Type: application/json` | 400 |

Cuerpo de referencia (datos ficticios; no enviar `estado` ni `_id`):

```json
{
  "estudiante": "Ana Ejemplo",
  "email": "ana@example.com",
  "sala": "Sala Norte",
  "fecha": "2026-10-21",
  "turno": "Mañana",
  "personas": 2
}
```

Cada POST válido crea **otra** reserva. Para demostrar la persistencia no
hay que repetirlo: se reinicia el servidor y se repite el **GET** con el
mismo id.

### Evidencias

| Evidencia | Dónde |
| --------- | ----- |
| Matriz completa de la API y el formulario | Tabla de arriba (registro de terminal) |
| Postman: POST 201 con Location | `docs/postman-post-201.png` (**pendiente**) |
| Postman: GET de la Location | `docs/postman-get-location.png` (**pendiente**) |
| Postman: GET del mismo id después de reiniciar | `docs/postman-get-reinicio.png` (**pendiente**) |
| Postman: un 400 y el 404 | `docs/postman-400-404.png` (**pendiente**) |
| Data Explorer: `reservas_salas_u8` / `reservas` con el `_id` | `docs/data-explorer.png` (**pendiente**) |

## Comparación con el TP 07

| | TP 07 | TP 08 |
| - | ----- | ----- |
| Sitio | Arreglo en memoria, 4 reservas de semilla | MongoDB: lee y escribe en Atlas |
| MongoDB | Solo desde los scripts de terminal | Sitio, API y scripts |
| Servicio | Sincrónico (`listar()` devolvía un arreglo) | Asíncrono (`await servicio.listar()`) |
| Identificador | Número consecutivo (el más alto + 1) | ObjectId, expuesto como `id` en texto |
| Detalle | `Number(req.params.id)` | El texto tal cual; formato inválido → 400 |
| Conexión | Los scripts conectan y cierran | El servidor conecta una vez, antes de escuchar, y cierra con SIGINT/SIGTERM |
| API JSON | No había | `/api/reservas` con listado, detalle, filtro y alta |
| Errores | 400/404 a mano | Además, middleware de errores con 400/500 sin trazas |
| Estado | No existía | `estado` con default `"pendiente"` |
| Al reiniciar | Las reservas nuevas desaparecían | Se recuperan las mismas |

## Qué no se publica

- `.env` está en `.gitignore`. Solo se sube `.env.example`, con marcadores.
- Ni el servidor ni los scripts imprimen la URI. Los errores muestran tipo y
  código, nunca el mensaje del driver.
- La colección de Postman no tiene credenciales: solo `localhost` y datos
  ficticios.
- No se sube `node_modules/`, y sí `package-lock.json`.
