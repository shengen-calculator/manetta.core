import {Datastore} from "@google-cloud/datastore";
import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";

export const getReportRecords = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const blockedMap = new Map();
        const startDate = data.filter.startDate ?
            new Date(data.filter.startDate) : undefined;
        const endDate = data.filter.endDate ?
            new Date(data.filter.endDate) : undefined;
        const accounts = await dataStoreService.getAll("account", false);
        accounts.forEach((entity) => {
            const key = entity[datastore.KEY];
            blockedMap.set(key.name, entity.blocked);
        });
        const result = await dataStoreService
            .getNewestFilteredItems("posted", data.startCursor,
                startDate, endDate, data.filter.tags);
        const entries = result.entities.map((entity) => {
            const key = entity[datastore.KEY];
            return {
                id: key.id,
                account: entity.account.name,
                date: entity.date.getTime(),
                created: entity.created.getTime(),
                description: entity.description,
                docNumber: entity.docNumber,
                euro: entity.equivalent,
                balance: entity.balance - blockedMap.get(entity.account.name),
                sum: entity.sum,
                tags: entity.tags,
                isReverted: !!entity.isReverted,
                isRevertOperation: !!entity.isRevertOperation,
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
