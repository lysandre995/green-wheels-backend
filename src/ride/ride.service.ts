import { inject, singleton } from "tsyringe";
import { RideTable } from "./ride.table.js";
import { Initializable } from "../common/initializable.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import RideDto from "green-wheels-core/src/ride/ride.dto";
import { RideNotFoundError, UserInvalidRideOperationError } from "./ride.errors.js";

@singleton()
export class RideService implements Initializable {
    public constructor(@inject(RideTable) private readonly rideTable: RideTable) {}

    public async initialize(): Promise<void> {
        return;
    }

    public getOfferedRides(userId: number): RideDto[] {
        return this.rideTable.findAll().filter(ride => {
            return ride.driverId == userId;
        });
    }

    public getAvailableRides(userId: number, communityId?: number): RideDto[] {
        return this.rideTable.findAll().filter(ride => {
            return ride.driverId !== userId && (ride.communityId === communityId || !ride.communityId);
        });
    }

    public async insertRide(ride: RideDto): Promise<number> {
        return await this.rideTable.insert(ride);
    }

    public async deleteRide(rideId: number, userId: number): Promise<void> {
        const ride = this.rideTable.findById(rideId);
        if (ride) {
            if (ride.driverId === userId) {
                return await this.rideTable.delete(rideId);
            }
            throw new UserInvalidRideOperationError(
                `User ${userId} is not the owner of ride ${rideId}. Request denied.`,
                StatusCodes.Forbidden,
                null
            );
        }
        throw new RideNotFoundError(`Ride with id: ${rideId} not found`, StatusCodes.NotFound, null);
    }
}
