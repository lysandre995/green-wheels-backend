import { inject, singleton } from "tsyringe";
import UserDto from "green-wheels-core/src/user/user.dto";
import { UserTable } from "./user.table";

@singleton()
export class UserService {
    public constructor(@inject(UserTable) private readonly userTable: UserTable) {}

    public getAllUsers(): UserDto[] {
        return this.userTable.findAll();
    }

    public getUserById(id: number): UserDto | undefined {
        return this.userTable.findById(id);
    }

    public getUsersByIds(ids: number[]): UserDto[] | undefined {
        return this.userTable.findByIds(ids);
    }

    public async insertUser(user: UserDto): Promise<number> {
        return await this.userTable.insert(user);
    }

    public async deleteUser(id: number): Promise<void> {
        return await this.userTable.delete(id);
    }
}
