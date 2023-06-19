import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";

export const deleteGroup = async (data: DeleteGroupInput, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        return await dataStoreService.deleteEnity("group", data.groupName);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
