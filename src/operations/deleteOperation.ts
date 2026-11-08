import DataStoreService from "../DataStoreService";
import {HttpsError, CallableRequest} from "firebase-functions/v2/https";
import {Datastore} from "@google-cloud/datastore";

export const deleteOperation =
    async (request: CallableRequest) => {
        try {
            const datastore = new Datastore();
            const data: DeleteOperationInput = request.data;
            const dataStoreService = new DataStoreService(datastore);
            console.log(data.id);
            return await dataStoreService
                .deleteEnityById("operation", data.id);
        } catch (error: any) {
            const runQueryError: RunQueryError = error;
            throw new HttpsError("internal",
                runQueryError.details);
        }
    };
