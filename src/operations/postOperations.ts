import {Datastore} from "@google-cloud/datastore";
import {getUserEmailByContext} from "../auth/authHelper";
import {HttpsError} from "firebase-functions/v2/https";
import OperationService from "../OperationService";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const postOperations =
    async (request: CallableRequest) => {
    const datastore = new Datastore();
    const data: PostOperationInput = request.data;
    const transaction = datastore.transaction();
    let dateTimeNow = new Date().getTime();
    let operations: Operation[];

    const operationService = new OperationService(datastore, transaction);
    const dataStoreService = new DataStoreService(datastore, transaction);
    let [docNumber, lastPostedDate] =
        await operationService.getLatestDocNumberAndDate();

    docNumber++;

    if (lastPostedDate.getTime() >= dateTimeNow) {
        dateTimeNow = lastPostedDate.getTime() + 1;
    }

    try {
        await transaction.run();
        const dbOperations = await dataStoreService.getFilteredEntities(
            "operation", "user", getUserEmailByContext(request), "created");
        const selectedDbOperations = dbOperations.filter((op) => {
            const key = op[datastore.KEY];
            return data.ids.includes(key.id);
        });
        operations = selectedDbOperations.map((item) => {
            const key = item[datastore.KEY];
            dateTimeNow += 1;
            return {
                id: key.id,
                account: item.account,
                description: item.description,
                date: item.date,
                sum: item.sum,
                tags: item.tags,
                user: getUserEmailByContext(request),
                created: new Date(dateTimeNow),
            };
        });
    } catch (error: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
    const result: PostedOperationRecord[] = [];
    for (const operation of operations) {
        const record =
            await operationService.handleOperation(operation, docNumber);
        docNumber = data.postAsSingle ? docNumber : docNumber + 1;
        result.unshift(record);
    }

    try {
        await transaction.commit();
        return result.map((record: PostedOperationRecord) => {
            return {
                ...record,
                date: record.date.getTime(),
                created: record.created.getTime(),
                balance: record.balance - (record.blocked || 0),
            };
        });
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
