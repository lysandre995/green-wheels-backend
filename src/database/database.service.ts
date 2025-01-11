import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { singleton } from "tsyringe";
import { DatabaseSchema } from "./database.schema";
import { dirname, join } from "path";
import { Initializable } from "../common/initializable";
import { fileURLToPath } from "url";
import { TableCreationError } from "./error/table-creation.error.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { TableClearingError } from "./error/table-clearing.error.js";
import { TableDeletionError } from "./error/table-deletion.error.js";

@singleton()
export class DatabaseService implements Initializable {
    private readonly db: Low<DatabaseSchema>;
    public constructor() {
        const __fileName = fileURLToPath(import.meta.url);
        const __dirname = dirname(__fileName);
        const file = join(__dirname, "db.json");
        const adapter = new JSONFile<DatabaseSchema>(file);
        this.db = new Low<DatabaseSchema>(adapter, {});
    }

    public async initialize(): Promise<void> {
        await this.db.read();
        this.db.data ||= {};
        await this.db.write();
    }

    public async updateDb(): Promise<void> {
        await this.db.write();
    }

    public async deleteDatabase(): Promise<void> {
        this.db.data = {};
        await this.db.write();
    }

    public async createTable<T>(tableName: string): Promise<T[]> {
        try {
            await this.db.read();
            if (this.db.data[tableName] === undefined) {
                this.db.data[tableName] = [];
                await this.db.write();
                return this.db.data[tableName] as T[];
            }
            return this.db.data[tableName] as T[];
        } catch (e) {
            throw new TableCreationError(`Impossible to create table ${tableName}`, StatusCodes.InternalServerError);
        }
    }

    public async removeTable(tableName: string): Promise<void> {
        try {
            if (this.db.data[tableName] !== undefined) {
                delete this.db.data![tableName];
                await this.db.write();
            }
        } catch (e) {
            throw new TableDeletionError(`Impossible to delete table ${tableName}`, StatusCodes.InternalServerError);
        }
    }

    public async clearTable(tableName: string): Promise<void> {
        try {
            if (this.db.data[tableName] !== undefined) {
                this.db.data![tableName] = [];
                await this.db.write();
            }
        } catch (e) {
            throw new TableClearingError(`Impossible to delete table ${tableName}`, StatusCodes.InternalServerError);
        }
    }

    public refreshTableReference<T>(tableName: string): T[] {
        try {
            return this.db.data[tableName] as T[]
        } catch (e) {
            throw e;
        }
    }
}
