import "reflect-metadata";
import { container } from "tsyringe";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { UserController } from "./user/user.controller.js";
import { DatabaseService } from "./database/database.service.js";
import { Initializable } from "./common/initializable";
import { UserTable } from "./user/user.table.js";
import { CommunityController } from "./community/community.controller.js";
import { Controller } from "./controller.js";
import { CommunityTable } from "./community/community.table.js";
import { AuthenticationService } from "./authentication/authentication.service.js";
import { AuthenticationController } from "./authentication/authentication.controller.js";
import { ProfileService } from "./profile/profile.service.js";
import { ProfileController } from "./profile/profile.controller.js";
import { ProfileTable } from "./profile/profile.table.js";
import { RideController } from "./ride/ride.controller.js";
import { RideService } from "./ride/ride.service.js";
import { RideTable } from "./ride/ride.table.js";
import { UserService } from "./user/user.service.js";
import { CommunityService } from "./community/community.service.js";
import { ReservationController } from "./reservation/reservation.controller.js";
import { ReservationTable } from "./reservation/reservation.table.js";
import { ReservationService } from "./reservation/reservation.service.js";
import { EventManager } from "./event/event.manager.js";
import { constants } from "./constants.js";
import { ChatController } from "./chat/chat.controller.js";
import { ChatService } from "./chat/chat.service.js";
import { ChatTable } from "./chat/chat.table.js";
import { EvaluationController } from "./evaluation/evaluation.controller.js";
import { EvaluationTable } from "./evaluation/evaluation.table.js";
import { EvaluationService } from "./evaluation/evaluation.service.js";

const app = fastify();

app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
});

app.addHook("preHandler", (request, reply, done) => {
    if (typeof request.body === "string") {
        try {
            request.body = JSON.parse(request.body);
        } catch (e) {
            reply.status(400).send({ error: "Invalid JSON" });
            return;
        }
    }

    done();
});

type ControllerConstructor<T extends Controller = Controller> = new (...args: any[]) => T;
const controllers: ControllerConstructor[] = [
    UserController,
    CommunityController,
    AuthenticationController,
    ProfileController,
    RideController,
    ReservationController,
    ChatController,
    EvaluationController
];

type InitializableConstructor<T extends Initializable = Initializable> = new (...args: any[]) => T;
const initializables: InitializableConstructor[] = [
    EventManager,
    DatabaseService,
    UserTable,
    CommunityTable,
    ProfileTable,
    RideTable,
    ReservationTable,
    ChatTable,
    EvaluationTable,
    AuthenticationService,
    UserService,
    CommunityService,
    ProfileService,
    RideService,
    ReservationService,
    ChatService,
    EvaluationService
];

(async () => {
    try {
        await Promise.all(
            initializables.map(Service => {
                const serviceInstance = container.resolve(Service);
                return serviceInstance.initialize();
            })
        );

        const userTable = container.resolve(UserTable);
        if (userTable.findAll().length === 0) {
            userTable.insert({
                name: constants.GREEN_WHEELS_USER_NAME,
                email: "",
                username: constants.GREEN_WHEELS_USER_NAME,
                password: "",
                telephone: ""
            });
        }

        app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
            const authHeader = request.headers["authorization"];
            if (authHeader === undefined) {
                reply.status(401).send({ error: "No token provided" });
                return;
            }

            const [scheme, token] = authHeader.split(" ");
            if (scheme !== "Bearer" || token === undefined || token === null) {
                reply.status(401).send({ error: "Invalid token format" });
                return;
            }

            try {
                const decoded = container.resolve(AuthenticationService).validateToken(token);
                (request as any).user = decoded;
            } catch (e) {
                reply.status(401).send({ error: e, valid: false });
            }
        });

        controllers.forEach(Controller => {
            try {
                const controllerInstance = container.resolve(Controller);
                controllerInstance.registerRoutes(app);
            } catch (e) {
                console.error(`Failed to register controller ${Controller.name}`, e);
            }
        });

        const address = await app.listen({ port: 3000, host: "0.0.0.0" });
        console.log(`Server listening at ${address}`);
    } catch (e) {
        console.error("Error during server startup", e);
        process.exit(1);
    }
})();
