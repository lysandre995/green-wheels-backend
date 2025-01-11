import { inject, singleton } from "tsyringe";
import { Table } from "../database/table.js";
import RideDto from "green-wheels-core/src/ride/ride.dto";
import { DatabaseService } from "../database/database.service.js";
import { TableNames } from "../database/table-names.js";

@singleton()
export class RideTable extends Table<RideDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.RIDE_TABLE_NAME);
    }
}
