# Trabajo práctico 07

Persistencia inicial de reservas de salas con MongoDB Atlas y Mongoose.

## 1. Punto de partida

Este proyecto, `tp-07-salas-mongodb`, es una copia de mi TP 06
(`tp-06-salas-modular`), copiada sin `node_modules`, `.git` ni `.env`. El
TP 06 quedó intacto en su carpeta y en su repositorio.

Antes de cambiar nada ejecuté la matriz HTTP del TP 06 sobre la copia y dio
exactamente lo mismo, así que no hizo falta reparar nada.

A la copia le agregué un **laboratorio de persistencia**: configuración,
conexión, un modelo y programas de terminal para crear y listar reservas en
MongoDB. El sitio web no cambió: sigue trabajando en memoria (ver la sección
8).

El historial de commits sigue los pasos de la clase:

| Commit | Qué se hizo |
| ------ | ----------- |
| Paso 1 | Copia del TP 06 e instalación de Mongoose |
| Paso 2 | `config/entorno.js`, `config/base-datos.js` y `scripts/comprobar-conexion.js` |
| Paso 3 | Esquema y modelo `Reserva`, y `scripts/validar-reserva.js` (sin conexión) |
| Paso 4 | `scripts/crear-reserva.js` |
| Paso 5 | `scripts/listar-reservas.js` |
| README y evidencia | Este documento |

## 2. Versiones y entorno

| Herramienta | Versión |
| ----------- | ------- |
| Node.js | 24.11.1 |
| npm | 11.6.2 |
| Mongoose | 9.10.3 (exacta, `--save-exact`, como en el apunte) |
| Express | 5.2.1 |
| EJS | 6.0.1 |
| express-ejs-layouts | 2.5.1 |
| Morgan | 1.12.1 |
| Prettier / ESLint | 3.9.10 / 10.13.0 |

La base de datos está en **MongoDB Atlas, clúster gratuito Free (M0)**. Es el
mismo clúster de las clases, con una base propia para este TP:

| Base | Colección |
| ---- | --------- |
| `reservas_salas_u7` | `reservas` |

No instalé MongoDB localmente. No hace falta `dotenv`, porque las variables se
cargan con la opción `--env-file` de Node.

## 3. Pasos desde una descarga nueva

### 3.1 Dependencias

```
npm install
```

### 3.2 Preparar Atlas (una sola vez)

1. Entrar a [MongoDB Atlas](https://cloud.mongodb.com) y crear o elegir un
   proyecto de estudio.
2. **Clúster gratuito:** crear un clúster eligiendo **Free / M0** (no Flex ni
   Dedicated), con cualquier proveedor y región disponibles. Si el proyecto ya
   tiene uno Free, se reutiliza: se admite uno por proyecto.
3. **Usuario de base de datos** (Database Access): crear un usuario con
   contraseña y permiso de **lectura y escritura**. No es la cuenta con la que
   se entra al panel de Atlas: es el usuario que usa Node.
4. **IP permitida** (Network Access / IP Access List): agregar la IP pública
   actual con *Add My Current IP Address* y esperar a que la regla figure como
   activa. No abrir el acceso a cualquier dirección. Si cambiás de red, puede
   que tengas que volver a agregarla.
5. **URI para Node.js:** en el clúster, *Connect → Drivers → Node.js*, copiar
   la cadena de conexión. Reemplazar usuario y contraseña, y escribir
   `reservas_salas_u7` como nombre de base entre el host y el `?`. Conservar
   las opciones que trae Atlas. Si la contraseña tiene caracteres reservados,
   se codifican solo en esa parte (por ejemplo, `@` se escribe `%40`).

La base y la colección no se crean a mano: aparecen con la primera escritura.

### 3.3 Archivo de entorno

```
cp .env.example .env
```

(en PowerShell: `Copy-Item .env.example .env`)

En `.env`, y **solo ahí**, reemplazar `USUARIO`, `CLAVE` y `HOST` por los
datos reales:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://USUARIO:CLAVE@HOST/reservas_salas_u7?retryWrites=true&w=majority
```

Si la terminal ya tiene definida una variable `MONGODB_URI`, Node le da
prioridad sobre el archivo.

### 3.4 Comandos

Todos se ejecutan desde la raíz del proyecto:

| Para... | Comando |
| ------- | ------- |
| Probar la conexión (no escribe) | `node --env-file=.env scripts/comprobar-conexion.js` |
| Probar las reglas del modelo (no conecta) | `node scripts/validar-reserva.js` |
| Crear una reserva | `node --env-file=.env scripts/crear-reserva.js` |
| Listar las reservas guardadas | `node --env-file=.env scripts/listar-reservas.js` |
| Formatear | `npm run format` |
| Revisar formato y ESLint | `npm run check` |
| Sitio web (no necesita `.env`) | `npm start` |
| Sitio web con `.env` | `npm run start:local` |

El sitio se detiene con **Ctrl + C**. Los programas de `scripts/` terminan solos.

## 4. DNS y conexión

`src/config/base-datos.js` tiene la corrección que se usó en clase, antes de
conectar:

```js
dns.setServers(["8.8.8.8", "1.1.1.1"]);
```

Con una URI `mongodb+srv://`, el driver primero consulta al DNS los registros
**SRV** (qué servidores forman el clúster) y **TXT** (opciones de conexión).
Esta línea hace que esas consultas, **solo las de este proceso de Node**,
usen los DNS públicos 8.8.8.8 y 1.1.1.1. No cambia el DNS de Windows, ni el
del navegador, ni la autenticación, ni la lista de IPs de Atlas. Está en un
solo archivo: no se repite en los scripts ni en el modelo.

Cuando la conexión falla, los programas muestran **el tipo de error, el código
DNS si es uno conocido y la operación de resolución**, y nunca la URI ni el
mensaje completo del driver. Así se puede distinguir:

| Lo que aparece | Qué significa | Qué revisar |
| -------------- | ------------- | ----------- |
| `ErrorDeConfiguracion` | Falta `MONGODB_URI` o no empieza con `mongodb://` / `mongodb+srv://` | El archivo `.env` |
| `Código DNS/red: ENOTFOUND` + `Consulta DNS: querySrv` | El nombre del clúster no se pudo resolver | El HOST copiado de Atlas y el DNS |
| `MongoServerError` + "Atlas rechazó el usuario o la contraseña" | Autenticación rechazada | Usuario y contraseña de la base |
| `MongooseServerSelectionError` | No se llegó a ningún servidor en 5 s | IP permitida, clúster activo, Internet |

Probado sin Atlas, con la plantilla `.env.example`, que tiene un HOST que no
existe:

```
$ node --env-file=.env.example scripts/comprobar-conexion.js
No se pudo completar la conexión.
  Tipo de error: Error
  Código DNS/red: ENOTFOUND
  Consulta DNS: querySrv
  Revisar que el HOST de la URI sea el real copiado de Atlas.
  Revisar MONGODB_URI, servidor, red y permisos.
```

**Resultado con Atlas en mi red (Windows 11, conexión hogareña):** con la
corrección de DNS la conexión funcionó a la primera
(`Conexión con MongoDB establecida.`) y **no hubo ningún fallo DNS** con el
host real. Para saber si la línea era necesaria, hice además una prueba
aparte sin `dns.setServers`, con el DNS predeterminado de la red. También
conectó. O sea, en esta red la corrección no es imprescindible, pero la dejé
porque es la conexión acordada en clase y no molesta. No probé otras redes,
así que no afirmo que funcione en todas.

## 5. Mapa de archivos, esquema, modelo y colección

```
tp-07-salas-mongodb/
  public/, views/              (sin cambios)
  src/
    index.js                   (solo cambió la importación: ./config/entorno)
    app.js                     (sin cambios)
    config/
      entorno.js               (PORT, NODE_ENV y MONGODB_URI)
      base-datos.js            (DNS, conectar, desconectar, describir errores)
    modelos/
      reserva.js               (nuevo: esquema y modelo Reserva)
    rutas/, controladores/     (sin cambios)
    servicios/                 (sin cambios: el sitio sigue en memoria)
    middleware/                (sin cambios)
  scripts/
    comprobar-conexion.js      (conecta y cierra, no escribe)
    validar-reserva.js         (valida con el modelo, no conecta)
    crear-reserva.js           (crea una reserva por ejecución)
    listar-reservas.js         (solo lee)
  .env                         (local, NO se sube)
  .env.example                 (plantilla con marcadores, sí se sube)
  .gitignore                   (node_modules/ y .env)
  eslint.config.js             (revisa src y scripts)
  package.json, package-lock.json
```

`src/configuracion.js` del TP 06 se eliminó **después** de pasar su función a
`src/config/entorno.js` y de cambiar la importación en `src/index.js`, que era
la única. La función es la misma.

`leerConfiguracion` (puerto y Morgan) la usa el sitio. `leerUriMongo` la usan
solamente los programas, a través de `base-datos.js`. Por eso `npm start`
arranca aunque no exista `MONGODB_URI`.

Los programas importan `../src/config/base-datos` y `../src/modelos/reserva`.
`base-datos.js` importa `./entorno`.

**Tres cosas distintas:**

- **Esquema** (`reservaSchema`): el contrato. Dice qué campos tiene una
  reserva, de qué tipo son y qué reglas cumplen. Funciona del lado de nuestra
  aplicación. No configura reglas en el servidor de MongoDB para otros
  programas que escriban en la misma base.
- **Modelo** (`Reserva`): lo que se arma con `mongoose.model("Reserva",
  reservaSchema)`. Ofrece las operaciones (`create`, `find`, `validate`
  sobre un documento) y aplica el esquema.
- **Colección** (`reservas`): donde MongoDB guarda los documentos. Está
  declarada a mano con `{ collection: "reservas" }`, para no depender de cómo
  Mongoose arma el plural.

Importar el modelo no conecta ni guarda nada.

### El `_id`

Cada documento tiene un `_id` de tipo **ObjectId**, que se muestra como 24
caracteres hexadecimales. Ya no se calcula un id consecutivo con
`reduce` / "el más alto + 1". El `_id` se pasa a texto con `toString()` solo
para mostrarlo.

**Que un objeto tenga `_id` no demuestra que se guardó.** Mongoose lo genera
en memoria apenas se construye el documento, antes de hablar con la base.
`scripts/validar-reserva.js` lo muestra: imprime un `_id` sin haberse
conectado nunca. La prueba de que se guardó es otra ejecución, en otro
proceso, que lo encuentre al consultar la base.

## 6. Campos y reglas

| Campo | Tipo | Reglas en el esquema |
| ----- | ---- | -------------------- |
| `estudiante` | String | `required`, `trim` |
| `email` | String | `required`, `trim`, `match: /@/` |
| `sala` | String | `required`, `enum`: Sala Norte, Sala Sur, Sala Multimedia |
| `fecha` | String | `required`, `trim` (vacío o solo espacios se rechaza) |
| `turno` | String | `required`, `enum`: Mañana, Tarde, Noche |
| `personas` | Number | `required`, `min: 1`, `max: 6`, `validate` con `Number.isInteger` |

Las listas de salas y turnos se importan de `src/middleware/reservas.js`, así
el formulario del sitio y el modelo usan exactamente las mismas.

`validate: { validator: Number.isInteger }` recibe la función sin llamarla.
Mongoose la ejecuta sobre el valor ya convertido: `2.5` está dentro del rango
1-6, pero no es entero, y por eso se rechaza.

**Conversión no es validación:** Mongoose convierte `"4"` (texto numérico) a
`4` y lo acepta. `"tres"` no se puede convertir y falla con un `CastError`
antes de llegar a las reglas.

Reglas comprobadas sin conexión, con el modelo y `validate()`:

| Caso | Resultado |
| ---- | --------- |
| Datos válidos | Acepta (`Datos válidos; todavía no se guardó nada`) |
| Estudiante `""` o `"   "` | `ValidationError` en `estudiante`: "El nombre del estudiante es obligatorio." |
| Email sin `@` | `ValidationError` en `email`: "El email tiene que tener una arroba." |
| Sala `Sala Este` | `ValidationError` en `sala`: "La sala Sala Este no está permitida." |
| Turno `Madrugada` | `ValidationError` en `turno`: "El turno Madrugada no está permitido." |
| Fecha `"  "` | `ValidationError` en `fecha`: "La fecha es obligatoria." |
| Personas 0 / 7 | `ValidationError` en `personas`: mínimo 1 / máximo 6 |
| Personas 2.5 | `ValidationError` en `personas`: "...tiene que ser un número entero." |
| Personas `"abc"` | `ValidationError` con un `CastError` en `personas` (no se pudo convertir) |
| Personas `"4"` | Acepta y lo guarda como número 4 |
| Estudiante `"  Valentina Ríos  "` | Acepta y lo recorta a `"Valentina Ríos"` |

**Lo que todavía no se controla:**
- que el email sea válido de verdad (solo se pide una `@`);
- que la fecha sea una fecha real o futura (es texto);
- que dos reservas se superpongan en la misma sala, fecha y turno;
- el cupo total de una sala;
- las reservas repetidas: correr `crear-reserva.js` dos veces crea **dos
  documentos distintos**, con distinto `_id`, aunque tengan los mismos campos.
  No hay índice único. Lo dejo así a propósito y no borro los repetidos.

## 7. Matriz de pruebas y evidencia de persistencia

Todo se ejecutó contra Atlas Free, base `reservas_salas_u7`, colección
`reservas`, con `node --env-file=.env scripts/...`. Para los casos inválidos
cambié en `crear-reserva.js` **un solo campo por vez**, lo ejecuté, volví a
listar y lo restauré con `git checkout` antes del siguiente. Al terminar,
`git status` no mostraba cambios en el programa, que quedó con el ejemplo
válido.

| Caso | Esperado | Observado | Cantidad antes → después |
| ---- | -------- | --------- | ------------------------ |
| Conexión válida | Confirmación y fin del proceso | `Conexión con MongoDB establecida.`, salida 0 | - |
| Fallo DNS | Registrar código/operación | **No ocurrió** con el host real (ver sección 4). Con el HOST falso de la plantilla: `ENOTFOUND` en `querySrv` | - |
| Variable vacía (`MONGODB_URI=`) | Fallo de configuración, sin éxito | `ErrorDeConfiguracion: Falta MONGODB_URI en el entorno.`, salida 1 | - |
| Contraseña incorrecta | Fallo de autenticación | `MongoServerError`, "Atlas rechazó el usuario o la contraseña de la base.", salida 1. Después la URI válida volvió a conectar | - (no se crea nada) |
| Colección vacía | Cantidad 0 sin error | `Reservas recuperadas: 0`, salida 0 (la base era nueva) | 0 |
| Reserva válida | Se guarda y devuelve `_id` | `Reserva guardada en MongoDB.` `_id: 6ae28fbd8a836f930da43af4` | 0 → 1 |
| Consulta desde proceso nuevo | Recupera ese `_id` | Aparece `6ae28fbd8a836f930da43af4`, Valentina Ríos, Sala Multimedia | 0 → 1 |
| Segunda consulta | No agrega registros | `Reservas recuperadas: 1` | 1 → 1 |
| Estudiante vacío (`""`) | Rechazo | `ValidationError`, campo `estudiante` (regla), salida 1 | 1 → 1 |
| Email sin @ | Rechazo | `ValidationError`, campo `email` (regla) | 1 → 1 |
| Sala no permitida (`Sala Este`) | Rechazo | `ValidationError`, campo `sala` (regla) | 1 → 1 |
| Turno no permitido (`Madrugada`) | Rechazo | `ValidationError`, campo `turno` (regla) | 1 → 1 |
| Fecha vacía (`"   "`) | Rechazo | `ValidationError`, campo `fecha` (regla) | 1 → 1 |
| Personas 0 | Rechazo | `ValidationError`, campo `personas` (regla) | 1 → 1 |
| Personas 7 | Rechazo | `ValidationError`, campo `personas` (regla) | 1 → 1 |
| Personas 2.5 | Rechazo | `ValidationError`, campo `personas` (regla) | 1 → 1 |
| Personas `"tres"` | Rechazo de conversión | `ValidationError`, campo `personas` (**no se pudo convertir**: `CastError`) | 1 → 1 |

Para la contraseña incorrecta no modifiqué el `.env` real. Hice una copia
temporal donde cambié solamente la contraseña por `claveIncorrecta123`, la
usé con `--env-file` y la borré. No cambié la contraseña del usuario en Atlas.
En ese momento la terminal no tenía `MONGODB_URI` definida, así que se usó el
archivo.

### Evidencia de persistencia entre procesos

Cada línea es un proceso de Node distinto, que termina antes de que empiece
el siguiente:

```
$ node --env-file=.env scripts/listar-reservas.js
Reservas recuperadas: 0

$ node --env-file=.env scripts/crear-reserva.js
Reserva guardada en MongoDB.
_id: 6ae28fbd8a836f930da43af4

$ node --env-file=.env scripts/listar-reservas.js
┌─────────┬────────────────────────────┬──────────────────┬───────────────────┬──────────────┬─────────┬──────────┐
│ (index) │ id                         │ estudiante       │ sala              │ fecha        │ turno   │ personas │
├─────────┼────────────────────────────┼──────────────────┼───────────────────┼──────────────┼─────────┼──────────┤
│ 0       │ '6ae28fbd8a836f930da43af4' │ 'Valentina Ríos' │ 'Sala Multimedia' │ '2026-11-09' │ 'Tarde' │ 3        │
└─────────┴────────────────────────────┴──────────────────┴───────────────────┴──────────────┴─────────┴──────────┘
Reservas recuperadas: 1

$ node --env-file=.env scripts/listar-reservas.js
Reservas recuperadas: 1
```

El proceso que creó la reserva ya había terminado cuando otro proceso la
encontró con el mismo `_id`. Eso es lo que demuestra que quedó guardada en
MongoDB y no en la memoria de Node. La segunda consulta no cambia la cantidad,
porque listar no escribe.

Captura de Data Explorer en Atlas, con la base `reservas_salas_u7`, la
colección `reservas` y el documento `6ae28fbd8a836f930da43af4`:

![Data Explorer con la reserva 6ae28fbd8a836f930da43af4](docs/data-explorer.png)

Solo se creó un documento. Si se corre `crear-reserva.js` otra vez, se crea
otro con distinto `_id` y los mismos datos (ver la sección 6).

### Continuidad del sitio

Con `npm start` (sin `.env`) repetí la matriz HTTP del TP 06 y dio
exactamente lo mismo:

| Comprobación | Resultado |
| ------------ | --------- |
| Inicio, `/estado` y listado | 200; `/estado` con 4 reservas y el ID `BIB-` |
| Formulario válido | 302 a `/reservas`, el listado pasa a 5 (en memoria) |
| Formulario inválido (vacío, sala, turno, email, personas 0/7/2.5) | 400, no crea |
| POST sin cuerpo / `text/plain` | 400, no crea |
| `GET /css/estilos.css` | 200 `text/css` |
| `GET /reservas/999` y URL inexistente | 404 HTML |

Las reservas del laboratorio no aparecen en el sitio, y está bien que no
aparezcan (ver la sección siguiente).

### Calidad

`npm run format` y `npm run check` revisan `src` y `scripts`. ESLint ahora
incluye `files: ["src/**/*.js", "scripts/**/*.js"]` con las mismas reglas del
TP 06. Resultado: `All matched files use Prettier code style!` y ESLint sin
problemas.

## 8. Por qué el sitio sigue en memoria

Hay **dos recorridos separados**, a propósito:

- El **sitio** (`npm start`) usa el servicio del TP 06: un arreglo en memoria
  que arranca con 4 reservas y se pierde al reiniciar.
- El **laboratorio** (`scripts/`) usa Mongoose: conecta, crea o lista
  documentos en Atlas y cierra.

No cambié el servicio del sitio porque no es un reemplazo directo. El servicio
actual es sincrónico: `listar()` devuelve un arreglo al instante. Una consulta a
MongoDB devuelve una **promesa**. Si hoy pusiera `Reserva.find()` adentro del
servicio, los controladores recibirían una promesa donde esperan un arreglo. El
detalle además convierte `req.params.id` con `Number`, y eso no sirve para un
`ObjectId`. También habría que abrir **una** conexión al arrancar el servidor
y no conectar y desconectar en cada pedido, como hacen los scripts.

Eso es lo que se aborda en la **unidad 8**: conectar las rutas con operaciones
asíncronas de MongoDB, con controladores que esperan las promesas e ids de
tipo ObjectId.

## 9. Qué no se publica

- `.env` está en `.gitignore` y no se subió nunca. Solo está en el
  repositorio `.env.example`, con los marcadores `USUARIO`, `CLAVE` y `HOST`.
- Ningún programa imprime la URI ni el mensaje completo del driver.
- No hay credenciales en el código, en el README ni en las capturas.
- Los datos de las reservas son ficticios.
- `node_modules/` no se sube; `package-lock.json` sí.
