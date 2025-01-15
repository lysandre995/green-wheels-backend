import { inject, singleton } from "tsyringe";
import UserDto from "green-wheels-core/src/user/user.dto";
import { UserTable } from "./user.table.js";
import { Initializable } from "../common/initializable.js";
import { EventManager } from "../event/event.manager.js";
import { EventKeys } from "../event/event-keys.enum.js";
import { CustomError } from "../common/custom.error.js";
import { StatusCodes } from "../common/status-codes.enum.js";

@singleton()
export class UserService implements Initializable {
    public constructor(
        @inject(UserTable) private readonly userTable: UserTable,
        @inject(EventManager) private readonly eventManager: EventManager
    ) {}

    public async initialize(): Promise<void> {
        this.eventManager.on(EventKeys.DriverEvaluated, async e => await this.evaluateUser((e as any).detail));
        return;
    }

    public getAllUsers(): UserDto[] {
        try {
            return this.userTable.findAll();
        } catch (e) {
            return [];
            console.error(e);
        }
    }

    public getUserById(id: number): UserDto | undefined {
        try {
            return this.userTable.findById(id);
        } catch (e) {
            console.error(e);
        }
    }

    public getUsersByIds(ids: number[]): UserDto[] | undefined {
        try {
            return this.userTable.findByIds(ids);
        } catch (e) {
            console.error(e);
        }
    }

    public async insertUser(user: UserDto): Promise<number> {
        try {
            return await this.userTable.insert(user);
        } catch (e) {
            throw new CustomError("Error inserting user", StatusCodes.InternalServerError, e);
        }
    }

    public async deleteUser(id: number): Promise<void> {
        try {
            return await this.userTable.delete(id);
        } catch (e) {
            console.error(e);
        }
    }

    private async evaluateUser(detail: { userId: number; rating: number }) {
        try {
            const user = this.userTable.findById(detail.userId);
            if (user === undefined || user === null) {
                throw new CustomError("Error evaluating user", StatusCodes.InternalServerError, null);
            }
            user.numberOfEvaluations =
                user.numberOfEvaluations !== undefined && user.numberOfEvaluations !== null ?
                    user.numberOfEvaluations++
                :   1;
            user.averageRate =
                user.averageRate !== undefined && user.averageRate !== null ?
                    (user.averageRate + detail.rating) / user.numberOfEvaluations
                :   user.averageRate;

            await this.userTable.update(detail.userId, user);
        } catch (e) {
            console.error(e);
        }
    }
}
