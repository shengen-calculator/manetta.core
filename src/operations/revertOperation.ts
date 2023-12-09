import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";
import OperationService from "../OperationService";
import {getUserEmailByContext} from "../auth/authHelper";

export const revertOperation =
    async (data: RevertOperationInput, context: any) => {
        const datastore = new Datastore();
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
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }

        // validation
        for (const operation of dbOperations) {
            if (operation.isReverted || operation.isRevertOperation) {
                throw new functions.https.HttpsError("invalid-argument",
                    `Looks like document already contains reverted or 
                    revert operation.`);
            }
        }

        try {
            for (const operation of dbOperations) {
                const key = operation[datastore.KEY];
                operation["isReverted"] = true;
                await dataStoreService.saveEntity("posted",
                    Number(key.id), operation);

                await operationService.handleOperation({
                    id: "",
                    account: operation.account,
                    description: `Revert operation -> ${new Date()
                        .toISOString().slice(0, 10)}`,
                    date: operation.date,
                    sum: opposite(operation.sum),
                    tags: operation.tags,
                    user: getUserEmailByContext(context),
                    created: new Date(dateTimeNow),
                }, operation.docNumber, true);
            }
            return await transaction.commit();
        } catch (error: any) {
            await transaction.rollback();
            const runQueryError: RunQueryError = error;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };
