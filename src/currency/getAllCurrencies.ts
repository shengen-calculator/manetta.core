import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const getAllCurrencies = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const entities = await dataStoreService.getAll("currency", true);
        return entities.map((entity) => {
            const key = entity[datastore.KEY];
            return key.name;
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
