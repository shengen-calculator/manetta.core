import {authDecorator} from "./authDecorator";
import {getAllCurrencies} from "./currency/getAllCurrencies";
import {getCurrencyRate} from "./currency/getCurrencyRate";
import {addCurrencyRate} from "./currency/addCurrencyRate";

exports.getAllCurrencies = authDecorator(getAllCurrencies, ["ADMIN", "BOOKER"]);
exports.getCurrencyRate = authDecorator(getCurrencyRate, ["ADMIN", "BOOKER"]);
exports.addCurrencyRate = authDecorator(addCurrencyRate, ["ADMIN"]);
