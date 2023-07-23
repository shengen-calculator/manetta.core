import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";

export const getRecentlyPosted = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const result = await dataStoreService
            .getNewestItems("posted", "created", data.startCursor);
        const entries = result.entities.map((entity) => {
            const key = entity[datastore.KEY];
            return {
                id: key.id,
                account: entity.account.name,
                date: entity.date.getTime(),
                description: entity.description,
                docNumber: entity.docNumber,
                euro: entity.equivalent,
                balance: entity.balance,
                sum: entity.sum,
                tags: entity.tags,
            };
        });
        return {
            entries,
            cursor: result.info.endCursor,
        };
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
