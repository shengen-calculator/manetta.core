import DataStoreService from "../DataStoreService";
import {Datastore} from "@google-cloud/datastore";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";
import {HttpsError} from "firebase-functions/v2/https";

export const getAllTags = async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const tags = await dataStoreService.getAll("tag", false);
        return tags.map((data) => data.tags);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
