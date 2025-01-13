import { CustomError } from "../common/custom.error.js";

export class ReadMessageError extends CustomError {}
export class WriteMessageError extends CustomError {}
export class SelfSentMessageError extends CustomError {}
export class NoReplyReceiverError extends CustomError {}
