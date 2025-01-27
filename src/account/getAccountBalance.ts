import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import OperationService from "../OperationService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getAccountBalance = async (request: CallableRequest) => {
    const data: GetAccountBalanceInput = request.data;
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
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
