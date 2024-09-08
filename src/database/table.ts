import { inject } from "tsyringe";
import { DatabaseService } from "./database.service.js";
import { Initializable } from "../common/initializable.js";

export abstract class Table<T> implements Initializable {
    protected table: T[] | undefined;
    public constructor(
        @inject(DatabaseService) private readonly dbService: DatabaseService,
        protected readonly tableName: string
    ) {}

    public async initialize(): Promise<void> {
        this.table = await this.dbService.createTable(this.tableName);
    }

    public findAll(): T[] {
        if (this.table !== undefined) {
            return this.table;
        }
        throw new Error(`Table not initialized, missing ${this.tableName} table`);
    }

    public findById(id: number): T | undefined {
        if (this.table !== undefined) {
            return this.table.find(t => (t as { id: number }).id === id);
        }
        throw new Error(`Table not initialized, missing ${this.tableName} table`);
    }

    public findByIds(ids: number[]): T[] | undefined {
        if (this.table !== undefined) {
            return this.table.filter(t => ids.includes((t as { id: number }).id));
        }
        throw new Error(`Table not initialized, missing ${this.tableName} table`);
    }

    public async insert(object: T): Promise<number> {
        if (this.table !== undefined) {
            let id = 0;
            if (this.table.length > 0) {
                const maxIdItem = (this.table as { id: number }[]).reduce(
                    (maxItem, currentItem) => {
                        if (currentItem.id > maxItem.id) {
                            return currentItem;
                        }
                        return maxItem;
                    },
                    this.table[0] as { id: number }
                );
                id = maxIdItem.id + 1;
            }
            (object as { id: number }).id = id;
            this.table.push(object);
            await this.dbService.updateDb();
            return id;
        }
        throw new Error(`Table not initialized, missing ${this.tableName} table`);
    }
    
    public async update(id: number, updatedObject: Partial<T>): Promise<void> {
        if (this.table !== undefined) {
            const index = this.table.findIndex(t => (t as { id: number }).id === id);
            if (index !== -1) {
                this.table[index] = { ...this.table[index], ...updatedObject };
                await this.dbService.updateDb();
                return;
            }
            throw new Error(`Item with id ${id} not found in ${this.tableName} table`);
        }
        throw new Error(`Table not initialized, missing ${this.tableName} table`);
    }

    public async delete(id: number): Promise<void> {
        if (this.table !== undefined) {
            const elementToDelete = this.table.find(t => (t as { id: number }).id === id);
            if (elementToDelete !== undefined) {
                const elementToDeleteIndex = this.table.indexOf(elementToDelete);
                this.table.splice(elementToDeleteIndex, 1);
                await this.dbService.updateDb();
            }
            return;
        }
        throw new Error(`Table not initialized, missing ${this.tableName} table`);
    }

    public async reset(): Promise<void> {
        await this.dbService.clearTable(this.tableName);
    }
}
