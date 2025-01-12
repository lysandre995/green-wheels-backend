import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, singleton } from "tsyringe";
import { RideService } from "./ride.service.js";
import { Controller } from "../controller.js";
import RideDto from "green-wheels-core/src/ride/ride.dto.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { UserService } from "../user/user.service.js";
import { ProfileService } from "../profile/profile.service.js";
import { RideCreationProfileNeededError } from "./ride.errors.js";
import { ErrorHelper } from "../helper/error.helper.js";

@singleton()
export class RideController implements Controller {
    public constructor(
        @inject(RideService) private readonly rideService: RideService,
        @inject(UserService) private readonly userService: UserService,
        @inject(ProfileService) private readonly profileService: ProfileService
    ) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/rides", { preHandler: [app.authenticate] }, this.getAvailableRides.bind(this));
        app.get("/offered-rides", { preHandler: [app.authenticate] }, this.getOfferedRides.bind(this));
        app.post(
            "/ride",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.createRide(req as FastifyRequest<{ Body: { ride: RideDto } }>, rep)
        );
        app.delete(
            "/ride/:rideId",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.deleteRide(req as FastifyRequest<{ Params: { rideId: number } }>, rep)
        );
    }

    private getAvailableRides(request: FastifyRequest, reply: FastifyReply): void {
        try {
            const userId = (request as any).user.id;
            const communityId = this.userService.getUserById(userId)?.community;
            reply
                .code(StatusCodes.OK)
                .code(StatusCodes.OK)
                .send(this.rideService.getAvailableRides(userId, communityId));
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private getOfferedRides(request: FastifyRequest, reply: FastifyReply): void {
        try {
            const userId = (request as any).user.id;
            reply.code(StatusCodes.OK).send(this.rideService.getOfferedRides(userId));
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private async createRide(request: FastifyRequest<{ Body: { ride: RideDto } }>, reply: FastifyReply): Promise<void> {
        try {
            const userId = (request as any).user.id;
            const user = this.userService.getUserById(userId);
            const profile = this.profileService.getProfile(userId);
            if (!profile) {
                throw new RideCreationProfileNeededError(
                    "Ride creation needs a user profile",
                    StatusCodes.UnprocessableEntity,
                    null
                );
            }
            const ride = request.body.ride;
            ride.driverId = userId;
            ride.communityId = user?.community;

            const rideId = await this.rideService.insertRide(request.body.ride);
            reply.code(StatusCodes.Created).send(rideId);
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private async deleteRide(
        request: FastifyRequest<{ Params: { rideId: number } }>,
        reply: FastifyReply
    ): Promise<void> {
        try {
            const rideId = Number(request.params.rideId);
            const userId = Number((request as any).user.id);

            await this.rideService.deleteRide(rideId, userId);
            reply.code(StatusCodes.OK).send({ success: true });
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }
}
