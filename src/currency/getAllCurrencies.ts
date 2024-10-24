import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getAllCurrencies = async (request: CallableRequest) => {
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
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
