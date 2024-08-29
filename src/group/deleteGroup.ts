import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const deleteGroup = async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const data: DeleteGroupInput = request.data;
        const dataStoreService = new DataStoreService(datastore);
        return await dataStoreService.deleteEnity("group", data.name);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
