//Paso 4. Implementar las operaciones de los superhéroes
import { randomUUID } from "node:crypto";
//la libreria crypto permite generar un UUID aleatorio, que es un identificador único universal, que se utiliza para identificar de manera única a cada superhéroe y su imagen asociada.
//un UUID es un número de 128 bits que se representa como una cadena de caracteres hexadecimal, y se utiliza para identificar de manera única a un objeto o entidad en un sistema distribuido. En este caso, se utiliza para generar un identificador único para cada superhéroe y su imagen asociada, lo que permite evitar colisiones de nombres y garantizar que cada superhéroe tenga un identificador único en el sistema.
import {
  PutObjectCommand, //esta clase permite subir un objeto a un bucket de S3, en este caso se utiliza para subir la imagen y el JSON del superhéroe al bucket de S3.
  GetObjectCommand, //esta clase permite obtener un objeto de un bucket de S3, en este caso se utiliza para obtener la imagen y el JSON del superhéroe del bucket de S3.
  ListObjectsV2Command, //esta clase permite listar los objetos de un bucket de S3, en este caso se utiliza para listar los JSON de los superhéroes del bucket de S3.
} from "@aws-sdk/client-s3";

import { s3, bucket } from "./s3.js";

export async function crearSuperheroe(nombre, poder, archivo) {
  const id = randomUUID();
  //a continuación se obtiene la extensión del archivo de imagen, que se utiliza para construir la clave del objeto en S3. La extensión se obtiene a partir del nombre original del archivo, que se encuentra en la propiedad originalname del objeto archivo. Se utiliza el método split para separar el nombre del archivo por el punto (.) y obtener un arreglo de partes, y luego se utiliza el método pop para obtener la última parte del arreglo, que corresponde a la extensión del archivo. Finalmente, se utiliza el método toLowerCase para convertir la extensión a minúsculas, ya que S3 es sensible a mayúsculas y minúsculas en las claves de los objetos.
  const extension = archivo.originalname.split(".").pop().toLowerCase();

  const claveImagen = `imagenes/${id}.${extension}`;
  const claveJSON = `superheroes/${id}.json`;

  //el metodo send me recibe como parametro un comando, en este caso el comando PutObjectCommand, que permite subir un objeto a un bucket de S3. El comando recibe como parámetro un objeto con las propiedades Bucket, Key, Body y ContentType, que corresponden al nombre del bucket, la clave del objeto, el contenido del objeto y el tipo de contenido del objeto, respectivamente. En este caso, se utiliza la claveImagen para la propiedad Key, el buffer del archivo para la propiedad Body y el tipo MIME del archivo para la propiedad ContentType.
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: claveImagen,
      Body: archivo.buffer,
      ContentType: archivo.mimetype, //Multipurpose Internet Mail Extensions
    }),
  );

  const superheroe = {
    id,
    nombre,
    poder,
    imagen: claveImagen,
  };
  //hacemos lo mismo con el archivo JSON persistir los datos
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: claveJSON,
      Body: JSON.stringify(superheroe, null, 2),
      ContentType: "application/json",
    }),
  );

  return superheroe;
}

export async function listarSuperheroes() {
  //esta funcion lista todos los objetos del bucket que tienen el prefijo "superheroes/", que corresponde a los archivos JSON de los superhéroes.
  const resultado = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "superheroes/",
    }),
  );

  //
  const archivos = resultado.Contents ?? [];

  //creamos una promesa que resuelve un arreglo de superhéroes, que se obtiene a partir de los archivos JSON listados en el bucket. Para cada archivo JSON, se obtiene el objeto del bucket utilizando el comando GetObjectCommand, y luego se transforma el contenido del objeto a una cadena de texto utilizando el método transformToString. Finalmente, se parsea la cadena de texto a un objeto JSON utilizando JSON.parse, y se devuelve el objeto superhéroe.
  const superheroes = await Promise.all(
    archivos
      .filter((objeto) => objeto.Key.endsWith(".json"))
      .map(async (objeto) => {
        const respuesta = await s3.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: objeto.Key,
          }),
        );

        const contenido = await respuesta.Body.transformToString();

        return JSON.parse(contenido);
      }),
  );

  return superheroes;
}

export async function obtenerImagen(clave) {
  return await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: clave,
    }),
  );
}
