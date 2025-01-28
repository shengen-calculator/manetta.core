import {AxiosResponse} from "axios";
import * as logger from "firebase-functions/logger";

/**
 * Abstract class for all handlers
 */
export default abstract class BotRequestHandler {
    body: RequestBody;

    /**
     *
     * @param {string} body
     * @protected
     */
    protected constructor(body: string) {
        this.body = JSON.parse(body) as RequestBody;
    }

    /**
     * check condition and run handle the request
     *
     * @return {boolean} info if the handler was executed
     */
    async execute(): Promise<boolean> {
        if (this.condition()) {
            const response = await this.handle();
            const logInfo = {
                code: response.status,
                text: response.statusText,
                data: response.data,
            };
            logger.info(`Response -> ${JSON.stringify(logInfo)}`);
            return true;
        }
        return false;
    }

    abstract condition(): boolean;

    abstract handle(): Promise<AxiosResponse>;
}
