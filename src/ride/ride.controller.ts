import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, singleton } from "tsyringe";
import { RideService } from "./ride.service.js";
import { Controller } from "../controller.js";
import RideDto from "green-wheels-core/src/ride/ride.dto.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { UserService } from "../user/user.service.js";
import { ProfileService } from "../profile/profile.service.js";
import { RideCreationProfileNeededError, StartRideError, UpdateRideError } from "./ride.errors.js";
import { ErrorHelper } from "../helper/error.helper.js";
import { ReservationService } from "../reservation/reservation.service.js";
import { RideState } from "./ride.state.enum.js";

@singleton()
export class RideController implements Controller {
    public constructor(
        @inject(RideService) private readonly rideService: RideService,
        @inject(UserService) private readonly userService: UserService,
        @inject(ProfileService) private readonly profileService: ProfileService,
        @inject(ReservationService) private readonly reservationService: ReservationService
    ) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/rides", { preHandler: [app.authenticate] }, this.getAvailableRides.bind(this));
        app.get("/offered-rides", { preHandler: [app.authenticate] }, this.getOfferedRides.bind(this));
        app.post(
            "/ride",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.createRide(req as FastifyRequest<{ Body: { ride: RideDto } }>, rep)
        );
        app.put(
            "/ride-start",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.startRide(req as FastifyRequest<{ Body: { rideId: number } }>, rep)
        );
        app.put(
            "/ride-end",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.finishRide(req as FastifyRequest<{ Body: { rideId: number } }>, rep)
        );
        app.delete(
            "/ride/:rideId",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.deleteRide(req as FastifyRequest<{ Params: { rideId: number } }>, rep)
        );
    }

    private getAvailableRides(req: FastifyRequest, rep: FastifyReply): void {
        try {
            const userId = (req as any).user.id;
            const communityId = this.userService.getUserById(userId)?.community;
            rep.code(StatusCodes.OK).code(StatusCodes.OK).send(this.rideService.getAvailableRides(userId, communityId));
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private getOfferedRides(req: FastifyRequest, rep: FastifyReply): void {
        try {
            const userId = (req as any).user.id;
            rep.code(StatusCodes.OK).send(this.rideService.getOfferedRides(userId));
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async createRide(req: FastifyRequest<{ Body: { ride: RideDto } }>, rep: FastifyReply): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const user = this.userService.getUserById(userId);
            const profile = this.profileService.getProfile(userId);
            if (!profile) {
                throw new RideCreationProfileNeededError(
                    "Ride creation needs a user profile",
                    StatusCodes.UnprocessableEntity,
                    null
                );
            }
            const ride = req.body.ride;
            ride.driverId = userId;
            ride.communityId = user?.community;
            ride.state = RideState.Ready;

            const rideId = await this.rideService.insertRide(req.body.ride);
            rep.code(StatusCodes.Created).send(rideId);
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async startRide(req: FastifyRequest<{ Body: { rideId: number } }>, rep: FastifyReply): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const rideId = Number(req.body.rideId);
            const ride = this.rideService.getRideById(rideId);
            if (ride === undefined || ride === null) {
                throw new StartRideError(`Ride with id: ${rideId} doesn't exist`, StatusCodes.BadRequest, null);
            }
            if (ride?.driverId === userId) {
                ride.state = RideState.Started;
                await this.updateRide(ride, RideState.Started);
            }
            rep.code(StatusCodes.OK).send({ success: true });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async finishRide(req: FastifyRequest<{ Body: { rideId: number } }>, rep: FastifyReply): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const rideId = Number(req.body.rideId);
            const ride = this.rideService.getRideById(rideId);
            if (ride === undefined || ride === null) {
                throw new StartRideError(`Ride with id: ${rideId} doesn't exist`, StatusCodes.BadRequest, null);
            }
            if (ride?.driverId === userId) {
                const driverUsername = this.userService.getUserById(userId)?.username as string;
                const startLocation = ride.start.municipality;
                const endLocation = ride.end.municipality;
                const passengers = this.reservationService.getReservations([rideId]).map(r => r.userId);
                const concludedRideDetails = { driverId: userId, driverUsername, startLocation, endLocation, passengers };
                await this.updateRide(ride, RideState.Concluded, concludedRideDetails);
            }
            rep.code(StatusCodes.OK).send({ success: true });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async updateRide(
        ride: RideDto,
        state: RideState,
        concludedRideDetails?: { driverId: number, driverUsername: string; startLocation: string; endLocation: string; passengers: number[] }
    ): Promise<void> {
        try {
            ride.state = state;
            await this.rideService.updateRide(ride, concludedRideDetails);
        } catch (e) {
            throw new UpdateRideError(`Error updating ride with id: ${ride.id}`, StatusCodes.InternalServerError, e);
        }
    }

    private async deleteRide(req: FastifyRequest<{ Params: { rideId: number } }>, rep: FastifyReply): Promise<void> {
        try {
            const rideId = Number(req.params.rideId);
            const userId = Number((req as any).user.id);

            await this.rideService.deleteRide(rideId, userId);
            rep.code(StatusCodes.OK).send({ success: true });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
