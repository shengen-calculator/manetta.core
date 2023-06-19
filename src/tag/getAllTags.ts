import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";

export const getAllTags = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const tags = await dataStoreService.getAll("tag", true);
        return tags.map((entity) => {
            const key = entity[datastore.KEY];
            return key.name;
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
