import { inject, singleton } from "tsyringe";
import { Table } from "../database/table.js";
import ProfileDto from "green-wheels-core/src/profile/profile.dto"
import { DatabaseService } from "../database/database.service.js";
import { TableNames } from "../database/table-names.js";

@singleton()
export class ProfileTable extends Table<ProfileDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.PROFILE_TABLE_NAME)
    }
}
