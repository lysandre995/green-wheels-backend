import { inject, singleton } from "tsyringe";
import { Initializable } from "../common/initializable.js";
import { EventKeys } from "../event/event-keys.enum.js";
import { EventManager } from "../event/event.manager.js";
import { EvaluationTable } from "./evaluation.table.js";
import { CustomError } from "../common/custom.error.js";
import { StatusCodes } from "../common/status-codes.enum.js";

@singleton()
export class EvaluationService implements Initializable {
    public constructor(
        @inject(EvaluationTable) private readonly evaluationTable: EvaluationTable,
        @inject(EventManager) private readonly eventManager: EventManager
    ) {}

    public async initialize(): Promise<void> {
        this.eventManager.on(EventKeys.RideConcluded, async e => await this.createEvaluation((e as any).detail));
        return;
    }

    private async createEvaluation(detail: { driverId: number; token: string }) {
        try {
            await this.evaluationTable.insert({
                driverId: detail.driverId,
                token: detail.token,
                done: false
            });
        } catch (e) {
            console.error(e);
        }
    }

    public async makeEvaluation(token: string, rating: number) {
        try {
            const evaluation = this.evaluationTable
                .findAll()
                .filter(e => e.token === token && !e.done)
                .at(0);
            if (evaluation === undefined || evaluation === null) {
                throw new CustomError(`Evaluation not found!`, StatusCodes.NotFound, null);
            }
            evaluation.done = true;
            await this.evaluationTable.update(evaluation.id as number, evaluation);
            this.eventManager.emit(EventKeys.DriverEvaluated, { userId: evaluation.driverId, rating });
        } catch (e) {
            throw new CustomError("Error making evaluation", StatusCodes.InternalServerError, e);
        }
    }
}
