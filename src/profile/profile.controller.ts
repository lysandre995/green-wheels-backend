import { inject, singleton } from "tsyringe";
import { ProfileService } from "./profile.service.js";
import { Controller } from "../controller";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import ProfileDto from "green-wheels-core/src/profile/profile.dto";
import { StatusCodes } from "../common/status-codes.enum.js";
import { ErrorHelper } from "../helper/error.helper.js";
import { ProfileOperationUnathorized } from "./profile.errors.js";
import { UserIdAlreadyPresentError } from "./user-id-already-present.error.js";

@singleton()
export class ProfileController implements Controller {
    public constructor(@inject(ProfileService) private readonly profileService: ProfileService) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/profile", { preHandler: [app.authenticate] }, this.getProfile.bind(this));
        app.post("/profile", { preHandler: [app.authenticate] }, async (req, rep) =>
            this.addProfile(req as FastifyRequest<{ Body: { profile: ProfileDto } }>, rep)
        );
        app.put("/profile", { preHandler: [app.authenticate] }, async (req, rep) =>
            this.updateProfile(req as FastifyRequest<{ Body: { profile: ProfileDto } }>, rep)
        );
        app.delete("/profile", { preHandler: [app.authenticate] }, this.deleteProfile.bind(this));
    }

    private getProfile(req: FastifyRequest, rep: FastifyReply): void {
        try {
            const userId = Number((req as any).user.id);
            const profile = this.profileService.getProfile(userId);
            rep.code(StatusCodes.OK).send(profile);
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async addProfile(
        req: FastifyRequest<{ Body: { profile: ProfileDto } }>,
        rep: FastifyReply
    ): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const profile = req.body.profile;
            profile.userId = userId;
            const alreadyExists = !!this.profileService.getProfile(userId);
            if (alreadyExists) {
                throw new UserIdAlreadyPresentError("Profile with this id already exists");
            }
            const profileId = await this.profileService.addProfile(profile);
            rep.code(StatusCodes.OK).send({ profileId });
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private updateProfile(req: FastifyRequest<{ Body: { profile: ProfileDto } }>, rep: FastifyReply): void {
        try {
            const userId = (req as any).user.id;
            const newProfile = req.body.profile;
            const oldProfile = this.profileService.getProfile(userId);
            if (userId !== oldProfile?.userId) {
                throw new ProfileOperationUnathorized(
                    `User ${userId} cannot operate on profile ${newProfile.id}`,
                    StatusCodes.Forbidden,
                    null
                );
            }
            newProfile.id = oldProfile?.id;
            this.profileService.updateProfile(newProfile);
            rep.code(StatusCodes.Accepted).send("Profile updated");
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async deleteProfile(req: FastifyRequest, rep: FastifyReply): Promise<void> {
        try {
            const userId = (req as any).user.id;
            const profile = this.profileService.getProfile(userId);
            const profileId = profile?.id as number;
            if (!profile || userId !== profile.userId) {
                throw new ProfileOperationUnathorized(
                    `User ${userId} cannot operate on profile ${profileId}`,
                    StatusCodes.Forbidden,
                    null
                );
            }
            await this.profileService.deleteProfile(profileId, userId);
            rep.code(StatusCodes.OK).send("Profile deleted");
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
