import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { singleton } from "tsyringe";
import { DatabaseSchema } from "./database.schema";
import { dirname, join } from "path";
import { Initializable } from "../common/initializable";
import { fileURLToPath } from "url";

@singleton()
export class DatabaseService implements Initializable {
    private readonly db: Low<DatabaseSchema>;
    public constructor() {
        const __fileName = fileURLToPath(import.meta.url)
        const __dirname  = dirname(__fileName)
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
        if (this.db.data[tableName] === undefined) {
            this.db.data[tableName] = [];
            await this.db.write();
            return this.db.data[tableName] as T[];
        }
        throw new Error(`Impossible to create table ${tableName}`);
    }

    public async removeTable(tableName: string): Promise<void> {
        if (this.db.data[tableName] !== undefined) {
            delete this.db.data![tableName];
            await this.db.write();
        }
    }

    public async clearTable(tableName: string): Promise<void> {
        if (this.db.data[tableName] !== undefined) {
            this.db.data![tableName] = [];
            await this.db.write();
        }
    }
}
