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
    private readonly data: Array<OperationBase>;
    private readonly startDate: Date;
    private readonly endDate: Date;
    private readonly reportRows: Array<ReportRow> = new Array<ReportRow>();
    private readonly totals: Record<string, number> = {};
    private readonly filledGroups: Record<string, boolean> = {};
    private readonly tags: Array<string> = [];
    private readonly headerStyle: any;
    private readonly groupStyle: any;
    private readonly detailsStyle: any;
    private readonly detailsSumStyle: any;
    private readonly topShift: number = 4;


    /**
     * Main class constructor
     * @param {Array<OperationBase>} data for report
     * @param {Date} startDate
     * @param {Date} endDate
     */
    constructor(data: Array<OperationBase>, startDate: Date, endDate: Date) {
        this.wb = new xl.Workbook({
            dateFormat: "d-m-yy",
        });
        this.ws = this.wb.addWorksheet("Manetta report");
        this.data = data;
        this.startDate = startDate;
        this.endDate = endDate;
        this.headerStyle = this.createHeaderStyle();
        this.groupStyle = this.createGroupStyle();
        this.detailsStyle = this.createDetailsStyle();
        this.detailsSumStyle = this.createDetailsSumStyle();
        this.createHeader();
        this.createReportRows();
    }

    /**
     * Compare function, used for sorting operation array
     * @param {OperationBase} a first operation
     * @param {OperationBase} b second operation
     * @return {number} result of comparing
     */
    private compareFn = (a: OperationBase, b: OperationBase): number => {
        const aTag = a.tags.join("");
        const bTag = b.tags.join("");

        if (aTag === bTag) {
            return a.date > b.date ? 1 : -1;
        }

        if (~aTag.indexOf(bTag)) {
            return -1;
        }

        if (~bTag.indexOf(aTag)) {
            return 1;
        }

        return aTag.localeCompare(bTag);
    };


    /**
     * Create header style
     * @return {any}
     */
    private createHeaderStyle = () => {
        return this.wb.createStyle({
            font: {
                color: "#4F33FF",
                size: 16,
            },
        });
    };

    /**
     * Create group style
     * @return {any}
     */
    private createGroupStyle = () => {
        return this.wb.createStyle({
            font: {
                color: "#FF0800",
                size: 16,
            },
            numberFormat: "€#,##0.00; (€#,##0.00); -",
        });
    };

    /**
     * Create details style
     * @return {any}
     */
    private createDetailsStyle = () => {
        return this.wb.createStyle({
            font: {
                size: 14,
            },
        });
    };

    /**
     * Create details price style
     * @return {any}
     */
    private createDetailsSumStyle = () => {
        return this.wb.createStyle({
            font: {
                size: 16,
            },
            numberFormat: "€#,##0.00; (€#,##0.00); -",
        });
    };

    /**
     * Create document header with information about startDate and endDate
     */
    private createHeader = () => {
        this.ws.cell(1, 1)
            .string("Start Date")
            .style(this.headerStyle);
        this.ws.cell(1, 2)
            .date(this.startDate)
            .style(this.headerStyle);
        this.ws.cell(2, 1)
            .string("End Date")
            .style(this.headerStyle);
        this.ws.cell(2, 2)
            .date(this.endDate)
            .style(this.headerStyle);
    };


    /**
     * Get storage bucket based on configuration
     * @return {any}
     */
    private getBucket = () => admin.storage().bucket(configuration.bucketId);

    /**
     * Create report rows based on data
     */
    private createReportRows = () => {
        const orderedData = this.data.sort(this.compareFn);
        this.countTotals();

        orderedData.forEach((operation) => {
            for (let i = 0; i < operation.tags.length; i++) {
                while (this.tags.length > operation.tags.length) {
                    this.removeTag();
                }
                if (this.tags[i] !== operation.tags[i]) {
                    while (this.tags.length > i) {
                        this.removeTag();
                    }
                    this.addTag(this.tags, operation.tags[i]);
                }
            }
            this.reportRows.push({...operation,
                date: typeof(operation.date) === "string" ?
                    new Date() :
                    operation.date});
        });

        while (this.tags.length > 0) {
            this.removeTag();
        }
    };

    /**
     * Add new tag
     * @param {string[]} tags collection of current tags
     * @param {string} tag new tag
     */
    private addTag = (tags: string[], tag: string): void => {
        this.reportRows.push({
            date: null,
            sum: this.totals[this.getKey([...tags, tag])],
            description: "",
            tags: [...tags, tag],
        });
        this.tags.push(tag);
    };

    /**
     * Remove latest tag
     */
    private removeTag = (): void => {
        if (!this.filledGroups[this.getKey(this.tags)]) {
            this.reportRows.push({
                date: null,
                sum: 0,
                description: "",
                tags: [...this.tags],
            });
        }
        this.tags.pop();
    };

    /**
     * Count totals
     */
    private countTotals = (): void => {
        this.data.forEach((o) => {
            for (let i = 0; i < o.tags.length; i++) {
                this.totals[this.getKey(o.tags.slice(0, i + 1))] =
                    (this.totals[this
                        .getKey(o.tags.slice(0, i + 1))] || 0) + o.sum;
            }
            this.filledGroups[this.getKey(o.tags)] = true;
        });
    };

    /**
     * Get key based on collection of tags
     * @param {string[]} tags
     * @return {string} key
     */
    private getKey = (tags: string[]) => tags.join("|");

    /**
     * Handle save report operation file
     * @param {string} fileName
     * @return {string} path to the file
     */
    public saveToFile = async (fileName: string): Promise<string> => {
        if (!this.data.length) {
            throw new Error("There is no data for report");
        }

        for (let i = 0; i < this.reportRows.length; i++) {
            if (this.reportRows[i].date) { // details
                this.ws.cell(i + this.topShift,
                    this.reportRows[i].tags.length + 1)
                    .date(this.reportRows[i].date)
                    .style(this.detailsStyle);
                this.ws.cell(i + this.topShift,
                    this.reportRows[i].tags.length + 2)
                    .string(this.reportRows[i].description)
                    .style(this.detailsStyle);
                this.ws.cell(i + this.topShift,
                    this.reportRows[i].tags.length + 3)
                    .number(this.reportRows[i].sum)
                    .style(this.detailsSumStyle);

                this.ws.row(i + this.topShift)
                    .group(this.reportRows[i].tags.length, true);
            } else if (this.reportRows[i].sum > 0) { // header
                this.ws.cell(i + this.topShift, this.reportRows[i].tags.length)
                    .string(this.reportRows[i]
                        .tags[this.reportRows[i].tags.length - 1])
                    .style(this.groupStyle);
                this.ws.cell(i + this.topShift,
                    this.reportRows[i].tags.length + 1)
                    .number(this.reportRows[i].sum)
                    .style(this.groupStyle);
                if (this.reportRows[i].tags.length > 1) {
                    this.ws.row(i + this.topShift)
                        .group(this.reportRows[i].tags.length - 1, true);
                }
            } else { // footer (empty)
                this.ws.row(i + this.topShift)
                    .group(this.reportRows[i].tags.length, true);
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
