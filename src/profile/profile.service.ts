import ProfileDto from "green-wheels-core/src/profile/profile.dto";
import { inject, singleton } from "tsyringe";
import { ProfileTable } from "./profile.table.js";
import { UserIdAlreadyPresentError } from "./user-id-already-present.error.js";
import { UndefinedIdError } from "./undefined-id.error.js";
import { UserIdNotPresentError } from "./user-id-not-present.error.js";
import { Initializable } from "../common/initializable.js";

@singleton()
export class ProfileService implements Initializable {
public constructor(@inject(ProfileTable) private readonly profileTable: ProfileTable) {}

    public async initialize(): Promise<void> {
        return;
    }

    public getProfile(userId: number): ProfileDto | undefined {
        return this.profileTable.findById(userId);
    }

    public async addProfile(profile: ProfileDto): Promise<void> {
        if (this.profileTable.findById(Number(profile.id) as number) === undefined) {
            await this.profileTable.insert(profile);
            return;
        }
        throw new UserIdAlreadyPresentError("Profile with this id already exists");
    }

    public async updateProfile(profile: ProfileDto): Promise<void> {
        if (profile.id !== undefined) {
            if (this.profileTable.findById(profile.id as number) !== undefined) {
                await this.profileTable.update(profile.id, profile);
                return;
            }
            throw new UserIdNotPresentError("No profile has this id");
        }
        throw new UndefinedIdError("A profile must have an id defined");
    }

    public async deleteProfile(id: number): Promise<void> {
        if (id !== undefined) {
            await this.profileTable.delete(id);
        }
        throw new UndefinedIdError("A profile must have an id defined");
    }
}