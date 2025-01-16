import { inject, singleton } from "tsyringe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserDto from "green-wheels-core/src/user/user.dto";
import { UserService } from "../user/user.service.js";
import { Initializable } from "../common/initializable";
import { CommunityService } from "../community/community.service.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import {
    CommunityNotFoundError,
    CommunityVerificationCodeUnmatchNotFoundError,
    EmailAlreadyPresentError,
    InvalidPasswordError,
    InvalidTokenError,
    NicknameAlreadyPresentError,
    NickNameDoesntExistError
} from "./authentication.errors.js";

@singleton()
export class AuthenticationService implements Initializable {
    private static readonly SALT_ROUNDS = 10;
    private static readonly SECRET_KEY = "0191cd35-044f-7eb0-a8ec-bc5a544b3dc2";
    private static readonly TOKEN_EXPIRY = "1h";

    public constructor(
        @inject(UserService) private readonly userService: UserService,
        @inject(CommunityService)
        private readonly communityService: CommunityService
    ) {}

    public async initialize(): Promise<void> {
        return;
    }

    public async register(user: UserDto): Promise<void> {
        this.userService.getAllUsers().forEach(u => {
            if (u.username === user.username) {
                throw new NicknameAlreadyPresentError(
                    "The chosen nickname has already been used",
                    StatusCodes.BadRequest,
                    null
                );
            }
            if (u.email === user.email) {
                throw new EmailAlreadyPresentError(
                    "The chosen email has already been used",
                    StatusCodes.BadRequest,
                    null
                );
            }
        });
        if (user.community) {
            const community = this.communityService.getCommunityById(Number(user.community));
            if (community === undefined || community === null) {
                throw new CommunityNotFoundError(
                    `Community id ${user.community} not found`,
                    StatusCodes.NotFound,
                    null
                );
            }
            if (community && !(community.verificationCode === user.communityVerificationCode)) {
                throw new CommunityVerificationCodeUnmatchNotFoundError(
                    "Specified community verification code doesn't match",
                    StatusCodes.BadRequest,
                    null
                );
            }
        }
        user.averageRate = 0;
        user.numberOfEvaluations = 0;
        user.password = await bcrypt.hash(user.password, AuthenticationService.SALT_ROUNDS);
        await this.userService.insertUser(user);
    }

    public async login(username: string, password: string): Promise<string> {
        const user = this.userService.getAllUsers().find(u => u.username === username);
        if (user === undefined) {
            throw new NickNameDoesntExistError("The given nickname doesn't exist", StatusCodes.BadRequest, null);
        }
        if (!(await bcrypt.compare(password, user.password))) {
            throw new InvalidPasswordError("The given password is invalid", StatusCodes.BadRequest, null);
        }

        return jwt.sign({ username, id: user.id }, AuthenticationService.SECRET_KEY, {
            expiresIn: AuthenticationService.TOKEN_EXPIRY
        });
    }

    public validateToken(token: string): string | jwt.JwtPayload {
        try {
            return jwt.verify(token, AuthenticationService.SECRET_KEY);
        } catch (e) {
            throw new InvalidTokenError(`The given token is invalid: ${token}`, StatusCodes.BadRequest, e);
        }
    }
}
