import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";
import {getUserEmailByContext} from "../auth/authHelper";

export const getAllOperation = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const operations =
            await dataStoreService.getFilteredEntities("operation",
            "user", getUserEmailByContext(context));
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
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
