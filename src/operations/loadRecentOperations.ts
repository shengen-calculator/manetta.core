import {Datastore} from "@google-cloud/datastore";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";

export const loadRecentOperations = async (request: CallableRequest) => {
    const datastore = new Datastore();
    const data: LoadRecentOperationsInput = request.data;
    const transaction = datastore.transaction();
    const dataStoreService = new DataStoreService(datastore, transaction);

    await transaction.run();

    const groupEntity = await dataStoreService.getEntityByName(
        "group",
        data.group,
    );

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
        groupEntity["tags"],
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
    let created = new Date().getTime();
    for (const operation of operations) {
        await dataStoreService.insertEntityNewKey("operation", {
            account: operation.account,
            sum: operation.sum,
            date: new Date(),
            group: data.group,
            description: operation.description,
            created,
            tags: operation.tags,
            user: getUserEmailByContext(request),
        });
        created += 100;
    }

    try {
        return await transaction.commit();
    } catch (err: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = err;
        throw new HttpsError("internal", runQueryError.details);
    }
};
