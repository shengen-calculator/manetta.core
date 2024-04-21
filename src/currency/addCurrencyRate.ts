import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";

export const addCurrencyRate =
    async (data: AddCurrencyRateInput, context: any) => {
    const datastore = new Datastore();
    const transaction = datastore.transaction();
    const dataStoreService = new DataStoreService(datastore, transaction);
    const date = new Date(data.date).getTime();
    let actualCurrencyRate: GetCurrencyRateResult;
    let latestPosted: PostedOperation;

    try {
        await transaction.run();
        actualCurrencyRate = await dataStoreService
            .getNewestNestedItem("rate", "currency", data.currency);
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }

    if (actualCurrencyRate && actualCurrencyRate.date.getTime() >= date) {
        await transaction.rollback();
        throw new functions.https.HttpsError("invalid-argument",
            "Currency rate for this date already defined");
    }

    try {
        latestPosted = await dataStoreService
            .getNewestFilteredByEntity("posted", "currency",
                "currency", data.currency, "date");
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }

    if (latestPosted && latestPosted.date.getTime() >= date) {
        await transaction.rollback();
        throw new functions.https.HttpsError("invalid-argument",
            "Posted record with later date than the date rate exists!!!");
    }

    try {
        const rateKey =
            dataStoreService.getDatastoreNestedEntityNewKey(datastore,
            "rate", "currency", data.currency);
        await transaction.insert({
            key: rateKey,
            data: {
                date: new Date(data.date),
                rate: data.rate,
                user: getUserEmailByContext(context),
            },
        });

        return await transaction.commit();
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
