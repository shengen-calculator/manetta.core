import {Datastore} from "@google-cloud/datastore";
import {HttpsError, CallableRequest} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";

export const saveGroup = async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const data: SaveGroupInput = request.data;
        const dataStoreService = new DataStoreService(datastore);
        return await dataStoreService.upsertEntity("group", data.name, {
            tags: data.tags,
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
