import { inject, singleton } from "tsyringe";
import CommunityDto from "green-wheels-core/src/community/community.dto";
import { CommunityTable } from "./community.table.js";

@singleton()
export class CommunityService {
    public constructor(@inject(CommunityTable) private readonly communityTable: CommunityTable) {}

    public getAllCommunities(): CommunityDto[] {
        return this.communityTable.findAll();
    }
}
