import DataStoreService from "../DataStoreService";
import {HttpsError} from "firebase-functions/v2/https";
import {Datastore} from "@google-cloud/datastore";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getOperationLog = async (request: CallableRequest) => {
    try {
        const data: GetOperationLogInput = request.data;
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const result = await dataStoreService.getNewestNestedItems(
            "posted-log", "posted", data.id.toString(), data.startCursor);
        const entries = result.entities.map((entry) => {
            return {
                description: entry.description,
                date: entry.date.getTime(),
                user: entry.user,
                operationDate: entry.operationDate?.getTime(),
                tags: entry.tags,
            };
        });
        return {
            entries,
            cursor: result.info.endCursor,
        };
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal", runQueryError.details);
    }
};
