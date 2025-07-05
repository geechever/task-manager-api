# Task Manager API REST

Esta es una API REST robusta para la gestión de tareas, construida con Node.js y Express. Incluye un sistema completo de autenticación y autorización basado en JSON Web Tokens (JWT) con rotación de refresh tokens para una seguridad mejorada. La API permite a los usuarios registrarse, iniciar sesión, y gestionar sus tareas a través de operaciones CRUD protegidas, con diferentes niveles de acceso según el rol del usuario.

## Características

* **Autenticación JWT:** Registro e inicio de sesión de usuarios con tokens de acceso (Access Tokens) y tokens de refresco (Refresh Tokens).
* **Rotación de Refresh Tokens:** Implementación de un mecanismo seguro para renovar tokens y revocar el acceso de tokens antiguos, aumentando la seguridad.
* **Autorización Basada en Roles:** Dos roles de usuario definidos (`user` y `admin`) con acceso diferenciado a ciertas rutas y operaciones.
* **CRUD para Tareas:**
    * `POST /api/tasks`: Crear una nueva tarea.
    * `GET /api/tasks`: Obtener todas las tareas (filtradas por usuario si el rol es `user`, o todas si es `admin`).
    * `GET /api/tasks/:id`: Obtener una tarea específica.
    * `PUT /api/tasks/:id`: Actualizar una tarea existente.
    * `DELETE /api/tasks/:id`: Eliminar una tarea.
* **Conexión a MongoDB:** Persistencia de datos utilizando MongoDB (NoSQL) con Mongoose como ORM.
* **Estructura de Proyecto Modular:** Organización clara con separación de rutas, controladores, modelos, middlewares y configuración.
* **Validación de Datos:** Uso de `joi` para la validación de esquemas de datos de entrada.
* **Manejo Centralizado de Errores:** Middleware para una gestión de errores consistente.
* **Logging:** Uso de Winston para un registro de eventos estructurado.

## Tecnologías Utilizadas

* **Node.js**
* **Express.js** (Framework web)
* **MongoDB** (Base de datos NoSQL)
* **Mongoose** (ORM para MongoDB)
* **JSON Web Tokens (JWT)** (Autenticación)
* **Bcrypt.js** (Hash de contraseñas)
* **Dotenv** (Variables de entorno)
* **Joi** (Validación de esquemas)
* **Winston** (Logging)
* **UUID** (Generación de IDs únicos para tokens)

## Requisitos

* Node.js (versión 18 o superior recomendada)
* npm (Node Package Manager)
* Una instancia de MongoDB (local o en la nube, ej. MongoDB Atlas)

## Instalación

Sigue estos pasos para configurar y ejecutar el proyecto localmente:

1.  **Clona el repositorio:**
    ```bash
    git clone [https://github.com/geechever/task-manager-api.git](https://github.com/geechever/task-manager-api.git)
    cd task-manager-api
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:

    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/taskmanager
    JWT_SECRET=tu_secreto_jwt_muy_seguro_y_largo_aqui
    JWT_EXPIRES_IN=30m # Tiempo de expiración del Access Token (ej: 30 minutos)
    JWT_REFRESH_SECRET=tu_secreto_refresh_muy_seguro_y_mas_largo_aqui
    JWT_REFRESH_EXPIRES_IN=7d # Tiempo de expiración del Refresh Token (ej: 7 días)
    ```
    *Reemplaza los valores de los secretos con cadenas aleatorias y largas. Puedes usar herramientas online para generar cadenas seguras.*

4.  **Inicia el servidor:**
    ```bash
    npm run dev
    ```
    El servidor se iniciará en `http://localhost:3000` (o el puerto que hayas configurado en `.env`).

## Uso de la API

Puedes interactuar con la API usando herramientas como Postman, Insomnia, o `Invoke-WebRequest` en PowerShell.

### Rutas de Autenticación

* **`POST /api/auth/register`**
    * **Descripción:** Registra un nuevo usuario en el sistema.
    * **Body (JSON):**
        ```json
        {
            "username": "nombreusuario",
            "email": "usuario@example.com",
            "password": "passwordseguro",
            "role": "user"
        }
        ```
    * **Notas:** El campo `role` puede ser `user` o `admin`. La primera cuenta `admin` debe registrarse manualmente o a través de un script inicial, o bien, implementando una lógica para que el primer usuario registrado sea `admin`.

* **`POST /api/auth/login`**
    * **Descripción:** Inicia sesión con las credenciales de un usuario.
    * **Body (JSON):**
        ```json
        {
            "email": "usuario@example.com",
            "password": "passwordseguro"
        }
        ```
    * **Respuesta:** Retorna `accessToken` y `refreshToken`.

* **`POST /api/auth/refresh-token`**
    * **Descripción:** Renueva un `accessToken` utilizando un `refreshToken` válido.
    * **Body (JSON):**
        ```json
        {
            "refreshToken": "tu_refresh_token_aqui"
        }
        ```
    * **Respuesta:** Retorna un nuevo `accessToken` y un nuevo `refreshToken` (con rotación de tokens).

### Rutas de Tareas (Protegidas)

Todas estas rutas requieren un **Access Token válido** en el encabezado `Authorization: Bearer <accessToken>`.

* **`POST /api/tasks`**
    * **Descripción:** Crea una nueva tarea.
    * **Rol Requerido:** `user`, `admin`
    * **Body (JSON):**
        ```json
        {
            "title": "Mi primera tarea",
            "description": "Detalles de la tarea",
            "status": "pending"
        }
        ```

* **`GET /api/tasks`**
    * **Descripción:** Obtiene todas las tareas. Los usuarios normales solo ven sus propias tareas; los administradores ven todas las tareas.
    * **Rol Requerido:** `user`, `admin`
    * **Parámetros de Query (Opcional):**
        * `status`: Filtra por estado (ej. `/api/tasks?status=completed`).
        * `sortBy`: Campo para ordenar (ej. `/api/tasks?sortBy=createdAt:desc`).
        * `limit`: Número máximo de resultados (ej. `/api/tasks?limit=10`).
        * `page`: Número de página (ej. `/api/tasks?page=1`).

* **`GET /api/tasks/:id`**
    * **Descripción:** Obtiene una tarea específica por su ID.
    * **Rol Requerido:** `user`, `admin` (Un usuario normal solo puede ver sus propias tareas).

* **`PUT /api/tasks/:id`**
    * **Descripción:** Actualiza una tarea existente por su ID.
    * **Rol Requerido:** `user`, `admin` (Un usuario normal solo puede actualizar sus propias tareas).
    * **Body (JSON):** (Campos opcionales para actualizar)
        ```json
        {
            "title": "Tarea actualizada",
            "status": "completed"
        }
        ```

* **`DELETE /api/tasks/:id`**
    * **Descripción:** Elimina una tarea por su ID.
    * **Rol Requerido:** `user`, `admin` (Un usuario normal solo puede eliminar sus propias tareas; un administrador puede eliminar cualquier tarea).

## Estructura del Proyecto
.
├── src/
│   ├── config/             # Configuración de la aplicación (DB, JWT, Logger)
│   │   ├── db.js
│   │   ├── jwt.js
│   │   └── logger.js
│   ├── controllers/        # Lógica de negocio para cada ruta
│   │   ├── auth.controller.js
│   │   └── task.controller.js
│   ├── middlewares/        # Middlewares (autenticación, autorización, manejo de errores, validación)
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.js     # Manejador de errores centralizado
│   │   ├── role.middleware.js  # Para verificar roles de usuario
│   │   └── validate.middleware.js # Para validación de datos de entrada
│   ├── models/             # Esquemas de Mongoose para la base de datos
│   │   ├── User.js
│   │   └── Task.js
│   ├── routes/             # Definición de rutas de la API
│   │   ├── auth.routes.js
│   │   └── task.routes.js
│   ├── app.js              # Archivo principal de la aplicación Express
│   └── utils/              # Utilidades varias (ej. validaciones, hashing)
│       └── validationSchemas.js
├── tests/                  # Pruebas (unitarias, integración)
│   ├── integration/
│   │   └── auth.test.js
│   ├── unit/
│   │   └── utils.test.js
│   └── setup.js
├── .env.example            # Ejemplo de archivo de variables de entorno
├── .gitignore              # Archivos y directorios a ignorar por Git
├── package.json            # Metadatos del proyecto y dependencias
├── package-lock.json       # Información detallada de dependencias
├── combined.log            # Archivo de log combinado (generado en tiempo de ejecución)
├── error.log               # Archivo de log de errores (generado en tiempo de ejecución)
├── eslint.config.mjs       # Configuración de ESLint (linter)
└── README.md               # Documentación del proyecto

