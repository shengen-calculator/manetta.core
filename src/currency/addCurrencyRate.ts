import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const addCurrencyRate =
    async (request: CallableRequest) => {
    const data: AddCurrencyRateInput = request.data;
    const datastore = new Datastore();
    const dataStoreService = new DataStoreService(datastore);

    try {
        const rateKey =
            dataStoreService.getDatastoreNestedEntityNewKey(
            "rate", "currency", data.currency);
        await datastore.insert({
            key: rateKey,
            data: {
                date: new Date(),
                rate: data.rate,
                user: getUserEmailByContext(request),
            },
        });
    } catch (err: any) {
        const runQueryError: RunQueryError = err;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
