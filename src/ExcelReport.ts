//import * as functions from "firebase-functions";
import { GetSignedUrlConfig } from '@google-cloud/storage';
import * as admin from "firebase-admin";
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import {configuration} from "../settings";
const xl = require("excel4node");


export default class ExcelReport {
    private readonly wb: any;
    private readonly ws: any;
    private readonly style: any;
    private readonly data: Array<OperationBase>;

    constructor(data: Array<OperationBase>) {
        this.wb = new xl.Workbook();
        this.ws = this.wb.addWorksheet("Manetta report");
        this.data = data;
        this.style = this.createStyles();
    }

    private createStyles = () => {
        return this.wb.createStyle({
            font: {
                color: '#FF0800',
                size: 12,
            },
            numberFormat: '$#,##0.00; ($#,##0.00); -',
        });
    };

    private getBucket = () => admin.storage().bucket(configuration.bucketId);

    public saveToFile = (fileName: string): string => {
        if(!this.data.length) {
            throw new Error("There is no data for report")
        }

        // Set value of cell A1 to 100 as a number type styled with paramaters of style
        this.ws.cell(1, 1)
            .number(100)
            .style(this.style);

// Set value of cell B1 to 200 as a number type styled with paramaters of style
        this.ws.cell(1, 2)
            .number(200)
            .style(this.style);

// Set value of cell C1 to a formula styled with paramaters of style
        this.ws.cell(1, 3)
            .formula('A1 + B1')
            .style(this.style);

// Set value of cell A2 to 'string' styled with paramaters of style
        this.ws.cell(2, 1)
            .string('string')
            .style(this.style);

// Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
        this.ws.cell(3, 1)
            .bool(true)
            .style(this.style)
            .style({font: {size: 14}});

        // Set value of cell B1 to 200 as a number type styled with paramaters of style
        this.ws.cell(4, 2)
            .number(10)
            .style(this.style);

        this.ws.cell(5, 2)
            .number(20)
            .style(this.style);

        this.ws.cell(6, 2)
            .number(30)
            .style(this.style);


        this.ws.row(4).group(3, true);
        this.ws.row(5).group(4, true);
        this.ws.row(6).group(3, true);

        this.ws.row(7).group(3, true);
        this.ws.row(8).group(4, true);
        this.ws.row(9).group(3, true);

        this.ws.row(10).group(2, true);
        this.ws.row(11).group(1);

        const tempLocalResultFile = path.join(os.tmpdir(), fileName);

        this.wb.write(tempLocalResultFile, function(err: any, stats: any) {
            if (err) {
                console.error(err);
            } else {
                console.log(stats); // Prints out an instance of a node.js fs.Stats object
            }
        });

        return tempLocalResultFile;
    };

    public uploadFileToBucket = async (path: string, fileName: string): Promise<any> => {

        const resultFilePath = `OutBox/${fileName}`;
        const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const metadata = {
            contentType: contentType,
            contentDisposition: `attachment; filename="${fileName}"`
        };
        await this.getBucket().upload(path, {destination: resultFilePath, metadata: metadata});

        fs.unlinkSync(path);

        const expDate = new Date();
        expDate.setTime(expDate.getTime() + 2*24*60*60*1000);

        const config: GetSignedUrlConfig = {
            action: "read",
            expires: `${expDate.getMonth() + 1}-${expDate.getDate()}-${expDate.getFullYear()}`
        };

        const resultFile = this.getBucket().file(resultFilePath);

        return resultFile.getSignedUrl(config);
    }
}
