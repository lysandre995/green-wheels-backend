import { inject, singleton } from "tsyringe";
import { Initializable } from "../common/initializable.js";
import { ReservationTable } from "./reservation.table.js";
import ReservationDto from "green-wheels-core/src/reservation/reservation.dto.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import {
    AcceptReservationError,
    CreateReservationsError,
    DeleteReservationError,
    GetReservationsError,
    ReservationAlreadyAcceptedError,
    ReservationIdUndefinedError,
    ReservationOperationUnathorizedError
} from "./reservation.errors.js";
import { EventManager } from "../event/event.manager.js";
import { EventKeys } from "../event/event-keys.enum.js";
import ReservationNotificationData from "green-wheels-core/src/reservation/reservation-notification.data.js";

@singleton()
export class ReservationService implements Initializable {
    public constructor(
        @inject(ReservationTable) private readonly reservationTable: ReservationTable,
        @inject(EventManager) private readonly eventManager: EventManager
    ) {}

    public async initialize(): Promise<void> {
        this.eventManager.on(
            EventKeys.RideElimination,
            async e => await this.cascadeDeleteReservations((e as any)?.detail?.rideId)
        );
        return;
    }

    public getReservations(offeredRideIds: number[]): ReservationDto[] {
        try {
            return this.reservationTable.findAll().filter(r => offeredRideIds.includes(r.rideId));
        } catch (e) {
            throw new GetReservationsError("Impossible to get reservations", StatusCodes.InternalServerError, e);
        }
    }

    public async createReservation(rideId: number, userId: number): Promise<number> {
        try {
            return await this.reservationTable.insert({ rideId, userId, accepted: false });
        } catch (e) {
            throw new CreateReservationsError("Error during reservation creatuion", StatusCodes.InternalServerError, e);
        }
    }

    public getReservationById(reservationId: number): ReservationDto | undefined {
        try {
            return this.reservationTable.findById(reservationId);
        } catch (e) {
            throw new CreateReservationsError(
                `Error finding reservation with id ${reservationId}`,
                StatusCodes.NotFound,
                e
            );
        }
    }

    public async acceptReservation(offeredRideIds: number[], reservation: ReservationDto, reservationNotificationData: ReservationNotificationData): Promise<void> {
        try {
            const reservationId = reservation.id;
            if (reservationId === undefined || reservationId === null) {
                throw new ReservationIdUndefinedError(
                    "Reservation id is undefined",
                    StatusCodes.InternalServerError,
                    null
                );
            }
            if (!offeredRideIds.includes(reservation.rideId)) {
                throw new ReservationOperationUnathorizedError(
                    `Authenticated user has no right on reservation ${reservationId}`,
                    StatusCodes.Forbidden,
                    null
                );
            }
            if (reservation.accepted) {
                throw new ReservationAlreadyAcceptedError(
                    `Reservation with id ${reservationId} is already accepted`,
                    StatusCodes.BadRequest,
                    null
                );
            }

            reservation.accepted = true;
            await this.reservationTable.update(reservationId, reservation);
            this.eventManager.emit(EventKeys.ReservationAcceptation, reservationNotificationData);
        } catch (e) {
            throw new AcceptReservationError(
                `Error accepting reservation with id ${reservation.id}`,
                StatusCodes.InternalServerError,
                e
            );
        }
    }

    public async deleteReservation(offeredRideIds: number[], reservation: ReservationDto) {
        try {
            const reservationId = reservation.id;
            if (reservationId === undefined || reservationId === null) {
                throw new ReservationIdUndefinedError(
                    "Reservation id is undefined",
                    StatusCodes.InternalServerError,
                    null
                );
            }
            if (!offeredRideIds.includes(reservation.rideId)) {
                throw new ReservationOperationUnathorizedError(
                    `Authenticated user has no right on reservation ${reservationId}`,
                    StatusCodes.Forbidden,
                    null
                );
            }

            await this.reservationTable.delete(reservationId);
            this.eventManager.emit(EventKeys.ReservationElimination, { reservationId });
        } catch (e) {
            throw new DeleteReservationError(
                `Error removing reservation with id ${reservation.id}`,
                StatusCodes.InternalServerError,
                e
            );
        }
    }

    private async cascadeDeleteReservations(rideId: number) {
        try {
            await Promise.all(
                this.reservationTable
                    .findAll()
                    .filter(r => r.rideId === rideId)
                    .map(r => this.reservationTable.delete(r.id as number))
            );
        } catch (e) {
            console.error(e);
        }
    }
}
