import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";

export const deleteTag = async (data: DeleteTagInput, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        return await dataStoreService.deleteEnity("tag", data.tag);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
