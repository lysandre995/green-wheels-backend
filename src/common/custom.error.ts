export class CustomError extends Error {
    public statusCode: number;
    public info: any;

    public constructor(message: string, statusCode: number, info: any) {
        super(message);

        this.statusCode = statusCode;
        this.name = this.constructor.name;
        this.info = info;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
