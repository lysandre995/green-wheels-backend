import { inject, singleton } from "tsyringe";
import { Table } from "../database/table.js";
import EvaluationDto from "green-wheels-core/src/evaluation/evaluation.dto.js";
import { DatabaseService } from "../database/database.service.js";
import { TableNames } from "../database/table-names.js";

@singleton()
export class EvaluationTable extends Table<EvaluationDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.EVALUATION_TABLE_NAME);
    }
}
