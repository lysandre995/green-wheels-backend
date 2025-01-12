import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, singleton } from "tsyringe";
import { Controller } from "../controller.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { ReservationService } from "./reservation.service.js";
import { RideService } from "../ride/ride.service.js";
import { ErrorHelper } from "../helper/error.helper.js";
import ReservationDto from "green-wheels-core/src/reservation/reservation.dto.js";
import RideDto from "green-wheels-core/src/ride/ride.dto.js";
import { ReservationAlreadyExistsError } from "./reservation.errors.js";
import { UserService } from "../user/user.service.js";
import UserDto from "green-wheels-core/src/user/user.dto.js";
import ReservationNotificationData from "green-wheels-core/src/reservation/reservation-notification.data.js";

@singleton()
export class ReservationController implements Controller {
    public constructor(
        @inject(ReservationService) private readonly reservationService: ReservationService,
        @inject(RideService) private readonly ridesService: RideService,
        @inject(UserService) private readonly userService: UserService
    ) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/reservations", { preHandler: [app.authenticate] }, this.getReservations.bind(this));
        app.post(
            "/reservation",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.createReservation(req as FastifyRequest<{ Body: { rideId: number } }>, rep)
        );
        app.put(
            "/reservation",
            { preHandler: [app.authenticate] },
            async (req, rep) =>
                await this.acceptReservation(req as FastifyRequest<{ Body: { reservationId: number } }>, rep)
        );
        app.delete(
            "/reservation/:reservationId",
            { preHandler: [app.authenticate] },
            async (req, rep) =>
                await this.refuseReservation(req as FastifyRequest<{ Params: { reservationId: number } }>, rep)
        );
        app.get("/reservation/:rideId", { preHandler: [app.authenticate] }, (req, rep) =>
            this.getIsReserved(req as FastifyRequest<{ Params: { rideId: number } }>, rep)
        );
    }

    // get all the reservation made from other users for rides offered by the curret user
    private getReservations(req: FastifyRequest, rep: FastifyReply): void {
        try {
            const offeredRideIds = this.getOfferedRideIds(req);
            const reservations = this.reservationService.getReservations(offeredRideIds);

            rep.code(StatusCodes.OK).send(reservations);
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async createReservation(req: FastifyRequest<{ Body: { rideId: number } }>, rep: FastifyReply) {
        try {
            const userId = Number((req as any).user.id);
            const rideId = Number(req.body.rideId);
            const alreadyExists =
                this.reservationService.getReservations([rideId]).filter(r => r.userId === userId).length > 0;
            if (alreadyExists) {
                throw new ReservationAlreadyExistsError(
                    `Reservation for ride ${rideId} for user ${userId} already exists`,
                    StatusCodes.BadRequest,
                    null
                );
            }

            const reservationId = await this.reservationService.createReservation(rideId, userId);
            rep.code(StatusCodes.Created).send({ reservationId });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async acceptReservation(req: FastifyRequest<{ Body: { reservationId: number } }>, rep: FastifyReply) {
        try {
            const offeredRideIds = this.getOfferedRideIds(req);
            const reservation = this.reservationService.getReservationById(
                Number(req.body.reservationId)
            ) as ReservationDto;

            // TODO: prevent overbooking
            const userId = (req as any).user.id;
            const ride = this.ridesService.getRideById(reservation.rideId) as RideDto;
            const user = this.userService.getUserById(userId) as UserDto;
            const date = new Date(ride.dateTime);
            const reservationNotificationData: ReservationNotificationData = {
                userId: userId,
                startLocation: ride.start.municipality,
                endLocation: ride.end.municipality,
                date: `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear().toString().padStart(4, "0")}`,
                time: `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
                driverUsername: user.username,
                lng: ride.start.lng,
                lat: ride.start.lat
            };

            await this.reservationService.acceptReservation(offeredRideIds, reservation, reservationNotificationData);
            rep.code(StatusCodes.OK).send();
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async refuseReservation(req: FastifyRequest<{ Params: { reservationId: number } }>, rep: FastifyReply) {
        try {
            const offeredRideIds = this.getOfferedRideIds(req);
            const reservation = this.reservationService.getReservationById(
                Number(req.params.reservationId)
            ) as ReservationDto;

            await this.reservationService.deleteReservation(offeredRideIds, reservation);
            rep.code(StatusCodes.OK).send();
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private getIsReserved(req: FastifyRequest<{ Params: { rideId: number } }>, rep: FastifyReply) {
        try {
            const userId = Number((req as any).user.id);
            const rideId = Number(req.params.rideId);
            const isReserved = !!this.reservationService.getReservations([rideId]).find(r => r.userId === userId);
            rep.code(StatusCodes.OK).send({ isReserved });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private getOfferedRideIds(req: FastifyRequest): number[] {
        const userId = Number((req as any).user.id);
        // rides offered by the current user
        return this.ridesService
            .getOfferedRides(userId)
            .filter(r => r.driverId === userId)
            .map(r => r.id) as number[];
    }
}
