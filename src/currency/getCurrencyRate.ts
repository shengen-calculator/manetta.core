import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const getCurrencyRate =
    async (data: GetCurrencyRateInput, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);

        const actualCurrencyRate: GetCurrencyRateResult = await dataStoreService
            .getNewestNestedItem("rate", "currency", data.currency);
        return {
            rate: actualCurrencyRate.rate,
            date: actualCurrencyRate.date.getTime(),
        };
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal", runQueryError.details);
    }
};
