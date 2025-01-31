import {Datastore} from "@google-cloud/datastore";
import {HttpsError} from "firebase-functions/v2/https";
import {RunQueryResponse} from "@google-cloud/datastore/build/src/query";
import {Transaction} from "@google-cloud/datastore/build/src";

/**
 * Represents a main dataStore service
 */
export default class DataStoreService {
    private readonly datastore: Datastore;
    private readonly transaction: Transaction | undefined;
    private readonly QUERY_LIMIT = 200;
    private readonly MAX_REQUEST_NUMBER = 10;

    /**
     * Main class constructor
     * @param {Datastore} datastore used for no transactional operation
     * @param {Transaction} transaction used for transactional operation
     */
    constructor(datastore: Datastore,
                transaction: Transaction | undefined = undefined) {
        this.datastore = datastore;
        this.transaction = transaction;
    }

    /**
     * Get entity by name, name = key
     * @param {Entity} entity
     * @param {string} name = key
     */
    public async getEntityByName(entity: Entity, name: string) {
        const key = this.datastore.key([entity, name]);
        const [item] = this.transaction ?
            await this.transaction.get(key) :
            await this.datastore.get(key);
        return item;
    }

    /**
     * Get entity by id
     * @param {Entity} entity
     * @param {number} id = key
     */
    public async getEntityById(entity: Entity, id: number) {
        const key = this.datastore.key([entity, id]);
        const [item] = this.transaction ?
            await this.transaction.get(key) :
            await this.datastore.get(key);
        return item;
    }

    /**
     * Return only one single entity selected by equality filter
     * @param {Entity} entity
     * @param {string} filteredField
     * @param {string} value
     */
    public async getSingleEntity(entity: Entity,
                                 filteredField: string, value: string) {
        const storeQuery = this.datastore
            .createQuery(entity)
            .filter(filteredField, "=", value)
            .limit(1);
        const [items] = await this.datastore.runQuery(storeQuery);
        return items.pop();
    }

    /**
     * Returns collection of entities selected by equality filter
     * @param {Entity} entity
     * @param {string} filteredField
     * @param {string} value
     * @param {string} orderField
     */
    public async getFilteredEntities(
        entity: Entity,
        filteredField: string, value: string | number,
        orderField: string | undefined = undefined) {
        const storeQuery = this.transaction ?
            this.transaction.createQuery(entity) :
            this.datastore.createQuery(entity);
        storeQuery.filter(filteredField, "=", value);
        if (orderField) {
            storeQuery.order(orderField);
        }
        const [items] = this.transaction ?
            await this.transaction.runQuery(storeQuery) :
            await this.datastore.runQuery(storeQuery);
        return items;
    }

    /**
     * Getting all entities from the collection (multi call if necessary)
     * @param {Entity} entity
     * @param {boolean} onlyKey projection only key
     * @param {Date | undefined} startDate
     * @param {Date | undefined} endDate
     * @param {tags} tags applied for Operations
     */
    public async getAll(entity: Entity, onlyKey: boolean,
                        startDate: Date | undefined = undefined,
                        endDate: Date | undefined = undefined,
                        tags: string[] = []) {
        let items: any[] = [];
        let endCursor: string | undefined;
        let moreResults: string | undefined = undefined;
        let requestNumber = 0;
        try {
            while (moreResults !== Datastore.NO_MORE_RESULTS &&
            requestNumber < this.MAX_REQUEST_NUMBER) {
                const storeQuery = this.datastore.createQuery(entity);
                if (onlyKey) {
                    storeQuery.select("__key__");
                }
                if (startDate) {
                    storeQuery.filter("date", ">=", startDate);
                }
                if (endDate) {
                    storeQuery.filter("date", "<=", endDate);
                }
                for (const tag of tags) {
                    storeQuery.filter("tags", "=", tag);
                }
                storeQuery.limit(this.QUERY_LIMIT);
                if (endCursor) {
                    storeQuery.start(endCursor);
                }
                const queryResult: RunQueryResponse =
                    await this.datastore.runQuery(storeQuery);

                const [entities, info] = queryResult;
                ({endCursor, moreResults} = info);
                items = [...items, ...entities];
                requestNumber++;
            }
            return items;
        } catch (error: any) {
            const runQueryError: RunQueryError = error;
            throw new HttpsError("internal",
                runQueryError.details);
        }
    }

    /**
     * Getting all entities from the collection (multi call if necessary)
     * @param {Entity} entity
     * @param {string} startCursor
     * @param {Date | undefined} startDate
     * @param {Date | undefined} endDate
     * @param {tags} tags applied for Operations
     */
    public async getNewestFilteredItems(entity: Entity, startCursor: string,
                                        startDate: Date | undefined = undefined,
                                        endDate: Date | undefined = undefined,
                                        tags: string[] = []) {
        const storeQuery = this.transaction ?
            this.transaction.createQuery(entity) :
            this.datastore.createQuery(entity);

        if (startDate) {
            storeQuery.filter("date", ">=", startDate);
        }
        if (endDate) {
            storeQuery.filter("date", "<=", endDate);
        }
        for (const tag of tags) {
            storeQuery.filter("tags", "=", tag);
        }

        storeQuery.order("created", {
            descending: true,
        });
        storeQuery.limit(20);
        storeQuery.start(startCursor);
        const queryResult: RunQueryResponse = this.transaction ?
            await this.transaction.runQuery(storeQuery) :
            await this.datastore.runQuery(storeQuery);

        const [entities, info] = queryResult;
        return {
            entities,
            info,
        };
    }

    /**
     * Get one latest entity from the collection (sorted by date)
     * @param {Entity} entity
     * @param {string} orderField
     * @param {boolean} excludeRevertRecords
     */
    public async getNewestItem(entity: Entity, orderField: string,
                               excludeRevertRecords = true) {
        const storeQuery = this.transaction ?
            this.transaction.createQuery(entity) :
            this.datastore.createQuery(entity);
        if (excludeRevertRecords) {
            storeQuery.filter("isRevertOperation", "=", false);
        }
        storeQuery.order(orderField, {
            descending: true,
        });
        storeQuery.limit(1);
        const queryResult: RunQueryResponse = this.transaction ?
            await this.transaction.runQuery(storeQuery) :
            await this.datastore.runQuery(storeQuery);

        const [entities] = queryResult;
        return entities.pop();
    }

    /**
     * Get latest range of entities from the collection (sorted by date)
     * @param {Entity} entity
     * @param {string} orderField
     * @param {string} startCursor
     */
    public async getNewestItems(entity: Entity,
                                orderField: string, startCursor: string) {
        const storeQuery = this.transaction ?
            this.transaction.createQuery(entity) :
            this.datastore.createQuery(entity);
        storeQuery.order(orderField, {
            descending: true,
        });
        storeQuery.limit(20);
        storeQuery.start(startCursor);
        const queryResult: RunQueryResponse = this.transaction ?
            await this.transaction.runQuery(storeQuery) :
            await this.datastore.runQuery(storeQuery);

        const [entities, info] = queryResult;
        return {
            entities,
            info,
        };
    }

    /**
     * Get one latest entity, selected by ancestor
     * @param {Entity} entity
     * @param {Entity} ancestor
     * @param {string} key
     */
    public async getNewestNestedItem(entity: Entity,
                                     ancestor: Entity, key: string) {
        const ancestorKey = this.datastore.key([ancestor, key]);

        const storeQuery = this.transaction ?
            this.transaction.createQuery(entity).hasAncestor(ancestorKey) :
            this.datastore.createQuery(entity).hasAncestor(ancestorKey);

        storeQuery.order("date", {
            descending: true,
        });
        storeQuery.limit(1);
        const queryResult: RunQueryResponse = this.transaction ?
            await this.transaction.runQuery(storeQuery) :
            await this.datastore.runQuery(storeQuery);

        const [entities] = queryResult;
        return entities.pop();
    }

    /**
     * Get one newest entity filtered by value and ordered by any field
     * @param {Entity} entity
     * @param {string} filteredField
     * @param {Entity} filteredEntity
     * @param {string} value
     * @param {string} orderedBy
     */
    public async getNewestFilteredByEntity(entity: Entity,
                                           filteredField: string,
                                           filteredEntity: Entity,
                                           value: string,
                                           orderedBy: string) {
        const filteredEntityKey = this.datastore.key([filteredEntity, value]);

        const storeQuery = this.transaction ?
            this.transaction.createQuery(entity) :
            this.datastore.createQuery(entity);

        storeQuery.filter(filteredField, "=", filteredEntityKey);
        storeQuery.order(orderedBy, {
            descending: true,
        });
        storeQuery.limit(1);
        const queryResult: RunQueryResponse = this.transaction ?
            await this.transaction.runQuery(storeQuery) :
            await this.datastore.runQuery(storeQuery);

        const [entities] = queryResult;
        return entities.pop();
    }

    /**
     * Upsert - create or update (if already exists)
     * @param {Entity} entity
     * @param {string} key
     * @param {object} data
     */
    public async upsertEntity(entity: Entity, key: string, data: any) {
        const entityKey = this.datastore.key([entity, key]);
        return await this.datastore.upsert({
            key: entityKey,
            data: data,
        });
    }

    /**
     * Update existing record
     * @param {Entity} entity
     * @param {string} key
     * @param {object} data
     */
    public async updateEntity(entity: Entity, key: number, data: any) {
        const entityKey = this.datastore.key([entity, key]);
        return await this.datastore.merge({
            key: entityKey,
            data: data,
        });
    }

    /**
     * Save existing record
     * @param {Entity} entity
     * @param {string} key
     * @param {object} data
     */
    public async saveEntity(entity: Entity, key: number, data: any) {
        const entityKey = this.datastore.key([entity, key]);
        return this.transaction ?
            await this.transaction.save({
                key: entityKey,
                data: data,
            }) :
            await this.datastore.save({
                key: entityKey,
                data: data,
            });
    }

    /**
     * Get one entity by Key
     * @param {Entity}entity
     * @param {string} key
     * @return {entity.Key}
     */
    public getEntityKey(entity: Entity, key: string) {
        return this.datastore.key([entity, key]);
    }

    /**
     * Get Entity KEY
     * @param {Entity} entity
     * @param {Entity} ancestor
     * @param {string} ancestorKey
     * @return {entity.Key}
     */
    public getDatastoreNestedEntityNewKey(
        entity: Entity, ancestor: Entity, ancestorKey: string) {
        return this.transaction ?
            this.transaction.key([ancestor, ancestorKey, entity]) :
            this.datastore.key([ancestor, ancestorKey, entity]);
    }

    /**
     * Insert new Entity, key must be provided
     * @param {Entity} entity
     * @param {number} key
     * @param {object} data
     */
    public async insertEntity(entity: Entity, key: number, data: any) {
        const entityKey = this.datastore.key([entity, key]);
        return this.transaction ?
            await this.transaction.insert({
                key: entityKey,
                data: data,
            }) :
            await this.datastore.insert({
                key: entityKey,
                data: data,
            });
    }

    /**
     * Insert new Entity, key will be generated automatically
     * @param {Entity} entity
     * @param {object} data
     */
    public async insertEntityNewKey(entity: Entity, data: any) {
        const entityKey = this.datastore.key(entity);
        return this.transaction ?
            await this.transaction.insert({
                key: entityKey,
                data: data,
            }) :
            await this.datastore.insert({
                key: entityKey,
                data: data,
            });
    }

    /**
     * Delete entity by KEY
     * @param {Entity} entity
     * @param {string} key
     */
    public async deleteEnity(entity: Entity, key: string) {
        const entityKey = this.datastore.key([entity, key]);
        return await this.datastore.delete(entityKey);
    }

    /**
     * Delete entity by auto generated ID
     * @param {Entity} entity
     * @param {number} id
     */
    public async deleteEnityById(entity: Entity, id: number) {
        const entityKey = this.datastore.key([entity, id]);
        return this.transaction ?
            await this.transaction.delete(entityKey) :
            await this.datastore.delete(entityKey);
    }
}
