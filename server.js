/**
 * This is the main server script that provides the API endpoints
 *
 * Uses sqlite.js to connect to db
 */

const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});


fastify.register(require("@fastify/formbody"));

const db = require("./sqlite.js");
const errorMessage =
  "Whoops! Error connecting to the database–please try again!";

// OnRoute hook to list endpoints
const routes = { endpoints: [] };
fastify.addHook("onRoute", (routeOptions) => {
  routes.endpoints.push(routeOptions.method + " " + routeOptions.path);
});

// Just send some info at the home route
fastify.get("/", (request, reply) => {
  const data = {
    title: "Hello SQLite (blank)",
    intro: "This is a database-backed API with the following endpoints",
    routes: routes.endpoints,
  };
  reply.status(200).send(data);
});

// Return the chat messages from the database helper script - no auth
fastify.get("/messages", async (request, reply) => {
  let data = {};
  data.chat = await db.getMessages();
  console.log(data.chat);
  if (!data.chat) data.error = errorMessage;
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

//Ruta para obtener todos los registros
fastify.get("/estadisticas", async (request, reply) => {
  let data = {};
  data.estadisticas = await db.getAllEstadisticas();
  if (!data.estadisticas) data.error = errorMessage;
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// Ruta para obtener una estadística por su ID (GET)
fastify.get("/estadisticas/:id", async (request, reply) => {
  let data = {};
  const id = request.params.id; // Obtener el ID de la URL
  const estadistica = await db.getEstadisticaById(id);

  if (estadistica) {
    data.success = true;
    data.estadistica = estadistica; // Agregar la estadística obtenida a la respuesta
  } else {
    data.success = false;
    data.error = "Estadística no encontrada.";
  }

  const status = estadistica ? 200 : 404;
  reply.status(status).send(data);
});

// Ruta para agregar una nueva estadística (POST)
fastify.post("/estadisticas", async (request, reply) => {
  let data = {};
  const estadistica = request.body; // Supongo que el cuerpo de la solicitud contiene los datos de la estadística
  const success = await db.insertEstadistica(estadistica);

  if (success) {
    data.success = true;
  } else {
    data.success = false;
    data.error = "Error al insertar la estadística.";
  }

  const status = success ? 201 : 400;
  reply.status(status).send(data);
});


// Ruta para actualizar una estadística existente por su ID (PUT)
fastify.put("/estadisticas/:id", async (request, reply) => {
  let data = {};
  const id = request.params.id; // Obtener el ID de la URL
  const newData = request.body; // Supongo que el cuerpo de la solicitud contiene los nuevos datos a actualizar
  const success = await db.updateEstadistica(id, newData);

  if (success) {
    data.success = true;
    // Consultar el registro actualizado
    const updatedEstadistica = await db.getEstadisticaById(id);
    data.updatedEstadistica = updatedEstadistica; // Agregar el registro actualizado a la respuesta
  } else {
    data.success = false;
    data.error = "Error al actualizar la estadística.";
  }

  const status = success ? 200 : 400;
  reply.status(status).send(data);
});

// Ruta para eliminar una estadística por su ID (DELETE)
fastify.delete("/estadisticas/:id", async (request, reply) => {
  let data = {};
  const id = request.params.id; // Obtener el ID de la URL
  const success = await db.deleteEstadisticaById(id);

  if (success) {
    data.success = true;
    data.message = "Estadística eliminada con éxito.";
  } else {
    data.success = false;
    data.error = "Error al eliminar la estadística.";
  }

  const status = success ? 200 : 400;
  reply.status(status).send(data);
});

// Add new message (auth)
fastify.post("/message", async (request, reply) => {
  let data = {};
  const auth = authorized(request.headers.admin_key);
  if (!auth || !request.body || !request.body.message) data.success = false;
  else if (auth) data.success = await db.addMessage(request.body.message);
  const status = data.success ? 201 : auth ? 400 : 401;
  reply.status(status).send(data);
});

// Update text for an message (auth)
fastify.put("/message", async (request, reply) => {
  let data = {};
  const auth = authorized(request.headers.admin_key);
  if (!auth || !request.body || !request.body.id || !request.body.message)
    data.success = false;
  else
    data.success = await db.updateMessage(
      request.body.id,
      request.body.message
    );
  const status = data.success ? 201 : auth ? 400 : 401;
  reply.status(status).send(data);
});

// Delete a message (auth)
fastify.delete("/message", async (request, reply) => {
  let data = {};
  const auth = authorized(request.headers.admin_key);
  if (!auth || !request.query || !request.query.id) data.success = false;
  else data.success = await db.deleteMessage(request.query.id);
  const status = data.success ? 201 : auth ? 400 : 401;
  reply.status(status).send(data);
});

// Helper function to authenticate the user key
const authorized = (key) => {
  if (
    !key ||
    key < 1 ||
    !process.env.ADMIN_KEY ||
    key !== process.env.ADMIN_KEY
  )
    return false;
  else return true;
};

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
  }
);
