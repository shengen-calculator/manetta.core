/* eslint @typescript-eslint/no-var-requires: "off" */
import {GetSignedUrlConfig} from "@google-cloud/storage";
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {configuration} from "./settings";
const xl = require("excel4node");

/**
 * Represents an Excel Report
 */
export default class ExcelReport {
    private readonly wb: any;
    private readonly ws: any;
    private readonly style: any;
    private readonly data: Array<OperationBase>;

    /**
     * Main class constructor
     * @param {Array<OperationBase>} data for report
     */
    constructor(data: Array<OperationBase>) {
        this.wb = new xl.Workbook();
        this.ws = this.wb.addWorksheet("Manetta report");
        this.data = data;
        this.style = this.createStyles();
    }

    /**
     * Create styles
     * @return {any}
     */
    private createStyles = () => {
        return this.wb.createStyle({
            font: {
                color: "#FF0800",
                size: 12,
            },
            numberFormat: "$#,##0.00; ($#,##0.00); -",
        });
    };

    /**
     * Get storage bucket based on configuration
     * @return {any}
     */
    private getBucket = () => admin.storage().bucket(configuration.bucketId);

    /**
     * Handle save report operation file
     * @param {string} fileName
     * @return {string} path to the file
     */
    public saveToFile = (fileName: string): string => {
        if (!this.data.length) {
            throw new Error("There is no data for report");
        }

        this.ws.cell(1, 1)
            .number(100)
            .style(this.style);

        const tempLocalResultFile = path.join(os.tmpdir(), fileName);

        this.wb.write(tempLocalResultFile, function(err: any, stats: any) {
            if (err) {
                console.error(err);
            } else {
                console.log(stats);
                // Prints out an instance of a node.js fs.Stats object
            }
        });

        return tempLocalResultFile;
    };

    /**
     * Upload report to bucket and create signed URL
     * @param {string} path
     * @param {string} fileName
     * @return {string} signed URL
     */
    public uploadFileToBucket = async (path: string,
                                       fileName: string): Promise<any> => {
        const resultFilePath = `OutBox/${fileName}`;
        const contentType =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const metadata = {
            contentType: contentType,
            contentDisposition: `attachment; filename="${fileName}"`,
        };
        await this.getBucket().upload(path,
            {destination: resultFilePath, metadata: metadata});

        fs.unlinkSync(path);

        const expDate = new Date();
        expDate.setTime(expDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const month = expDate.getMonth() + 1;
        const day = expDate.getDate();
        const year = expDate.getFullYear();

        const config: GetSignedUrlConfig = {
            action: "read",
            expires: `${month}-${day}-${year}`,
        };

        const resultFile = this.getBucket().file(resultFilePath);
        return resultFile.getSignedUrl(config);
    };
}
