import { CustomError } from "../common/custom.error.js";

export class RideNotFoundError extends CustomError {}
export class UserInvalidRideOperationError extends CustomError {}
export class RideCreationProfileNeededError extends CustomError {}
export class StartRideError extends CustomError {}
export class FinishRideError extends CustomError {}
export class UpdateRideError extends CustomError {}
