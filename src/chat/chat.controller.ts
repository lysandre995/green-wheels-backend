import { inject, singleton } from "tsyringe";
import { Controller } from "../controller";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "../common/status-codes.enum.js";
import { ErrorHelper } from "../helper/error.helper.js";
import { ChatService } from "./chat.service.js";
import MessageDto from "green-wheels-core/src/message/message.dto.js";
import { UserService } from "../user/user.service.js";
import { NoReplyReceiverError, SelfSentMessageError } from "./chat.errors.js";

@singleton()
export class ChatController implements Controller {
    public constructor(
        @inject(ChatService) private readonly chatService: ChatService,
        @inject(UserService) private readonly userService: UserService
    ) {}

    public registerRoutes(app: FastifyInstance): void {
        app.get("/chat", { preHandler: [app.authenticate] }, this.getMessages.bind(this));
        app.post("/chat", { preHandler: [app.authenticate] }, async (req, rep) =>
            this.writeMessage(req as FastifyRequest<{ Body: { message: MessageDto } }>, rep)
        );
    }

    private getMessages(req: FastifyRequest, rep: FastifyReply) {
        try {
            const userId = (req as any).user.id;
            const rawMessages = JSON.parse(JSON.stringify(this.chatService.getMesseges(userId))) as MessageDto[];
            const processedMessages = rawMessages.map(rm => {
                const from = this.userService.getUserById(rm.from);
                const to = this.userService.getUserById(rm.to);
                (rm as any).from = { id: rm.from, username: from?.username };
                (rm as any).to = { id: rm.to, username: to?.username };
                return rm;
            });
            rep.code(StatusCodes.OK).send(processedMessages);
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }

    private async writeMessage(req: FastifyRequest<{ Body: { message: MessageDto } }>, rep: FastifyReply) {
        try {
            const userId = (req as any).user.id;
            const message = req.body.message;
            message.from = userId;
            message.dateTime = new Intl.DateTimeFormat('it-IT', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }).format(new Date(message.dateTime));
            if (userId === message.to) {
                throw new SelfSentMessageError("Sender and receiver are the same!", StatusCodes.BadRequest, null);
            }
            if (message.to === 0) {
                throw new NoReplyReceiverError("Receiver is no reply", StatusCodes.BadRequest, null);
            }
            rep.code(StatusCodes.OK).send(await this.chatService.writeMessage(message));
        } catch (e) {
            ErrorHelper.manageError(e, rep);
        }
    }
}
