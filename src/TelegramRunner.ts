import Constants from "./Constants";
import {defineSecret} from "firebase-functions/params";
import axios, {
    AxiosResponse,
} from "axios";

/**
 * Telegram Runner
 */
export default class TelegramRunner {
    body: string;

    /**
     *
     * @param {string} body
     */
    constructor(body: string) {
        this.body = body;
    }

    /**
     * run telegram
     */
    async run(): Promise<AxiosResponse> {
        const parsedBody = JSON.parse(this.body);
        const key = defineSecret(Constants.TELEGRAM_API_KEY);
        const baseURL = `https://api.telegram.org/bot${key.value()}`;
        const client = axios.create({
            baseURL: baseURL,
        });
        const chatId = parsedBody["message"]["chat"]["id"];
        const message = {
            "chat_id": chatId,
            "text": "Hello world!!!",
        };

        return await client.post("sendMessage", message);
    }
}
