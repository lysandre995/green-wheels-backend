export class TableDeletionError extends Error {
    public statusCode: number;

    public constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        this.name = this.constructor.name;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
