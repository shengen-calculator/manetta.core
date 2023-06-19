import {Datastore} from "@google-cloud/datastore";
import * as functions from "firebase-functions";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";

export const saveOperation = async (data: SaveOperationInput, context: any) => {
    try {
        const datastore = new Datastore();
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
                user: getUserEmailByContext(context),
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
            user: getUserEmailByContext(context),
        });
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
