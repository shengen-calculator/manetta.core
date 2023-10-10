/* eslint @typescript-eslint/no-var-requires: "off" */
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
    private readonly numberStyle: any;
    private readonly dateStyle: any;
    private rowNumber = 1;
    private shift = 0;
    private readonly data: Array<OperationBase>;

    /**
     * Main class constructor
     * @param {Array<OperationBase>} data for report
     */
    constructor(data: Array<OperationBase>) {
        this.wb = new xl.Workbook({
            dateFormat: "d-m-yy",
        });
        this.ws = this.wb.addWorksheet("Manetta report");
        this.data = data.sort(this.compareFn);
        this.dateStyle = this.createDateStyles();
        this.numberStyle = this.createNumberStyles();
        this.ws.column(1).setWidth(50);
    }

    /**
     * Compare function, used for sorting operation array
     * @param a {OperationBase}
     * @param b {OperationBase}
     */
    private compareFn = (a: OperationBase, b: OperationBase): number => {
        const aTag = a.tags.join("");
        const bTag = b.tags.join("");

        if(aTag === bTag) {
            return a.date > b.date ? 1 : -1;
        }

        if(~aTag.indexOf(bTag)) {
            return -1;
        }

        if(~bTag.indexOf(aTag)) {
            return 1;
        }

        return aTag.localeCompare(bTag);
    };

    /**
     * Create styles
     * @return {any}
     */
    private createNumberStyles = () => {
        return this.wb.createStyle({
            font: {
                color: "#FF0800",
                size: 12,
            },
            numberFormat: "$#,##0.00; ($#,##0.00); -",
        });
    };

    /**
     * Create styles
     * @return {any}
     */
    private createDateStyles = () => {
        return this.wb.createStyle({
            font: {
                color: "#1112ff",
                size: 14,
            },
        });
    };

    /**
     * Get storage bucket based on configuration
     * @return {any}
     */
    private getBucket = () => admin.storage().bucket(configuration.bucketId);

    /**
     * Create data row in the excel report
     * @param {OperationBase} row information about operation
     */
    private createDataRow = (row: OperationBase): void => {
        this.ws.cell(this.rowNumber, 2 + this.shift).date(new Date(row.date))
            .style(this.dateStyle);
        this.ws.cell(this.rowNumber, 3 + this.shift).number(row.sum)
            .style(this.numberStyle);
        this.ws.cell(this.rowNumber, 4 + this.shift).string(row.description);
    };

    /**
     * Create total row in the excel report
     * @param tag {string} name of the group
     */
    private createTotalRow = (tag: string): void => {
        this.ws.cell(this.rowNumber, 1 + this.shift).string(tag)
            .style(this.numberStyle);
    };

    /**
     * Handle save report operation file
     * @param {string} fileName
     * @return {string} path to the file
     */
    public saveToFile = async (fileName: string): Promise<string> => {
        if (!this.data.length) {
            throw new Error("There is no data for report");
        }
        const tags: Array<string> = [];

        for (let i = 0; i < this.data.length; i++) {
            this.rowNumber++;
            this.shift = this.data[i].tags.length - 1;

            for (let j = 0; j < this.data[i].tags.length; j++) {
                if (this.data[i].tags[j] !== tags[j]) {
                    this.shift = j;
                    this.createTotalRow(this.data[i].tags[j]);
                    tags.length = j;
                    tags.push(this.data[i].tags[j]);
                    this.rowNumber++;
                }
            }

            if (this.data[i]) {
                this.createDataRow(this.data[i]);
            }
        }

        const tempLocalResultFile = path.join(os.tmpdir(), fileName);
        const buffer = await this.wb.writeToBuffer();
        await fs.writeFile(tempLocalResultFile, buffer, function(err) {
            if (err) {
                console.log(err);
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
        const expDate = new Date();
        expDate.setTime(expDate.getTime() + 2 * 24 * 60 * 60 * 1000);
        const month = expDate.getMonth() + 1;
        const day = expDate.getDate();
        const year = expDate.getFullYear();
        const resultFile = this.getBucket().file(resultFilePath);
        return await resultFile.getSignedUrl({
            action: "read",
            expires: `${month}-${day}-${year}`,
        });
    };
}
