import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const saveOperation = async (request: CallableRequest) => {
    try {
        const datastore = new Datastore();
        const data: SaveOperationInput = request.data;
        const dataStoreService = new DataStoreService(datastore);
        const account = dataStoreService.getEntityKey("account", data.account);
        if (data.id) {
            return await dataStoreService
                .updateEntity("operation", Number(data.id), {
                account,
                sum: data.sum,
                date: new Date(data.date),
                group: data.group,
                description: data.description,
                tags: data.tags,
                user: getUserEmailByContext(request),
            });
        }
        return await dataStoreService.insertEntityNewKey("operation", {
            account,
            sum: data.sum,
            date: new Date(data.date),
            group: data.group,
            description: data.description,
            created: new Date().getTime(),
            tags: data.tags,
            user: getUserEmailByContext(request),
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
