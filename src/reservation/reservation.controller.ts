import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { inject, singleton } from "tsyringe";
import { Controller } from "../controller.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { ReservationService } from "./reservation.service.js";
import { RideService } from "../ride/ride.service.js";
import { ErrorHelper } from "../helper/error.helper.js";
import ReservationDto from "green-wheels-core/src/reservation/reservation.dto.js";

@singleton()
export class ReservationController implements Controller {
    public constructor(
        @inject(ReservationService) private readonly reservationService: ReservationService,
        @inject(RideService) private readonly ridesService: RideService
    ) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/reservations", { preHandler: [app.authenticate] }, this.getReservations.bind(this));
        app.post(
            "/reservation",
            { preHandler: [app.authenticate] },
            async (req, rep) => await this.createReservation(req as FastifyRequest<{ Body: { rideId: number } }>, rep)
        );
        app.post(
            "/reservation/accept",
            { preHandler: [app.authenticate] },
            async (req, rep) =>
                await this.acceptReservation(req as FastifyRequest<{ Body: { reservationId: number } }>, rep)
        );
        app.delete("/reservation/:id", { preHandler: [app.authenticate] },
            async (req, rep) =>
                await this.refuseReservation(req as FastifyRequest<{ Params: { reservationId: number } }>, rep))
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

            const reservationId = this.reservationService.createReservation(rideId, userId);
            rep.code(StatusCodes.Created).send({ reservationId });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async acceptReservation(req: FastifyRequest<{ Body: { reservationId: number } }>, rep: FastifyReply) {
        try {
            const offeredRideIds = this.getOfferedRideIds(req);
            const reservation = this.reservationService.getReservationById(req.body.reservationId) as ReservationDto;

            // notify the customer
            // prevent overbooking

            this.reservationService.acceptReservation(offeredRideIds, reservation);
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async refuseReservation(req: FastifyRequest<{Params: {reservationId: number}}>, rep: FastifyReply) {
        try {
            const offeredRideIds = this.getOfferedRideIds(req);
            const reservation = this.reservationService.getReservationById(Number(req.params.reservationId)) as ReservationDto;

            // notify the customer

            this.reservationService.deleteReservation(offeredRideIds, reservation);
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
