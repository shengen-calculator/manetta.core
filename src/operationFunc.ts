import {authDecorator} from "./authDecorator";
import {saveOperation} from "./operations/saveOperation";
import {deleteOperation} from "./operations/deleteOperation";
import {getAllOperation} from "./operations/getAllOperations";
import {getPostedOperation} from "./operations/getPostedOperations";
import {postOperations} from "./operations/postOperations";
import {getRecentlyPosted} from "./operations/getRecentlyPosted";
import {operationReport} from "./operations/operationReport";
import {revertOperation} from "./operations/revertOperation";
import {getReportRecords} from "./operations/getReportRecords";

exports.postOperations = authDecorator(postOperations, ["ADMIN", "BOOKER"]);
exports.revertOperation = authDecorator(revertOperation, ["ADMIN", "BOOKER"]);
exports.saveOperation = authDecorator(saveOperation, ["ADMIN", "BOOKER"]);
exports.deleteOperation = authDecorator(deleteOperation, ["ADMIN"]);
exports.getAllOperation = authDecorator(getAllOperation, ["ADMIN", "BOOKER"]);
exports.operationReport = authDecorator(operationReport, ["ADMIN", "BOOKER"]);
exports.getRecentlyPosted =
    authDecorator(getRecentlyPosted, ["ADMIN", "BOOKER"]);
exports.getReportRecords =
    authDecorator(getReportRecords, ["ADMIN", "BOOKER"]);
exports.getPostedOperation =
    authDecorator(getPostedOperation, ["ADMIN", "BOOKER"]);
