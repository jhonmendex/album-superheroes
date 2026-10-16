# **Taller: Construcción y uso de AWS S3**

## AWS STUDENT BUILDER GROUP - UNIVERSIDAD DE LA SALLE, Bogota

**Autor:** Ing. Jhon Mendez  
**Fecha:** 2026  

---

## Objetivos del taller

Al finalizar el taller, se tendrá una aplicación que permite:

* Registrar un superhéroe con nombre, poder e imagen.
* Enviar los datos desde un formulario HTML a una API REST.
* Guardar la imagen en un bucket S3 de LocalStack.
* Guardar dos datos en un archivo JSON.
* Consultar los superhéroes registrados y mostrarlos en una galería.

---

## Parte I. Herramientas necesarias

### LocalStack

LocalStack permite ejecutar localmente emulaciones de servicios de AWS, incluido S3. En este taller se usará para practicar operaciones de almacenamiento sin crear un bucket en la nube real de AWS.

Página: [https://app.localstack.cloud/](https://app.localstack.cloud/)

Instalación de la CLI actual:

```bash
npm install -g @localstack/lstk
```

Verificación:

```bash
lstk --version
```

En el primer inicio, LocalStack puede abrir el navegador para que se inicie sesión en una cuenta de LocalStack. Esto no es una cuenta de AWS. LocalStack necesita un motor compatible con Docker y una cuenta/licencia de LocalStack para el flujo actual de inicio.

Documentación: [https://docs.localstack.cloud/aws/developer-tools/running-localstack/lstk/](https://docs.localstack.cloud/aws/developer-tools/running-localstack/lstk/)

### Docker Desktop

Docker permite ejecutar aplicaciones dentro de contenedores aislados. LocalStack se ejecuta normalmente como un contenedor administrado por su CLI.

Descarga: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

Verificación:

```bash
docker --version
docker info
```

No basta con instalar Docker: Docker Desktop debe estar abierto y el motor debe estar iniciado antes de ejecutar LocalStack.

### Node.js y npm

Node.js permite ejecutar JavaScript en el servidor. npm es el gestor de paquetes que instalaremos para incorporar Express, el SDK de S3 y el middleware para recibir archivos.

Página: [https://nodejs.org/en](https://nodejs.org/en)

Verificación:

```bash
node --version
npm --version
```

El comando correcto es `node --version`; no `NODE --version`, porque los comandos distinguen mayúsculas y minúsculas en muchos entornos.

### Bucket S3

Amazon S3 es un servicio de almacenamiento de objetos. Un **bucket** es un contenedor lógico donde se almacenan objetos. Cada objeto puede ser un archivo y sus metadatos; se identifica mediante una clave (*key*).

En este taller:

* El bucket se llamará `album-superheroes`.
* Cada imagen se almacenará con una clave única, por ejemplo `uuid-imagen.png`.
* Los datos del superhéroe se guardarán en un archivo JSON dentro del Bucket, con la misma clave que la imagen, por ejemplo `uuid-imagen.json`.
* El backend leerá los datos desde S3 cuando el navegador la solicite.

Documentación de S3 en LocalStack: [https://docs.localstack.cloud/aws/services/s3/](https://docs.localstack.cloud/aws/services/s3/)

### POSTMAN

Postman es una herramienta para probar APIs REST. Permite enviar solicitudes HTTP y ver las respuestas. En este taller, se usará para verificar que la API funciona correctamente.

### Herramientas del taller

| Herramienta | Uso en el taller |
| :--- | :--- |
| Docker Desktop | Ejecutar el contenedor de LocalStack. |
| LocalStack | Simular el servicio S3 en el computador. |
| Node.js | Ejecutar el código del backend. |
| Express | Definir rutas HTTP para crear y consultar superhéroes. |
| AWS SDK v3 | Enviar operaciones de S3 desde Node.js a LocalStack. |
| Multer | Leer los campos y el archivo enviado como `multipart/form-data`. |
| HTML/CSS/JS | Crear el formulario y representar la galería en el navegador. |
| POSTMAN | Probar la API REST y verificar que funciona correctamente. |

---

## Parte II. Conceptos

### Servidor y cliente

Un **servidor** es un programa que espera solicitudes y devuelve respuestas. En este taller, Node.js ejecutará el servidor de la API. El **cliente** será el navegador que abre el formulario y solicita los datos.

Cuando el usuario envía el formulario, el navegador envía una solicitud HTTP a Express. Express procesa los datos, almacena la imagen en S3 y responde con un resultado.

### API y API REST

Una API es una interfaz que permite que dos programas se comuniquen mediante reglas acordadas. Una API REST suele exponer recursos mediante URLs y métodos HTTP.

En este proyecto usaremos dos rutas principales:

| Método | Ruta | Función |
| :--- | :--- | :--- |
| POST | `/api/superheroes` | Crear un superhéroe y cargar sus datos. |
| GET | `/api/superheroes` | Consultar los superhéroes. |

### Contenedor

Un contenedor es un entorno aislado que ejecuta un programa junto con sus dependencias, utilizando el motor de contenedores del sistema. En esta práctica, Docker ejecutará LocalStack. No es necesario contenerizar también la API de Node.js: para reducir la complejidad, Node.js se ejecutará directamente en el computador.
La idea es usar estas tecnologías para simular los servicios de AWS sin necesidad de crear recursos en la nube real.

### Bucket, objeto y clave

* **Bucket S3:** contenedor lógico de objetos, por ejemplo `album-superheroes` S3 (Simple Storage Service).
* **Objeto:** el archivo de imagen almacenado.
* **Clave:** identificador del objeto dentro del bucket, por ejemplo `a13f...-imagen.jpg`.
* **Endpoint:** dirección a la que se envían las solicitudes: `http://localhost:4566`.

### SDK

Un SDK es un conjunto de bibliotecas que facilita el uso de un servicio desde un lenguaje de programación. El paquete `@aws-sdk/client-s3` proporciona comandos de JavaScript para crear buckets, subir objetos y descargarlos.

El SDK que usaremos es el mismo tipo de herramienta que se utiliza al desarrollar con AWS real. La diferencia en el taller es el endpoint local y las credenciales ficticias.

### HTTP, JSON y multipart/form-data

HTTP es el protocolo de comunicación entre navegador y API. JSON es un formato común para enviar y recibir datos estructurados. Sin embargo, una imagen es un archivo binario, por lo que el formulario enviará los campos y el archivo usando `multipart/form-data`. Multer interpreta ese formato en Express.

### Flujo general de la aplicación

1. El usuario escribe el nombre y el poder del superhéroe, selecciona una imagen y pulsa **Enviar**.
2. JavaScript crea un objeto `FormData` y lo envía a `POST /api/superheroes`.
3. Express y Multer reciben los campos y el archivo.
4. El backend asigna una clave única y sube el archivo al bucket S3 mediante el SDK.
5. El backend crea un objeto JSON con los datos del superhéroe.
6. El frontend vuelve a consultar `GET /api/superheroes`.
7. La galería representa cada superhéroe.

---

## Parte III. Construcción paso a paso

### Paso 1. Comprobar las herramientas

Abra Docker Desktop y espere a que indique que Docker está ejecutándose. En la terminal, compruebe:

```bash
docker --version
node --version
npm --version
lstk --version
```

Si `lstk` no se reconoce, la CLI no está instalada correctamente o su directorio no está en el `PATH`. Instálela mediante npm y abra una terminal nueva:

```bash
npm install -g @localstack/lstk
```

Después ejecute:

```bash
lstk doctor
lstk start
```

Complete el inicio de sesión solicitado por LocalStack. Mantenga LocalStack en ejecución durante el taller. En otra terminal, verifique que responde:

```bash
curl http://localhost:4566/_localstack/health
```

Si no responde, compruebe que Docker Desktop esté iniciado y consulte el mensaje que dejó `lstk start`.

### Paso 2. Crear el proyecto con módulos ES

Cree el directorio del proyecto e inicialice Node.js:

```bash
mkdir album-superheroes
cd album-superheroes
npm init -y
npm install express multer @aws-sdk/client-s3
```

En el archivo `package.json`, agregue la propiedad `"type": "module"`:

```json
{
  "name": "album-superheroes",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  }
}
```

Organice el proyecto de la siguiente manera:

```text
album-superheroes/
|-- package.json
|-- server.js
|-- s3.js
|-- superheroes.js
|-- public/
|   |-- index.html
|   |-- styles.css
|   |-- app.js
```

### Paso 3. Configurar la conexión con S3

En el archivo `s3.js`, configure el cliente del SDK. Para este taller se utiliza LocalStack, que simula el servicio S3 de AWS en el equipo local.

Descargar archivo de: [https://github.com/jhonmendex/album-superheroes/s3.js](https://github.com/jhonmendex/album-superheroes/s3.js)

### Paso 4. Implementar las operaciones de los superhéroes

Cada superhéroe se almacenará en S3 mediante dos objetos: un archivo de imagen y un archivo JSON con sus datos.

Por ejemplo, para un superhéroe con identificador `123`, el bucket tendrá esta estructura lógica:

```text
album-superheroes/
|-- imagenes/
|   |-- 123.jpg
|-- superheroes/
    |-- 123.json
```

El archivo JSON puede contener:

```json
{
  "id": "123",
  "nombre": "Centella",
  "poder": "Control de electricidad",
  "imagen": "imagenes/123.jpg"
}
```

Cree el archivo `superheroes.js`. Este módulo se encargará de subir la imagen, guardar los metadatos y consultar los registros.

Descargar archivo de: [https://github.com/jhonmendex/album-superheroes/superheroes.js](https://github.com/jhonmendex/album-superheroes/superheroes.js)

### Paso 5. Crear el servidor Express

En `server.js`, configure Express, Multer y las rutas de la API.

Descargar archivo de: [https://github.com/jhonmendex/album-superheroes/server.js](https://github.com/jhonmendex/album-superheroes/server.js)

### Paso 6. Construir el formulario HTML

En `public/index.html`, cree un formulario para registrar los superhéroes y un contenedor para mostrar la galería.

Descargar archivo de: [https://github.com/jhonmendex/album-superheroes/public/index.html](https://github.com/jhonmendex/album-superheroes/public/index.html)
