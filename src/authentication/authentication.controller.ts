import { inject, singleton } from "tsyringe";
import { Controller } from "../controller";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { AuthenticationService } from "./authentication.service.js";
import { CreateUserBody } from "../user/user.params";
import { LoginBody } from "./authentication.params";
import { ErrorHelper } from "../helper/error.helper.js";
import { constants } from "../constants.js";
import { StatusCodes } from "../common/status-codes.enum.js";

@singleton()
export class AuthenticationController implements Controller {
    public constructor(@inject(AuthenticationService) private readonly authenticationService: AuthenticationService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.post("/register", this.register.bind(this));
        app.post("/login", this.login.bind(this));
        app.post("/validate", this.validateToken.bind(this));
    }

    private async register(req: FastifyRequest<{ Body: CreateUserBody }>, rep: FastifyReply): Promise<void> {
        try {
            await this.authenticationService.register(req.body.user);
            rep.code(200).send("Registration success");
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async login(req: FastifyRequest<{ Body: LoginBody }>, rep: FastifyReply): Promise<void> {
        try {
            if (req.body.username === constants.GREEN_WHEELS_USER_NAME) {
                rep.code(StatusCodes.Forbidden).send();
            }
            const token = await this.authenticationService.login(req.body.username, req.body.password);
            rep.code(200).send({ token });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private validateToken(req: FastifyRequest<{ Body: { token: string } }>, rep: FastifyReply): void {
        try {
            rep.code(200).send(this.authenticationService.validateToken(req.body.token));
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
