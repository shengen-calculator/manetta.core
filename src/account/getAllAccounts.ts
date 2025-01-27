import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getAllAccounts = async (request: CallableRequest) => {
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
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
