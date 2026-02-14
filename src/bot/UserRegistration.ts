import {AxiosResponse} from "axios";
import MessageHelper from "../MessageHelper";
import BotRequestHandler from "../BotRequestHandler";
import {Datastore} from "@google-cloud/datastore";
import DataStoreService from "../DataStoreService";

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
        const isOwnContact =
            this.body.message.from.id === this.body.message.contact?.user_id;
        if (!isOwnContact) {
            const message = {
                chat_id: chatId,
                text: "Please provide your own contact information",
            };
            const helper = new MessageHelper(message);
            return await helper.send();
        }
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const phone = this.body.message.contact?.phone_number;
        const userEntity = phone ? await dataStoreService
            .getSingleEntity("user", "phone", phone) : null;
        if (userEntity) {
            const key = userEntity[datastore.KEY];
            await dataStoreService.updateEntity("user", Number(key["id"]), {
                telegramId: this.body.message.contact?.user_id,
            });
        }

        const message = userEntity ? {
            chat_id: chatId,
            // eslint-disable-next-line max-len
            text: `Dear ${this.body.message.contact?.first_name} your identity has been successfully established`,
            reply_markup: {
                remove_keyboard: true,
            },
        } : {
            chat_id: chatId,
            text: "Please contact administrator",
        };

        const helper = new MessageHelper(message);
        return await helper.send();
    }
}
