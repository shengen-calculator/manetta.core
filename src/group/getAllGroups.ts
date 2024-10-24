import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getAllGroups = async (request: CallableRequest) => {
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
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
