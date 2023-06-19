import DataStoreService from "../DataStoreService";
import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";

export const createTag = async (data: CreateTagInput, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        return await dataStoreService.insertEntity("tag", data.tag, {});
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
