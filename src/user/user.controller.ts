import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, singleton } from "tsyringe";
import { UserService } from "./user.service.js";
import { CreateUserBody, DeleteUserParams, GetUserParams, GetUsersParams } from "./user.params";
import { Controller } from "../controller.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { ErrorHelper } from "../helper/error.helper.js";
import { ProfileService } from "../profile/profile.service.js";
import { CustomError } from "../common/custom.error.js";
import { ReservationService } from "../reservation/reservation.service.js";

@singleton()
export class UserController implements Controller {
    public constructor(
        @inject(UserService) private readonly userService: UserService,
        @inject(ProfileService) private readonly profileService: ProfileService,
        @inject(ReservationService) private readonly reservationService: ReservationService
    ) {}

    public registerRoutes(app: FastifyInstance): void {
        // app.get("/users", this.getUsers.bind(this));
        // app.get("/users/:id", this.getUserById.bind(this));
        // app.post("/users", this.createUser.bind(this));
        // app.delete("/users/:id", this.deleteUser.bind(this));
        app.get("/user-name", { preHandler: [app.authenticate] }, this.getCurrentUserName.bind(this));
        app.get("/user-id/:username", { preHandler: [app.authenticate] }, (res, rep) =>
            this.getUserIdByUsername(res as FastifyRequest<{ Params: { username: string } }>, rep)
        );
        app.get("/user-info/:userId/:rideId", { preHandler: [app.authenticate] }, (res, rep) =>
            this.getUserInfo(res as FastifyRequest<{ Params: { userId: number; rideId: number } }>, rep)
        );
    }

    // only internal use
    private getUsers(req: FastifyRequest<{ Querystring: GetUsersParams }>, rep: FastifyReply): void {
        const { ids } = req.query;
        if (ids !== undefined && ids !== null && ids.length > 0) {
            rep.send(this.userService.getUsersByIds(ids));
            return;
        }
        rep.send(this.userService.getAllUsers());
    }

    // only internal use
    private getUserById(req: FastifyRequest<{ Params: GetUserParams }>, rep: FastifyReply): void {
        const user = this.userService.getUserById(Number(req.params.id));
        rep.send(user);
    }

    // only internal use
    private async createUser(req: FastifyRequest<{ Body: CreateUserBody }>, rep: FastifyReply): Promise<void> {
        const user = await this.userService.insertUser(req.body.user);
        rep.send(user);
    }

    // only internal use
    private async deleteUser(req: FastifyRequest<{ Params: DeleteUserParams }>, rep: FastifyReply): Promise<void> {
        await this.userService.deleteUser(Number(req.params.id));
        rep.send({ success: true });
    }

    private getCurrentUserName(req: FastifyRequest, rep: FastifyReply): void {
        try {
            const userId = (req as any).user.id;
            const userName = this.userService.getUserById(userId)?.name;

            rep.code(StatusCodes.OK).send({ userName });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private getUserIdByUsername(req: FastifyRequest<{ Params: { username: string } }>, rep: FastifyReply): void {
        try {
            const username = req.params.username;
            if (!(username === undefined || username === null || username === "")) {
                const userId = this.userService
                    .getAllUsers()
                    .filter(u => u.username === username)
                    .at(0)?.id;
                rep.code(StatusCodes.OK).send({ userId });
            }
            rep.code(StatusCodes.OK).send({ userId: (req as any).user.id });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private getUserInfo(req: FastifyRequest<{ Params: { userId: number; rideId: number } }>, rep: FastifyReply) {
        try {
            const userId = Number(req.params.userId);
            const rideId = Number(req.params.rideId);
            const user = this.userService.getUserById(userId);
            const profile = this.profileService.getProfile(userId);
            const reservations = this.reservationService.getReservations([rideId]);

            if (user === undefined || user === null || profile === undefined || profile === null) {
                throw new CustomError(
                    "Error getting user and profile information",
                    StatusCodes.InternalServerError,
                    null
                );
            }
            const profileCopy = JSON.parse(JSON.stringify(profile));
            profileCopy.availableSeats = Math.max(0, Number(profileCopy.availableSeats) - reservations.filter(r => r.accepted).length);
            return {
                username: user.username,
                averageRate: user.averageRate,
                numberOfEvaluations: user.numberOfEvaluations,
                ...profileCopy
            };
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
