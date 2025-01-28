import BotRequestHandler from "./BotRequestHandler";
import WelcomeMessage from "./bot/WelcomeMessage";

/**
 * Bot Runner
 *
 * Please don't forget to add new Handler to the collection
 */
export default class TelegramRunner {
    handlers: Array<BotRequestHandler>;

    /**
     * Create handlers
     *
     * @param {string} body
     */
    constructor(body: string) {
        this.handlers = [
            new WelcomeMessage(body),
        ];
    }

    /**
     * Run handler execution one by one
     */
    async run() {
        for (const handler of this.handlers) {
            if (await handler.execute()) {
                break;
            }
        }
    }
}
