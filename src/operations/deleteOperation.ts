import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";

export const deleteOperation =
    async (data: DeleteOperationInput, context: any) => {
        try {
            const datastore = new Datastore();
            const dataStoreService = new DataStoreService(datastore);
            console.log(data.id);
            return await dataStoreService
                .deleteEnityById("operation", data.id);
        } catch (error: any) {
            const runQueryError: RunQueryError = error;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };
