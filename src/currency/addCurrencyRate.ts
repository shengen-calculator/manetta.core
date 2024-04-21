import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";

export const addCurrencyRate =
    async (data: AddCurrencyRateInput, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const rateKey =
            dataStoreService.getDatastoreNestedEntityNewKey(datastore,
            "rate", "currency", data.currency);
        await datastore.insert({
            key: rateKey,
            data: {
                date: new Date(),
                rate: data.rate,
                user: getUserEmailByContext(context),
            },
        });
    } catch (err: any) {
        const runQueryError: RunQueryError = err;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
