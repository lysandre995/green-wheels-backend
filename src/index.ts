import "reflect-metadata";
import { container } from "tsyringe";
import fastify from "fastify";
import { UserController } from "./user/user.controller";
import { DatabaseService } from "./database/database.service";
import { Initializable } from "./common/initializable";
import { UserTable } from "./user/user.table";

const app = fastify();

const controllers = [UserController];
controllers.forEach(Controller => {
    const controllerInstance = container.resolve(Controller);
    controllerInstance.registerRoutes(app);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InitializableConstructor<T extends Initializable = Initializable> = new (...args: any[]) => T;
const initializables: InitializableConstructor[] = [DatabaseService, UserTable];
initializables.forEach(async Service => {
    const serviceInstance = container.resolve(Service);
    await serviceInstance.initialize();
});
