import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";
import ExcelReport from "../ExcelReport";

export const operationReport = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const startDate = data.startDate ? new Date(data.startDate) : undefined;
        const endDate = data.endDate ? new Date(data.endDate) : undefined;
        const operations = await dataStoreService
            .getAll("posted", false, startDate, endDate);
        const reportData: Array<OperationBase> = operations.map((entity) => {
            return {
                id: undefined,
                account: entity.account.name,
                date: entity.date.getTime(),
                description: entity.description,
                sum: entity.sum,
                tags: entity.tags,
            };
        });
        const excelReport = new ExcelReport(reportData);
        return excelReport.saveToFile("new-report.xlsx");

    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
