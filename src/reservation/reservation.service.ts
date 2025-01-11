import { inject, singleton } from "tsyringe";
import { Initializable } from "../common/initializable.js";
import { ReservationTable } from "./reservation.table.js";
import ReservationDto from "green-wheels-core/src/reservation/reservation.dto.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { AcceptReservationError, CreateReservationsError, DeleteReservationError, GetReservationsError, ReservationIdUndefinedError, ReservationOperationUnathorizedError } from "./reservation.errors.js";

@singleton()
export class ReservationService implements Initializable {
    public constructor(@inject(ReservationTable) private readonly reservationTable: ReservationTable) {}

    public async initialize(): Promise<void> {
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
            throw new CreateReservationsError(`Error finding reservation with id ${reservationId}`, StatusCodes.NotFound, e);
        }
    }

    public async acceptReservation(offeredRideIds: number[], reservation: ReservationDto): Promise<void> {
        try {
            if (!reservation.id) {
                throw new ReservationIdUndefinedError("Reservation id is undefined", StatusCodes.InternalServerError, null);
            }
            if (!offeredRideIds.includes(reservation.id)) {
                throw new ReservationOperationUnathorizedError(`Authenticated user has no right on reservation ${reservation.id}`, StatusCodes.Forbidden, null);
            }

            await this.reservationTable.update(reservation.id, reservation);
        } catch (e) {
            throw new AcceptReservationError(`Error accepting reservation with id ${reservation.id}`, StatusCodes.InternalServerError, e);
        }
    }

    public async deleteReservation(offeredRideIds: number[], reservation: ReservationDto) {
        try {
            if (!reservation.id) {
                throw new ReservationIdUndefinedError("Reservation id is undefined", StatusCodes.InternalServerError, null);
            }
            if (!offeredRideIds.includes(reservation.id)) {
                throw new ReservationOperationUnathorizedError(`Authenticated user has no right on reservation ${reservation.id}`, StatusCodes.Forbidden, null);
            }

            await this.reservationTable.delete(reservation.id);
        } catch (e) {
            throw new DeleteReservationError(`Error removing reservation with id ${reservation.id}`, StatusCodes.InternalServerError, e);
        }
    }
}
