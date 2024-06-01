import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const saveAccount = async (data: SaveAccountInput, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const currency =
            dataStoreService.getEntityKey("currency", data.currency);
        return await dataStoreService
            .upsertEntity("account", data.accountName, {
            blocked: data.blocked,
            isActive: data.isActive,
            currency: currency,
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
