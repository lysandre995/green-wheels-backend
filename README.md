# Green Wheels - Backend

Business logic for Green Wheels Project.

The backend is written in TypeScript and leverages [**tsyringe**](https://github.com/microsoft/tsyringe) for dependency injection, providing a clean and modular architecture. It uses [**Fastify**](https://fastify.dev/) as the server framework, ensuring high performance and scalability. Stateless authentication is implemented using [**JWT**](https://jwt.io/) (JSON Web Tokens), enabling secure user sessions without the need for server-side session storage. The application uses [**lowdb**](https://github.com/typicode/lowdb), a lightweight local JSON database, for persistent storage, ensuring simplicity and flexibility during development. This setup is ideal for small-scale projects and rapid prototyping.

## Usage
For using with the monorepo refer to the root project [**Green Wheels**](https://github.com/lysandre995/green-wheels)

Standalone usage:

* Install dependency:
```bash
    npm i
```

Compile the project:

```bash
    npm run build
```

Compile the project and watch for changes:

```bash
    npm run watch
```

Run the project:

```bash
    npm run start
```
