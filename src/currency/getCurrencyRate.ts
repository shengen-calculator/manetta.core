import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const getCurrencyRate =
    async (data: GetCurrencyRateInput, context: any) => {
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
        throw new functions.https.HttpsError("internal", runQueryError.details);
    }
};
