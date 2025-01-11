import { CustomError } from "../common/custom.error.js";

export class CommunityNotFoundError extends CustomError {}
export class CommunityVerificationCodeUnmatchNotFoundError extends CustomError {}
export class EmailAlreadyPresentError extends CustomError {}
export class InvalidPasswordError extends CustomError {}
export class InvalidTokenError extends CustomError {}
export class NicknameAlreadyPresentError extends CustomError {}
export class NickNameDoesntExistError extends CustomError {}
