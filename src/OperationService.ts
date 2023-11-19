import {Transaction} from "@google-cloud/datastore/build/src";
import {Datastore} from "@google-cloud/datastore";
import DataStoreService from "./DataStoreService";
import * as functions from "firebase-functions";
import Util from "./Util";

/**
 * Represents a main operation service
 */
export default class OperationStoreService {
    private readonly transaction: Transaction | undefined;
    private readonly dataStoreService: DataStoreService;
    private readonly balanceRecords: Record<string, number>;
    private readonly rateRecords: Record<string, number>;

    /**
     * Main class constructor
     * @param {Datastore} datastore
     * @param {Transaction} transaction
     */
    constructor(datastore: Datastore,
                transaction: Transaction | undefined = undefined) {
        this.transaction = transaction;
        this.dataStoreService = new DataStoreService(datastore, transaction);
        this.balanceRecords = {};
        this.rateRecords = {};
    }

    /**
     * Handle post operation for one operation entity
     * @param {Operation} operation
     * @param {number} docNumber
     * @param {boolean} isRevert operation
     */
    public handleOperation = async (operation: Operation,
                                    docNumber: number, isRevert = false) => {
        if (!this.balanceRecords[operation.account.name]) {
            this.balanceRecords[operation.account.name] =
                await this.getAccountBalance(operation.account.name);
        }
        this.balanceRecords[operation.account.name] =
            this.balanceRecords[operation.account.name] - operation.sum;

        const account: Account =
            await this.getAccountByName(operation.account.name);
        if (!this.rateRecords[account.currency.name]) {
            this.rateRecords[account.currency.name] =
                await this.getCurrencyRate(
                    account.currency.name, operation.date);
        }

        if (!isRevert) {
            await this.updateTags(operation);
        }

        await this.savePostedOperation(operation, docNumber, account, isRevert);

        if (!isRevert) {
            await this.dataStoreService.deleteEnityById("operation",
                Number(operation.id));
        }
    };

    /**
     * Get account by name
     * @param {string} accountName
     */
    public getAccountByName = async (accountName: string): Promise<Account> => {
        try {
            return await this.dataStoreService
                .getEntityByName("account", accountName);
        } catch (err: any) {
            if (this.transaction) {
                await this.transaction.rollback();
            }
            const runQueryError: RunQueryError = err;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };

    /**
     * Get latest posted operation Document number and date
     */
    public getLatestDocNumberAndDate = async (): Promise<[number, Date]> => {
        try {
            const newestPostedOperation: PostedOperation =
                await this.dataStoreService.getNewestItem("posted", "created");
            return newestPostedOperation ?
                [newestPostedOperation.docNumber,
                    newestPostedOperation.created] :
                [0, new Date()];
        } catch (err: any) {
            if (this.transaction) {
                await this.transaction.rollback();
            }
            const runQueryError: RunQueryError = err;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };

    /**
     * Get account balance by name
     * @param {string} account
     */
    public getAccountBalance = async (account: string): Promise<number> => {
        try {
            const balanceOperation: PostedOperation =
                await this.dataStoreService.getNewestFilteredByEntity("posted",
                    "account", "account", account, "created");
            return balanceOperation ? balanceOperation.balance : 0;
        } catch (err: any) {
            if (this.transaction) {
                await this.transaction.rollback();
            }
            const runQueryError: RunQueryError = err;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };

    /**
     * Get currency rate for a specific date
     * @param {string} currency
     * @param {Date} operationDate
     */
    public getCurrencyRate = async (currency: string,
                                    operationDate: Date): Promise<number> => {
        let operationCurrencyRate: GetCurrencyRateResult;
        try {
            operationCurrencyRate = await this.dataStoreService
                .getNewestNestedItemLimitedByMaxDate("rate",
                    "currency", currency, operationDate);
        } catch (err: any) {
            if (this.transaction) {
                await this.transaction.rollback();
            }
            const runQueryError: RunQueryError = err;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }

        if (!operationCurrencyRate) {
            throw new functions.auth.HttpsError("invalid-argument",
                `Rate for currency "${currency}" must be provided.`);
        }
        return operationCurrencyRate.rate;
    };
    /**
     * Update tags combination
     * @param {Operation} operation
     */
    public updateTags = async (operation: Operation): Promise<void> => {
        try {
            const hashCode = Util.hashCode(operation.tags.toString());
            const combination =
                await this.dataStoreService.getEntityById("tag", hashCode);
            if (!combination) {
                await this.dataStoreService.insertEntity(
                    "tag", hashCode, {
                        tags: operation.tags,
                    });
            }
        } catch (err: any) {
            if (this.transaction) {
                await this.transaction.rollback();
            }
            const runQueryError: RunQueryError = err;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };

    /**
     * Save operation as posted
     * @param {Operation} operation
     * @param {number} docNumber
     * @param {Account} account
     * @param {boolean} isRevert operation
     */
    public savePostedOperation = async (operation: Operation,
                                        docNumber: number,
                                        account: Account,
                                        isRevert = false) => {
        const rate = this.rateRecords[account.currency.name];
        try {
            const entity = isRevert ? {
                date: new Date(operation.date),
                account: this.dataStoreService.getEntityKey(
                    "account", operation.account.name),
                description: operation.description,
                currency: this.dataStoreService.getEntityKey(
                    "currency", account.currency.name),
                sum: operation.sum,
                tags: operation.tags,
                balance: this.balanceRecords[operation.account.name],
                docNumber: docNumber,
                equivalent: Math.round(100 * operation.sum / rate),
                rate: rate,
                created: operation.created,
                user: operation.user,
                isRevertOperation: true,
            } : {
                date: new Date(operation.date),
                account: this.dataStoreService.getEntityKey(
                    "account", operation.account.name),
                description: operation.description,
                currency: this.dataStoreService.getEntityKey(
                    "currency", account.currency.name),
                sum: operation.sum,
                tags: operation.tags,
                balance: this.balanceRecords[operation.account.name],
                docNumber: docNumber,
                equivalent: Math.round(100 * operation.sum / rate),
                rate: rate,
                created: operation.created,
                user: operation.user,
            };

            return await this.dataStoreService
                .insertEntityNewKey("posted", entity);
        } catch (err: any) {
            if (this.transaction) {
                await this.transaction.rollback();
            }
            const runQueryError: RunQueryError = err;
            throw new functions.https.HttpsError("internal",
                runQueryError.details);
        }
    };
}
