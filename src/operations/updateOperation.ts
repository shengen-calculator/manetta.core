import {Datastore} from "@google-cloud/datastore";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";
import {HttpsError} from "firebase-functions/v2/https";
import DataStoreService from "../DataStoreService";
import {getUserEmailByContext} from "../auth/authHelper";

export const updateOperation = async (request: CallableRequest) => {
    const datastore = new Datastore();
    const data: UpdateOperationInput = request.data;
    const transaction = datastore.transaction();
    const dataStoreService = new DataStoreService(datastore, transaction);

    try {
        await transaction.run();
        for (const id of data.ids) {
            const posted: PostedOperation = await
                  dataStoreService.getEntityById("posted", id);
            let log = {};
            if (data.description) {
                log = {
                    ...log,
                    description: posted.description,
                };
                posted.description = data.description;
            } else if (data.date) {
                log = {
                    ...log,
                    operationDate: posted.date,
                };
                posted.date = new Date(data.date);
            } else if (data.tags.length) {
                log = {
                    ...log,
                    tags: posted.tags,
                };
                posted.tags = data.tags;
            }
            const logKey = dataStoreService.getDatastoreNestedEntityNewKey(
                "posted-log", "posted", id.toString());
            await dataStoreService.saveEntity("posted", id, posted);
            await dataStoreService.insertNestedEntity(
                logKey,
                {
                    ...log,
                    date: new Date(),
                    user: getUserEmailByContext(request),
                },
            );
        }
        await transaction.commit();
    } catch (error: any) {
        await transaction.rollback();
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal", runQueryError.details);
    }
};
