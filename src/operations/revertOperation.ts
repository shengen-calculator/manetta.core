import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import OperationService from "../OperationService";
import {getUserEmailByContext} from "../auth/authHelper";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const revertOperation =
    async (request: CallableRequest) => {
        const datastore = new Datastore();
        const data: RevertOperationInput = request.data;
        const transaction = datastore.transaction();
        const dateTimeNow = new Date().getTime();
        let dbOperations= [];

        const opposite = (arg: number): number => -1 * arg;

        const operationService = new OperationService(datastore, transaction);
        const dataStoreService = new DataStoreService(datastore, transaction);
        try {
            await transaction.run();
            dbOperations = await dataStoreService.getFilteredEntities(
                "posted", "docNumber", data.docNumber);
        } catch (error: any) {
            await transaction.rollback();
            const runQueryError: RunQueryError = error;
            throw new HttpsError("internal",
                runQueryError.details);
        }

        // validation
        for (const operation of dbOperations) {
            if (operation.isReverted || operation.isRevertOperation) {
                throw new HttpsError("invalid-argument",
                    `Looks like document already contains reverted or 
                    revert operation.`);
            }
        }

        try {
            const result: PostedOperationRecord[] = [];
            for (const operation of dbOperations) {
                const key = operation[datastore.KEY];
                operation["isReverted"] = true;
                await dataStoreService.saveEntity("posted",
                    Number(key.id), operation);
                const record =
                    await operationService.handleOperation({
                    id: "",
                    account: operation.account,
                    description: `Revert operation -> ${new Date()
                        .toISOString().slice(0, 10)}`,
                    date: operation.date,
                    sum: opposite(operation.sum),
                    tags: operation.tags,
                    user: getUserEmailByContext(request),
                    created: new Date(dateTimeNow),
                }, operation.docNumber, true);
                result.unshift(record);
            }
            await transaction.commit();
            return result.map((record: PostedOperationRecord) => {
                return {
                    ...record,
                    date: record.date.getTime(),
                    created: record.created.getTime(),
                    balance: record.balance - (record.blocked || 0),
                };
            });
        } catch (error: any) {
            await transaction.rollback();
            const runQueryError: RunQueryError = error;
            throw new HttpsError("internal",
                runQueryError.details);
        }
    };
