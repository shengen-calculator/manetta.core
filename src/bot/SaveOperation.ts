import {AxiosResponse} from "axios";
import MessageHelper from "../MessageHelper";
import BotRequestHandler from "../BotRequestHandler";
import * as logger from "firebase-functions/logger";
import {Datastore} from "@google-cloud/datastore";
import DataStoreService from "../DataStoreService";

/**
 * Request phone number
 */
export default class SaveOperation extends BotRequestHandler {
    private readonly GROUP_MAX_LENGTH = 6;
    private readonly ACCOUNT_MAX_LENGTH = 5;
    private readonly datastore: Datastore;
    private readonly dataStoreService: DataStoreService;

    private args: string[] = [];
    private sum = 0;

    /**
     *
     * @param {string} body
     */
    constructor(body: string) {
        super(body); // must call super()
        this.datastore = new Datastore();
        this.dataStoreService = new DataStoreService(this.datastore);
    }

    /**
     * condition
     *
     * @return {boolean}
     */
    condition(): boolean {
        return this.parseMessage() && this.parseSum();
    }

    /**
     * parse message and check how many params it contains
     * @return {boolean}
     */
    private parseMessage(): boolean {
        this.args = this.body.message.text.split("\n");
        return this.args.length >= 3;
    }

    /**
     * parse sum operation
     * @return {boolean}
     */
    private parseSum(): boolean {
        for (let i = 0; i < this.args.length; i++) {
            const sum = Number(this.args[i].replace(",", "."));
            if (!isNaN(sum)) {
                this.sum = sum;
                this.args.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    /**
     * parse Account info
     * @private
     */
    private async parseAccount(): Promise<string | null> {
        const accountEntities =
            await this.dataStoreService.getAll("account", false);
        const accounts = accountEntities.map((entity) => {
            const key = entity[this.datastore.KEY];
            return {
                name: key.name,
            };
        });
        for (let i = 0; i < this.args.length; i++) {
            const accountAbbr = this.args[i];
            if (accountAbbr.length <= this.ACCOUNT_MAX_LENGTH) {
                for (let j = 0; j < accounts.length; j++) {
                    if (SaveOperation.isEqual(accountAbbr, accounts[j].name)) {
                        this.args.splice(i, 1);
                        return accounts[j].name;
                    }
                }
            }
        }
        return null;
    }

    /**
     * parse Group info include tags
     * @private
     */
    private async parseGroup():
        Promise<{ name: string, tags: string[] } | null> {
        const groupEntities =
            await this.dataStoreService.getAll("group", false);
        const groups = groupEntities.map((entity) => {
            const key = entity[this.datastore.KEY];
            return {
                name: key.name,
                tags: entity.tags,
            };
        });
        for (let i = 0; i < this.args.length; i++) {
            const groupAbbr = this.args[i];
            if (groupAbbr.length <= this.GROUP_MAX_LENGTH) {
                for (let j = 0; j < groups.length; j++) {
                    if (SaveOperation.isEqual(groupAbbr, groups[j].name)) {
                        this.args.splice(i, 1);
                        return {
                            name: groups[j].name,
                            tags: groups[j].tags,
                        };
                    }
                }
            }
        }
        return null;
    }

    /**
     * check if the abbreviation is equal to the name (case insensitive)
     * @param {string} abbreviation
     * @param {string} fullName
     * @return {boolean}
     */
    private static isEqual(abbreviation: string, fullName: string): boolean {
        const abbrArr = abbreviation.toUpperCase().split("");
        for (let i = 0; i < abbrArr.length; i++) {
            const index = fullName.toUpperCase().indexOf(abbrArr[i]);
            if (index === -1) {
                return false;
            }
            fullName = fullName.slice(index + 1);
        }
        return true;
    }

    /**
     * handler
     */
    async handle(): Promise<AxiosResponse> {
        const chatId = this.body.message.chat.id;

        const account = await this.parseAccount();
        if (!account) {
            const helper = new MessageHelper({
                "chat_id": chatId,
                "text": "Missed Account",
            });
            return await helper.send();
        }

        const group = await this.parseGroup();
        if (!group) {
            const helper = new MessageHelper({
                "chat_id": chatId,
                "text": "Missed Group",
            });
            return await helper.send();
        }

        const description = this.args.length ? this.args.pop() : "";
        const payload = {
            sum: this.sum,
            group: group?.name,
            tags: group?.tags,
            accounts: account,
            description: description,
        };

        logger.info(`payload => ${JSON.stringify(payload)}`);

        // todo: save operation
        const welcomeMessage: OutputMessage = {
            "chat_id": chatId,
            "text": "Saved",
        };
        const helper = new MessageHelper(welcomeMessage);
        return await helper.send();
    }
}
