/**
 * Module handles database management
 *
 * The sample data is for a chat log with one table:
 * Messages: id + message text
 */

const fs = require("fs");
const dbFile = "./.data/analitica.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const casual = require("casual");
let db;

//SQLite wrapper for async / await connections https://www.npmjs.com/package/sqlite
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    try {
      if (!exists) {
        await db.run(
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)"
        );
        for (let r = 0; r < 5; r++)
          await db.run(
            "INSERT INTO Messages (message) VALUES (?)",
            casual.catch_phrase
          );
      }
      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });

  //Obtener todos los registros de estadisticas
  const getAllEstadisticas = async () => {
    try {
      return await db.all("SELECT * FROM estadistica");
    } catch (dbError) {
      console.error(dbError);
      throw dbError; // Puedes manejar el error de acuerdo a tus necesidades
    }
  }; 

  // Obtener un registro de la tabla "estadistica" por su ID
const getEstadisticaById = async (id) => {
  try {
    return await db.get("SELECT * FROM estadistica WHERE id = ?", id);
  } catch (dbError) {
    console.error(dbError);
    throw dbError; // Puedes manejar el error de acuerdo a tus necesidades
  }
};

  // Insertar un nuevo registro en la tabla "estadistica"
const insertEstadistica = async (estadistica) => {
  try {
    const success = await db.run(
      "INSERT INTO estadistica (id, fecha_ingreso, hora_ingreso, pais, ciudad, tiempo, ruta, dispositivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      Object.values(estadistica)
    );
    
    return success.changes > 0;
  } catch (dbError) {
    console.error(dbError);
    throw dbError; // Puedes manejar el error de acuerdo a tus necesidades
  }
};

// Actualizar un registro en la tabla "estadistica" por su ID
// const updateEstadistica = async (id, newData) => {
//   try {
//     const success = await db.run(
//       "Update estadistica SET fecha_ingreso = ?, hora_ingreso = ?, pais = ?, ciudad = ?, tiempo = ?, ruta = ?, dispositivo = ? WHERE id = ?",
//       [...Object.values(newData), id]
//     );
    
//     return success.changes > 0;
//   } catch (dbError) {
//     console.error(dbError);
//     throw dbError; // Puedes manejar el error de acuerdo a tus necesidades
//   }
// };

const updateEstadistica = async (id, newData) => {
  let success = false;
  try {
    success = await db.run(
      "Update estadistica SET fecha_ingreso = ?, hora_ingreso = ?, pais = ?, ciudad = ?, tiempo = ?, ruta = ?, dispositivo = ? WHERE id = ?",
      newData,
      id
    );
  } catch (dbError) {
    console.error(dbError);
  }
  return success.changes > 0 ? true : false;
};

// Eliminar un registro de la tabla "estadistica" por su ID
const deleteEstadisticaById = async (id) => {
  try {
    const success = await db.run("Delete FROM estadistica WHERE id = ?", id);
    return success.changes > 0;
  } catch (dbError) {
    console.error(dbError);
    throw dbError; // Puedes manejar el error de acuerdo a tus necesidades
  }
};

// Server script calls these methods to connect to the db
module.exports = {
  getAllEstadisticas,
  getEstadisticaById,
  insertEstadistica,
  updateEstadistica,
  deleteEstadisticaById,
  
  // Get the messages in the database
  getMessages: async () => {
    try {
      return await db.all("SELECT * from Messages");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // Add new message
  addMessage: async message => {
    let success = false;
    try {
      success = await db.run("INSERT INTO Messages (message) VALUES (?)", [
        message
      ]);
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Update message text
  updateMessage: async (id, message) => {
    let success = false;
    try {
      success = await db.run(
        "Update Messages SET message = ? WHERE id = ?",
        message,
        id
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Remove message
  deleteMessage: async id => {
    let success = false;
    try {
      success = await db.run("Delete from Messages WHERE id = ?", id);
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  }
};
