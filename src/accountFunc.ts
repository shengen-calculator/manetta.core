import {authDecorator} from "./authDecorator";
import {getAllAccounts} from "./account/getAllAccounts";
import {getAccountBalance} from "./account/getAccountBalance";
import {saveAccount} from "./account/saveAccount";

exports.getAllAccounts = authDecorator(getAllAccounts, ["ADMIN", "BOOKER"]);
exports.getAccountBalance =
    authDecorator(getAccountBalance, ["ADMIN", "BOOKER"]);
exports.saveAccount = authDecorator(saveAccount, ["ADMIN"]);
