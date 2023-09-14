//import * as functions from "firebase-functions";
//import * as fs from "fs";
import * as path from "path";
import * as os from "os";
const xl = require("excel4node");


export default class ExcelReport {
    private readonly wb: any;
    private readonly ws: any;
    //private readonly data: any;

    constructor(data: any) {
        this.wb = new xl.Workbook();
        this.ws = this.wb.addWorksheet("Operation report");
        //this.data = data;
    }

    public saveToFile = (fileName: string): string => {
        const style = this.wb.createStyle({
            font: {
                color: '#FF0800',
                size: 12,
            },
            numberFormat: '$#,##0.00; ($#,##0.00); -',
        });

        // Set value of cell A1 to 100 as a number type styled with paramaters of style
        this.ws.cell(1, 1)
            .number(100)
            .style(style);

// Set value of cell B1 to 200 as a number type styled with paramaters of style
        this.ws.cell(1, 2)
            .number(200)
            .style(style);

// Set value of cell C1 to a formula styled with paramaters of style
        this.ws.cell(1, 3)
            .formula('A1 + B1')
            .style(style);

// Set value of cell A2 to 'string' styled with paramaters of style
        this.ws.cell(2, 1)
            .string('string')
            .style(style);

// Set value of cell A3 to true as a boolean type styled with paramaters of style but with an adjustment to the font size.
        this.ws.cell(3, 1)
            .bool(true)
            .style(style)
            .style({font: {size: 14}});

        // Set value of cell B1 to 200 as a number type styled with paramaters of style
        this.ws.cell(4, 2)
            .number(10)
            .style(style);

        this.ws.cell(5, 2)
            .number(20)
            .style(style);

        this.ws.cell(6, 2)
            .number(30)
            .style(style);


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

    public uploadFileToBucket = (path: string): string => {
        return "signed url";
    }
}
