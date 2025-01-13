import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { injectable, inject } from "tsyringe";
import { CommunityService } from "./community.service.js";
import { Controller } from "../controller.js";
import { ErrorHelper } from "../helper/error.helper.js";

@injectable()
export class CommunityController implements Controller {
    public constructor(@inject(CommunityService) private communityService: CommunityService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/communities", this.getCommunities.bind(this));
    }

    private getCommunities(_req: FastifyRequest, rep: FastifyReply): void {
        try {
            rep.send(this.communityService.getAllCommunities());
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
