import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const saveAccount = async (request: CallableRequest) => {
    try {
        const data: SaveAccountInput = request.data;
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const currency =
            dataStoreService.getEntityKey("currency", data.currency);
        return await dataStoreService
            .upsertEntity("account", data.accountName, {
            blocked: data.blocked,
            isActive: data.isActive,
            currency: currency,
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
