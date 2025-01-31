import {AxiosResponse} from "axios";
import MessageHelper from "../MessageHelper";
import BotRequestHandler from "../BotRequestHandler";

/**
 * Request phone number
 */
export default class PostOperations extends BotRequestHandler {
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
        return this.body.message.text === "/post";
    }

    /**
     * handler
     */
    async handle(): Promise<AxiosResponse> {
        const chatId = this.body.message.chat.id;
        const welcomeMessage: OutputMessage = {
            "chat_id": chatId,
            "text": "Hello world!!!",
        };
        const helper = new MessageHelper(welcomeMessage);
        return await helper.send();
    }
}
