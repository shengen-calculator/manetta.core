import {Datastore} from "@google-cloud/datastore";
import {getUserEmailByContext} from "../auth/authHelper";
import * as functions from "firebase-functions";
import OperationService from "../OperationService";
import DataStoreService from "../DataStoreService";

export const postOperations =
    async (data: PostOperationInput, context: any) => {
    const datastore = new Datastore();
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
            "operation", "user", getUserEmailByContext(context));
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
                user: getUserEmailByContext(context),
                created: new Date(dateTimeNow),
            };
        });
    } catch (error: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }


    for (const operation of operations) {
        await operationService.handleOperation(operation, docNumber);
        docNumber = data.postAsSingle ? docNumber : docNumber + 1;
    }

    try {
        return await transaction.commit();
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
