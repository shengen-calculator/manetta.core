import DataStoreService from "../DataStoreService";
import {HttpsError} from "firebase-functions/v2/https";
import {Datastore} from "@google-cloud/datastore";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getPostedOperation = async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const data: GetPostedOperationInput = request.data;
        const dataStoreService = new DataStoreService(datastore);
        const startDate = data.startDate ? new Date(data.startDate) : undefined;
        const endDate = data.endDate ? new Date(data.endDate) : undefined;
        const operations = await dataStoreService
            .getAll("posted", false, startDate, endDate);
        return operations.map((entity) => {
            const key = entity[datastore.KEY];
            return {
                id: key.id,
                account: entity.account.name,
                date: entity.date.getTime(),
                description: entity.description,
                sum: entity.sum,
                tags: entity.tags,
                isReverted: !!entity.isReverted,
                isRevertOperation: !!entity.isRevertOperation,
            };
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
