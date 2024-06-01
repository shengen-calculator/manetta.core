import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import OperationService from "../OperationService";

export const getAccountBalance = async (data: GetAccountBalanceInput,
                                        context: any) => {
    const datastore = new Datastore();
    const transaction = datastore.transaction({readOnly: true});
    const operationService = new OperationService(datastore, transaction);
    try {
        await transaction.run();
        const account: Account =
            await operationService.getAccountByName(data.accountName);
        const balance: number =
            await operationService.getAccountBalance(data.accountName);
        await transaction.commit();
        return balance - account.blocked;
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
