import { inject, singleton } from "tsyringe";
import { Initializable } from "../common/initializable.js";
import { EventKeys } from "../event/event-keys.enum.js";
import { EventManager } from "../event/event.manager.js";
import { ChatTable } from "./chat.table.js";
import MessageDto from "green-wheels-core/src/message/message.dto.js";
import { ReadMessageError, WriteMessageError } from "./chat.errors.js";
import { StatusCodes } from "../common/status-codes.enum.js";
import { constants } from "../constants.js";

@singleton()
export class ChatService implements Initializable {
    public constructor(
        @inject(ChatTable) private readonly chatTable: ChatTable,
        @inject(EventManager) private readonly eventManager: EventManager
    ) {}

    public async initialize(): Promise<void> {
        this.eventManager.on(EventKeys.ReservationAcceptation, async e =>
            this.notifyReservationacceptation((e as any)?.detail)
        );
        return;
    }

    public getMesseges(userId: number) {
        try {
            return this.chatTable.findAll().filter(m => m.from === userId || m.to === userId);
        } catch (e) {
            throw new ReadMessageError(`Error reading user ${userId} messages`, StatusCodes.InternalServerError, e);
        }
    }

    public async writeMessage(message: MessageDto) {
        try {
            return await this.chatTable.insert(message);
        } catch (e) {
            throw new WriteMessageError(`Error writing message: ${message}`, StatusCodes.InternalServerError, e);
        }
    }

    private async notifyReservationacceptation(detail: {
        userId: number;
        startLocation: string;
        endLocation: string;
        date: string;
        time: string;
        driverUsername: string;
        lng: number;
        lat: number;
    }): Promise<void> {
        try {
            const message = {
                from: constants.GREEN_WHEELS_USER_ID,
                to: detail.userId,
                message:
                    `Your reservation for ride from ${detail.startLocation} to ${detail.endLocation} in date ${detail.date} at ${detail.time} has been accepted!` +
                    `\nContact ${detail.driverUsername} for further details!` +
                    `\n\nStart Coords: (${detail.lng},${detail.lat})`,
                dateTime: new Date().toString()
            };
            this.writeMessage(message);
        } catch (e) {
            console.error(e);
        }
    }
}
