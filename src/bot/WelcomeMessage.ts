import {AxiosResponse} from "axios";
import MessageHelper from "../MessageHelper";
import BotRequestHandler from "../BotRequestHandler";
import {Datastore} from "@google-cloud/datastore";
import DataStoreService from "../DataStoreService";

/**
 * Request phone number
 */
export default class WelcomeMessage extends BotRequestHandler {
    /**
     *
     * @param {string} body
     */
    constructor(body: string) {
        super(body); // must call super()
    }

    /**
     * condition
     *
     * @return {boolean}
     */
    condition(): boolean {
        return this.body.message.text === "/start";
    }

    /**
     * handler
     */
    async handle(): Promise<AxiosResponse> {
        const chatId = this.body.message.chat.id;
        const senderId = this.body.message.from.id;
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const user = await dataStoreService
            .getSingleEntity("user", "telegramId", senderId);
        const message: OutputMessage = user ? {
            "chat_id": chatId,
            "text": `Dear ${this.body.message.from.first_name}, welcome back`,
        } : {
            chat_id: chatId,
            text: "Welcome to Manetta!",
            reply_markup: {
                keyboard: [
                    [
                        {
                            text: "Send contact information",
                            request_contact: true,
                        },
                    ],
                ],
            },
        };

        const helper = new MessageHelper(message);
        return await helper.send();
    }
}
