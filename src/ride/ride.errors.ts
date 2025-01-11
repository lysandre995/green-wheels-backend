import { CustomError } from "../common/custom.error.js";

export class RideNotFoundError extends CustomError {}
export class UserInvalidRideOperationError extends CustomError {}
export class RideCreationProfileNeededError extends CustomError {}
