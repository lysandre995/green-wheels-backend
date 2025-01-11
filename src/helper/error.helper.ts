import { FastifyReply } from "fastify";
import { CustomError } from "../common/custom.error.js";
import { StatusCodes } from "../common/status-codes.enum.js";

export class ErrorHelper {
    public static manageError(e: any, rep: FastifyReply) {
        try {
            if (e instanceof CustomError) {
                rep.code(e.statusCode).send(e);
            } else {
                rep.code(StatusCodes.InternalServerError).send(e);
            }
        } catch (e) {
            console.error(e);
        }
    }
}
