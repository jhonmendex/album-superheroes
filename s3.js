//Paso 3. Configurar la conexi´on con S3
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export const bucket = "album-superheroes";

export const s3 = new S3Client({
  region: "us-east-1", //esta es la región por defecto de LocalStack, no se puede cambiar
  endpoint: "http://localhost:4566", //esta es la dirección de LocalStack, no se puede cambiar
  forcePathStyle: true, //esta opción es necesaria para que funcione con LocalStack, lo que hace es que la URL del bucket se construya como http://localhost:4566/bucket-name en lugar de http://bucket-name.localhost:4566
  credentials: {
    accessKeyId: "test", //estas credenciales son las que LocalStack espera, no se pueden cambiar,
    secretAccessKey: "test", //estas credenciales son las que LocalStack espera, no se pueden cambiar
  },
});

export async function prepararBucket() {
  try {
    //verifica si el bucket existe, si no existe lo crea
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}
