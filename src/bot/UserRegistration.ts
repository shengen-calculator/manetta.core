import {AxiosResponse} from "axios";
import MessageHelper from "../MessageHelper";
import BotRequestHandler from "../BotRequestHandler";

/**
 * Request phone number
 */
export default class UserRegistration extends BotRequestHandler {
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
        return !!this.body.message.contact;
    }

    /**
     * handler
     */
    async handle(): Promise<AxiosResponse> {
        const chatId = this.body.message.chat.id;
        // eslint-disable-next-line max-len
        let text = `Dear ${this.body.message.contact?.first_name} your identity has been successfully established`;
        let removeKeyboard = false;
        if (this.body.message.from.id !== this.body.message.contact?.user_id) {
            text = "Please provide your contact information";
        } else {
            removeKeyboard = true;
            // todo: save userId
        }
        const welcomeMessage: OutputMessage = {
            chat_id: chatId,
            text: text,
            reply_markup: {
                remove_keyboard: removeKeyboard,
            },
        };
        const helper = new MessageHelper(welcomeMessage);
        return await helper.send();
    }
}
