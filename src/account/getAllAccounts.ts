import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const getAllAccounts = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const entities = await dataStoreService.getAll("account", false);
        return entities.map((entity) => {
            const key = entity[datastore.KEY];
            return {
                name: key.name,
                isActive: entity.isActive,
                currency: entity.currency.name,
            };
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
