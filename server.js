//Paso 5. Crear el servidor Express

import express from "express";
//multer es una libreria de Node.js que permite manejar la subida de archivos en las peticiones HTTP, en este caso se utiliza para subir la imagen del superhéroe al servidor y luego al bucket de S3.
import multer from "multer";

import { prepararBucket } from "./s3.js";

import {
  crearSuperheroe,
  listarSuperheroes,
  obtenerImagen,
} from "./superheroes.js";

const app = express();
const puerto = 3000;

//configuramos multer para que guarde los archivos en memoria, y limite el tamaño de los archivos a 5MB, y filtre los archivos para que solo acepte imágenes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("El archivo debe ser una imagen"));
    }

    callback(null, true);
  },
});

app.use(express.json());
//ndicamos al servidor que abra una carpeta específica del proyecto (en este caso llamada public) para que cualquier archivo que se guarde dentro de ella pueda ser accedido directamente desde el navegador web por cualquier usuario.
app.use(express.static("public"));

app.post("/api/superheroes", upload.single("image"), async (req, res) => {
  try {
    const { nombre, poder } = req.body;
    if (!nombre?.trim() || !poder?.trim() || !req.file) {
      return res.status(400).json({
        error: "Ingrese nombre, poder e imagen",
      });
    }

    const superheroe = await crearSuperheroe(
      nombre.trim(),
      poder.trim(),
      req.file,
    );

    res.status(201).json(superheroe);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No fue posible guardar el superhéroe",
    });
  }
});

app.get("/api/superheroes", async (req, res) => {
  try {
    const superheroes = await listarSuperheroes();
    res.json(superheroes);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No fue posible consultar el álbum",
    });
  }
});

app.get("/api/superheroes/:id/imagen", async (req, res) => {
  try {
    const superheroes = await listarSuperheroes();

    const superheroe = superheroes.find((item) => item.id === req.params.id);

    if (!superheroe) {
      return res.status(404).json({
        error: "Superhéroe no encontrado",
      });
    }

    const objeto = await obtenerImagen(superheroe.imagen);

    res.set("Content-Type", objeto.ContentType || "application/octet-stream"); //devuelve un archivo binario, si no se encuentra el tipo de contenido, se devuelve un archivo binario genérico
    //pipe permite que el flujo de datos de un objeto se conecte a otro flujo de datos, en este caso, el flujo de datos del objeto que contiene la imagen se conecta al flujo de datos de la respuesta HTTP, lo que permite enviar la imagen al cliente.
    objeto.Body.pipe(res);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "No fue posible recuperar la imagen",
    });
  }
});

//Manejo de errores de multer con middlware, para que si ocurre un error en la subida de archivos, se capture y se envie una respuesta al cliente con el error.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: "La imagen supera el limite permitido",
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.message,
    });
  }

  next();
});

prepararBucket()
  .then(() => {
    app.listen(puerto, () => {
      console.log(`Servidor disponible en http://localhost:${puerto}`);
    });
  })
  .catch((error) => {
    console.error("Error al preparar S3:", error);
    process.exit(1);
  });
