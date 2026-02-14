import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {defineSecret} from "firebase-functions/params";
import Constants from "./Constants";
import TelegramRunner from "./TelegramRunner";

export const telegramBot = onRequest(
    async (request, response) => {
        const body = request["rawBody"].toString("utf8");
        logger.info(`Body -> ${body}`);
        const token = request.get(Constants.HEADER_TOKEN_KEY);
        const telegramToken = defineSecret(Constants.TELEGRAM_TOKEN);
        if (token !== telegramToken.value()) {
            response.status(500).send("Wrong token");
            return;
        }
        response.status(200).send("OKAY");

        const telegramRunner = new TelegramRunner(body);
        await telegramRunner.run();
    }
);
