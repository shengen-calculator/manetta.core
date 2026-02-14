import * as admin from "firebase-admin";

admin.initializeApp();
exports.auth = require("./authFunc");
exports.operation = require("./operationFunc");
exports.tag = require("./tagFunc");
exports.group = require("./groupFunc");
exports.currency = require("./currencyFunc");
exports.account = require("./accountFunc");
exports.bot = require("./botFunc");

