import { inject, singleton } from "tsyringe";
import { Table } from "../database/table.js";
import ReservationDto from "green-wheels-core/src/reservation/reservation.dto.js";
import { DatabaseService } from "../database/database.service.js";
import { TableNames } from "../database/table-names.js";

@singleton()
export class ReservationTable extends Table<ReservationDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.RESERVATION_TABLE_NAME);
    }
}
