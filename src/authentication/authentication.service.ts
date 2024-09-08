import { inject, singleton } from "tsyringe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserDto from "green-wheels-core/src/user/user.dto";
import { NicknameAlreadyPresentError } from "./error/nickname-already-present.error.js";
import { EmailAlreadyPresentError } from "./error/email-already-present.error.js";
import { UserService } from "../user/user.service.js";
import { NickNameDoesntExistError } from "./error/nickname-doesnt-exist.error.js";
import { InvalidPasswordError } from "./error/invalid-password.error.js";
import { InvalidTokenError } from "./error/invalid-token.error.js";
import { Initializable } from "../common/initializable";

@singleton()
export class AuthenticationService implements Initializable {
    private static readonly SALT_ROUNDS = 10;
    private static readonly SECRET_KEY = "0191cd35-044f-7eb0-a8ec-bc5a544b3dc2";
    private static readonly TOKEN_EXPIRY = "1h";

    public constructor(@inject(UserService) private readonly userService: UserService) {}
    
    public async initialize(): Promise<void> {
        return;    
    }

    public async register(user: UserDto): Promise<void> {
        this.userService.getAllUsers().forEach(u => {
            if (u.username === user.username) {
                throw new NicknameAlreadyPresentError('The chosen nickname has already been used');
            }
            if (u.email === user.email) {
                throw new EmailAlreadyPresentError('The chosen email has already been used');
            }
        });
        user.password = await bcrypt.hash(user.password, AuthenticationService.SALT_ROUNDS);
        await this.userService.insertUser(user);
    }

    public async login(username: string, password: string): Promise<string> {
        const user = this.userService.getAllUsers().find(u => u.username === username);
        if (user === undefined) {
            throw new NickNameDoesntExistError("The given nickname doesn't exist");
        }
        if (!(await bcrypt.compare(password, user.password))) {
            throw new InvalidPasswordError("The given password is invalid");
        }

        return jwt.sign({ username, id: user.id }, AuthenticationService.SECRET_KEY, { expiresIn: AuthenticationService.TOKEN_EXPIRY});
    }

    public validateToken(token: string): string | jwt.JwtPayload {
        try {
            return jwt.verify(token, AuthenticationService.SECRET_KEY)
        } catch {
            throw new InvalidTokenError(`The given token is invalid: ${token}`);
        }
    }
}