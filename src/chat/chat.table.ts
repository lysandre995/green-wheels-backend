import { inject, singleton } from "tsyringe";
import { Table } from "../database/table.js";
import MessageDto from "green-wheels-core/src/message/message.dto";
import { DatabaseService } from "../database/database.service.js";
import { TableNames } from "../database/table-names.js";

@singleton()
export class ChatTable extends Table<MessageDto> {
    public constructor(@inject(DatabaseService) databaseService: DatabaseService) {
        super(databaseService, TableNames.CHAT_TABLE_NAME);
    }
}
