import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { injectable, inject } from "tsyringe";
import { CommunityService } from "./community.service.js";
import { Controller } from "../controller.js";

@injectable()
export class CommunityController implements Controller {
    public constructor(@inject(CommunityService) private communityService: CommunityService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/communities", this.getCommunities.bind(this));
    }

    private getCommunities(
        _request: FastifyRequest,
        reply: FastifyReply
    ): void {
        reply.send(this.communityService.getAllCommunities());
    }
}
