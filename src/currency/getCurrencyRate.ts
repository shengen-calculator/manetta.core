import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getCurrencyRate =
    async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);

        const entities = await dataStoreService.getAll("currency", true);
        const currencies = entities.map((entity) => {
            const key = entity[datastore.KEY];
            return key.name;
        });
        const allRates = [];
        for (const currency of currencies) {
            const actualCurrencyRate: GetCurrencyRateResult =
                await dataStoreService.getNewestNestedItem("rate",
                    "currency", currency);
            allRates.push({
                ...actualCurrencyRate,
                currency,
            });
        }

        return allRates.map((cr) => {
            return {
                rate: cr.rate,
                date: cr.date.getTime(),
                currency: cr.currency,
            };
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal", runQueryError.details);
    }
};
