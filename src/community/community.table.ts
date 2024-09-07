import { inject, singleton } from "tsyringe";
import { Table } from "../database/table.js";
import CommunityDto from "green-wheels-core/src/community/community.dto";
import { DatabaseService } from "../database/database.service.js";
import { TableNames } from "../database/table-names.js";

@singleton()
export class CommunityTable extends Table<CommunityDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.COMMUNITY_TABLE_NAME);
    }
}
