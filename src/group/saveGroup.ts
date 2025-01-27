import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

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
