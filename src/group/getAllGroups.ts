import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const getAllGroups = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const groups = await dataStoreService.getAll("group", false);
        return groups.map((data) => {
            const key = data[datastore.KEY];
            return {
                name: key.name,
                tags: data.tags,
            };
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
