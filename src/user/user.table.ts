import { inject, singleton } from "tsyringe";
import { Table } from "../database/table";
import UserDto from "green-wheels-core/src/user/user.dto";
import { DatabaseService } from "../database/database.service";
import { TableNames } from "../database/table-names";

@singleton()
export class UserTable extends Table<UserDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.USER_TABLE_NAME);
    }
}
