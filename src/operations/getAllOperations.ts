import DataStoreService from "../DataStoreService";
import {HttpsError} from "firebase-functions/v2/https";
import {Datastore} from "@google-cloud/datastore";
import {getUserEmailByContext} from "../auth/authHelper";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getAllOperation = async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const operations =
            await dataStoreService.getFilteredEntities("operation",
            "user", getUserEmailByContext(request));
        return operations.map((entity) => {
            const key = entity[datastore.KEY];
            return {
                id: key.id,
                account: entity.account.name,
                date: entity.date.getTime(),
                group: entity.group,
                created: entity.created,
                description: entity.description,
                sum: entity.sum,
                tags: entity.tags,
            };
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
