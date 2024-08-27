import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { injectable, inject } from "tsyringe";
import { UserService } from "./user.service";
import {
    CreateUserBody,
    DeleteUserParams,
    GetUserParams,
    GetUsersParams
} from "./user.params";

@injectable()
export class UserController {
    public constructor(@inject(UserService) private userService: UserService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/users", this.getUsers.bind(this));
        app.get("/users/:id", this.getUserById.bind(this));
        app.post("/users", this.createUser.bind(this));
        app.delete("/users/:id", this.deleteUser.bind(this));
    }

    private getUsers(
        request: FastifyRequest<{ Querystring: GetUsersParams }>,
        reply: FastifyReply
    ): void {
        const { ids } = request.query;
        if (ids !== undefined && ids !== null && ids.length > 0) {
            reply.send(this.userService.getUsersByIds(ids));
            return;
        }
        reply.send(this.userService.getAllUsers());
    }

    private getUserById(request: FastifyRequest<{ Params: GetUserParams }>, reply: FastifyReply): void {
        const user = this.userService.getUserById(request.params.id);
        reply.send(user);
    }

    private async createUser(
        request: FastifyRequest<{ Body: CreateUserBody }>,
        reply: FastifyReply
    ): Promise<void> {
        const user = await this.userService.insertUser(request.body.user);
        reply.send(user);
    }

    private async deleteUser(request: FastifyRequest<{ Params: DeleteUserParams }>, reply: FastifyReply): Promise<void> {
        await this.userService.deleteUser(request.params.id);
        reply.send({ success: true });
    }
}
