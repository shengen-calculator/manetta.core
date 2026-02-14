import Constants from "./Constants";
import {defineSecret} from "firebase-functions/params";
import axios, {
    AxiosResponse,
} from "axios";

/**
 * Message helper class
 */
export default class MessageHelper {
    message: OutputMessage;

    /**
     *
     *
     * @param {Message} message
     */
    constructor(message: OutputMessage) {
        this.message = message;
    }

    /**
     * Send message to a viber server
     *
     */
    async send(): Promise<AxiosResponse> {
        const key = defineSecret(Constants.TELEGRAM_API_KEY);
        const baseURL = `https://api.telegram.org/bot${key.value()}`;
        const client = axios.create({
            baseURL: baseURL,
        });

        return await client.post("sendMessage", this.message);
    }
}
