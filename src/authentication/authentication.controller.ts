import { inject, singleton } from "tsyringe";
import { Controller } from "../controller";
import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthenticationService } from "./authentication.service.js";
import { CreateUserBody } from "../user/user.params";
import { LoginBody } from "./authentication.params";

@singleton()
export class AuthenticationController implements Controller {
    public constructor(@inject(AuthenticationService) private readonly authenticationService: AuthenticationService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.post("/register", this.register.bind(this));
        app.post("/login", this.login.bind(this));
        app.post("/validate", this.validateToken.bind(this));

        //app.get("/protected", { preHandler: [app.authenticate] }, this.protectedMethod.bind(this))
    }

    private async register(request: FastifyRequest<{Body: CreateUserBody}>, reply: FastifyReply): Promise<void> {
        await this.authenticationService.register(request.body.user);
        reply.code(200).send("Registration success");
    }

    private async login(request: FastifyRequest<{Body: LoginBody}>, reply: FastifyReply): Promise<void> {
        const token = await this.authenticationService.login(request.body.username, request.body.password)
        reply.code(200).send({ token });
    }

    private validateToken(request: FastifyRequest<{Body: {token: string}}>, reply: FastifyReply): void {
        reply.code(200).send(this.authenticationService.validateToken(request.body.token));
    }

    // private protectedMethod(request: FastifyRequest, reply: FastifyReply): void {

    // }
}