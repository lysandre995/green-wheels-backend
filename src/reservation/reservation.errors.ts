import { CustomError } from "../common/custom.error.js";

export class GetReservationsError extends CustomError {}
export class CreateReservationsError extends CustomError {}
export class FindReservationError extends CustomError {}
export class ReservationIdUndefinedError extends CustomError {}
export class ReservationOperationUnathorizedError extends CustomError {}
export class AcceptReservationError extends CustomError {}
export class DeleteReservationError extends CustomError {}
export class ReservationAlreadyExistsError extends CustomError {}
export class ReservationAlreadyAcceptedError extends CustomError {}
