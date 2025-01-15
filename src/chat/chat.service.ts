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
        this.eventManager.on(EventKeys.RideConcluded, async e => this.notifyRideConcluded((e as any)?.detail));
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
            const date = new Date();
            const formattedDate = new Intl.DateTimeFormat("it-IT", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }).format(date);
            const message = {
                from: constants.GREEN_WHEELS_USER_ID,
                to: detail.userId,
                message:
                    `Your reservation for ride from ${detail.startLocation} to ${detail.endLocation} in date ${detail.date} at ${detail.time} has been accepted!` +
                    `<br><br>Contact ${detail.driverUsername} for further details!` +
                    `<br><br>Start Coords: (${detail.lng},${detail.lat})`,
                dateTime: formattedDate
            };
            await this.writeMessage(message);
        } catch (e) {
            console.error(e);
        }
    }

    private async notifyRideConcluded(concludedRideDetails: {
        driverId: string;
        driverUsername: string;
        startLocation: string;
        endLocation: string;
        passengers: number[];
        token: string;
    }): Promise<void> {
        try {
            const date = new Date();
            const formattedDate = new Intl.DateTimeFormat("it-IT", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }).format(date);

            await Promise.all(
                concludedRideDetails.passengers.map(passsengerId => {
                    return this.writeMessage({
                        from: constants.GREEN_WHEELS_USER_ID,
                        to: passsengerId,
                        message: `
                        <h1>Rate Your Driver</h1>
                        <p>Please rate your experience for the trip from <strong>${concludedRideDetails.startLocation}</strong> to <strong>${concludedRideDetails.endLocation}</strong> with driver <strong>${concludedRideDetails.driverUsername}</strong>.</p>
                        <form class="ratingForm" token="${concludedRideDetails.token}">
                            <label for="${concludedRideDetails.token}">Your Rating (1 to 5):</label>
                            <input class="form-control me-2 rating" type="number" id="${concludedRideDetails.token}" name="rating" min="1" max="5" required>
                            <button class="btn btn-primary" type="submit">Submit Rating</button>
                        </form>`,
                        dateTime: formattedDate
                    });
                })
            );
        } catch (e) {
            console.error(e);
        }
    }
}
