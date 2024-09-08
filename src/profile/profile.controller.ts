import { inject, singleton } from "tsyringe";
import { ProfileService } from "./profile.service.js";
import { Controller } from "../controller";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ProfileDto from "green-wheels-core/src/profile/profile.dto";

@singleton()
export class ProfileController implements Controller {
    public constructor(@inject(ProfileService) private readonly profileService: ProfileService) {}
    
    public registerRoutes(app: FastifyInstance): void {
        app.get("/profile/:id", { preHandler: [app.authenticate] }, (req, rep) => this.getProfile(req as FastifyRequest<{Params: {id: number}}>, rep));
        app.post("/profile", { preHandler: [app.authenticate] }, async (req, rep) => this.addProfile(req as FastifyRequest<{ Body: { profile: ProfileDto } }>, rep));
        app.put("/profile", { preHandler: [app.authenticate] }, async (req, rep) => this.updateProfile(req as FastifyRequest<{ Body: { profile: ProfileDto } }>, rep));
        app.delete("/profile/:id", { preHandler: [app.authenticate] }, async (req, rep) => this.deleteProfile(req as FastifyRequest<{ Params: { id: number } }>, rep));
    }

    private getProfile(request: FastifyRequest<{Params: {id: number}}>, reply: FastifyReply): void {
        const userId = request.params.id;
        reply.code(200).send(this.profileService.getProfile(userId));
    }

    private async addProfile(request: FastifyRequest<{ Body: { profile: ProfileDto } }>, reply: FastifyReply): Promise<void> {
        const profile = request.body.profile;
        await this.profileService.addProfile(profile);
        reply.code(200).send("Profile added");
    }

    private updateProfile(request: FastifyRequest<{ Body: { profile: ProfileDto } }>, reply: FastifyReply): void {
        const profile = request.body.profile;
        this.profileService.addProfile(profile);
        reply.code(200).send("Profile updated");
    }

    private async deleteProfile(request: FastifyRequest<{ Params: { id: number } }>, reply: FastifyReply): Promise<void> {
        const id = Number(request.params.id);
        await this.profileService.deleteProfile(id);
        reply.code(200).send("Profile deleted");
    }
}
