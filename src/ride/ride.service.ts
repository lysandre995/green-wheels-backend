import { inject, singleton } from "tsyringe";
import { RideTable } from "./ride.table.js";
import { Initializable } from "../common/initializable.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import RideDto from "green-wheels-core/src/ride/ride.dto";
import { RideNotFoundError, UserInvalidRideOperationError } from "./ride.errors.js";
import { EventManager } from "../event/event.manager.js";
import { EventKeys } from "../event/event-keys.enum.js";

@singleton()
export class RideService implements Initializable {
    public constructor(
        @inject(RideTable) private readonly rideTable: RideTable,
        @inject(EventManager) private readonly eventManager: EventManager
    ) {}

    public async initialize(): Promise<void> {
        this.eventManager.on(
            EventKeys.ProfileElimination,
            async e => await this.cascadeDeleteRides((e as any)?.detail?.userId)
        );
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
                await this.rideTable.delete(rideId);
                this.eventManager.emit(EventKeys.RideElimination, { rideId });
            }
            throw new UserInvalidRideOperationError(
                `User ${userId} is not the owner of ride ${rideId}. Request denied.`,
                StatusCodes.Forbidden,
                null
            );
        }
        throw new RideNotFoundError(`Ride with id: ${rideId} not found`, StatusCodes.NotFound, null);
    }

    private async cascadeDeleteRides(userId: number) {
        try {
            await Promise.all(
                this.rideTable
                    .findAll()
                    .filter(r => r.driverId === userId)
                    .map(r => r.id as number)
                    .map(id => this.rideTable.delete(id))
            );
        } catch (e) {
            console.error(e);
        }
    }

    public getRideById(rideId: number): RideDto | undefined {
        try {
            return this.rideTable.findById(rideId);
        } catch (e) {
            throw new RideNotFoundError(`Ride with id: ${rideId} not found`, StatusCodes.NotFound, e);
        }
    }
}
