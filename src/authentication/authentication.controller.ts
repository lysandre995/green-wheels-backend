import { inject, singleton } from "tsyringe";
import { Controller } from "../controller";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthenticationService } from "./authentication.service.js";
import { CreateUserBody } from "../user/user.params";
import { LoginBody } from "./authentication.params";
import { ErrorHelper } from "../helper/error.helper.js";

@singleton()
export class AuthenticationController implements Controller {
    public constructor(@inject(AuthenticationService) private readonly authenticationService: AuthenticationService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.post("/register", this.register.bind(this));
        app.post("/login", this.login.bind(this));
        app.post("/validate", this.validateToken.bind(this));
    }

    private async register(request: FastifyRequest<{ Body: CreateUserBody }>, reply: FastifyReply): Promise<void> {
        try {
            await this.authenticationService.register(request.body.user);
            reply.code(200).send("Registration success");
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private async login(request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply): Promise<void> {
        try {
            const token = await this.authenticationService.login(request.body.username, request.body.password);
            reply.code(200).send({ token });
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private validateToken(request: FastifyRequest<{ Body: { token: string } }>, reply: FastifyReply): void {
        try {
            reply.code(200).send(this.authenticationService.validateToken(request.body.token));
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }
}
