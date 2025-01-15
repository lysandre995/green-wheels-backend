import { inject, singleton } from "tsyringe";
import { Controller } from "../controller";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../common/status-codes.enum.js";
import { ErrorHelper } from "../helper/error.helper.js";
import { EvaluationService } from "./evaluation.service.js";

@singleton()
export class EvaluationController implements Controller {
    public constructor(@inject(EvaluationService) private readonly evaluationService: EvaluationService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.put(
            "/evaluation",
            { preHandler: [app.authenticate] },
            async (req, rep) =>
                await this.makeEvaluation(req as FastifyRequest<{ Body: { token: string; rating: number } }>, rep)
        );
    }

    private async makeEvaluation(
        req: FastifyRequest<{ Body: { token: string; rating: number } }>,
        rep: FastifyReply
    ): Promise<void> {
        try {
            await this.evaluationService.makeEvaluation(req.body.token, Number(req.body.rating));
            rep.code(StatusCodes.OK).send({ success: true });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
