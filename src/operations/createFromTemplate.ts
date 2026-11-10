import {Datastore} from "@google-cloud/datastore";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";

export const createFromTemplate = async (request: CallableRequest) => {
    const datastore = new Datastore();
    const data: CreateFromTemplateInput = request.data;
    const dataStoreService = new DataStoreService(datastore);

    const dbOperations = await dataStoreService.getFilteredEntities(
        "operation",
        "user",
        getUserEmailByContext(request),
        "created",
    );
    const dbOperation = dbOperations.find((operation) => operation.sum === 0);
    if (dbOperations.length - Number(!!dbOperation) > 0) {
        throw new HttpsError(
            "invalid-argument",
            "Please submit existing reccords",
        );
    }
    if (dbOperation) {
        const key = dbOperation[datastore.KEY];
        await dataStoreService.deleteEnityById("operation", Number(key.id));
    }
    const newest = await dataStoreService.getNewestFilteredItems(
        "posted",
        "",
        undefined,
        undefined,
        data.tags,
        1,
    );
    if (!newest.entities.length) {
        throw new HttpsError(
            "invalid-argument",
            "Looks like there is no operation of this type",
        );
    }
    const record = newest.entities.pop();
    const operations = await dataStoreService.getFilteredEntities(
        "posted",
        "docNumber",
        record.docNumber,
    );
    for (const operation of operations) {
        await dataStoreService.insertEntityNewKey("operation", {
            account: operation.account,
            sum: operation.sum,
            date: new Date(),
            group: operation.group,
            description: operation.description,
            created: new Date().getTime(),
            tags: operation.tags,
            user: getUserEmailByContext(request),
        });
    }
    return operations.map((entity) => {
        const key = entity[datastore.KEY];
        return {
            id: key.id,
            account: entity.account.name,
            date: entity.date.getTime(),
            group: entity.group,
            created: entity.created,
            description: entity.description,
            sum: entity.sum,
            tags: entity.tags,
        };
    });
};
