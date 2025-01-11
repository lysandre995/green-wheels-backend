import { inject, singleton } from "tsyringe";
import CommunityDto from "green-wheels-core/src/community/community.dto";
import { CommunityTable } from "./community.table.js";
import { Initializable } from "../common/initializable.js";

@singleton()
export class CommunityService implements Initializable {
    public constructor(@inject(CommunityTable) private readonly communityTable: CommunityTable) {}

    public async initialize(): Promise<void> {
        return;
    }

    public getAllCommunities(): CommunityDto[] {
        return this.communityTable.findAll();
    }

    public getCommunityById(id: number): CommunityDto | undefined {
        return this.communityTable.findById(id);
    }
}
