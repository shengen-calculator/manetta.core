import DataStoreService from "../DataStoreService";
import * as functions from "firebase-functions";
import {Datastore} from "@google-cloud/datastore";
import ExcelReport from "../ExcelReport";
import * as fs from "fs";

export const operationReport = async (data: any, context: any) => {
    try {
        const datastore = new Datastore();
        const dataStoreService = new DataStoreService(datastore);
        const startDate = data.startDate ? new Date(data.startDate) : undefined;
        const endDate = data.endDate ? new Date(data.endDate) : undefined;
        const operations = await dataStoreService
            .getAll("posted", false, startDate, endDate, data.tags);
        const reportData: Array<ReportOperation> = operations.map((entity) => {
            return {
                id: undefined,
                account: entity.account.name,
                date: entity.date,
                description: entity.description,
                sum: entity.equivalent/100,
                tags: entity.tags,
                isReverted: entity.isReverted,
                isRevertOperation: entity.isRevertOperation,
            };
        });
        const excelReport = new ExcelReport(reportData,
            startDate || new Date(), endDate || new Date());
        const fileName = `rep${new Date().getTime()}.xlsx`;
        const path = await excelReport.saveToFile(fileName);
        const url = await excelReport.uploadFileToBucket(path, fileName);
        fs.unlinkSync(path);
        return url;
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
