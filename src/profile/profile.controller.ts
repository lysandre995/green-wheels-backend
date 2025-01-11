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

    private getProfile(request: FastifyRequest, reply: FastifyReply): void {
        try {
            const userId = Number((request as any).user.id);
            const profile = this.profileService.getProfile(userId);
            reply.code(StatusCodes.OK).send(profile);
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private async addProfile(
        request: FastifyRequest<{ Body: { profile: ProfileDto } }>,
        reply: FastifyReply
    ): Promise<void> {
        try {
            const userId = (request as any).user.id;
            const profile = request.body.profile;
            profile.userId = userId;
            const alreadyExists = !!this.profileService.getProfile(userId);
            if (alreadyExists) {
                throw new UserIdAlreadyPresentError("Profile with this id already exists");
            }
            const profileId = await this.profileService.addProfile(profile);
            reply.code(StatusCodes.OK).send({ profileId });
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private updateProfile(request: FastifyRequest<{ Body: { profile: ProfileDto } }>, reply: FastifyReply): void {
        try {
            const userId = (request as any).user.id;
            const newProfile = request.body.profile;
            const oldProfile = this.profileService.getProfile(userId);
            if (
                !newProfile.id ||
                newProfile.id !== oldProfile?.id ||
                userId !== newProfile.userId ||
                userId !== oldProfile?.userId
            ) {
                throw new ProfileOperationUnathorized(
                    `User ${userId} cannot operate on profile ${newProfile.id}`,
                    StatusCodes.Forbidden,
                    null
                );
            }
            this.profileService.updateProfile(newProfile);
            reply.code(StatusCodes.Accepted).send("Profile updated");
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }

    private async deleteProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        try {
            const userId = (request as any).user.id;
            const profile = this.profileService.getProfile(userId);
            const profileId = profile?.id as number;
            if (!profile || userId !== profile.userId) {
                throw new ProfileOperationUnathorized(
                    `User ${userId} cannot operate on profile ${profileId}`,
                    StatusCodes.Forbidden,
                    null
                );
            }
            await this.profileService.deleteProfile(profileId);

            // if the profile is deleted also the rides must be removed

            reply.code(StatusCodes.OK).send("Profile deleted");
        } catch (e) {
            ErrorHelper.manageError(e, reply);
        }
    }
}
