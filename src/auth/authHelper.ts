import DataStoreService from "../DataStoreService";
import {Datastore} from "@google-cloud/datastore";
import {AuthUserRecord} from "firebase-functions/lib/common/providers/identity";
import {CallableRequest} from "firebase-functions/lib/common/providers/https";

export const getUserByEmail = async (user: AuthUserRecord): Promise<User> => {
    const datastore = new Datastore();
    const dataStoreService = new DataStoreService(datastore);
    const email: string = user?.email?.length ? user.email : "";
    return await dataStoreService.getSingleEntity("user", "email", email);
};

export const getUserEmailByContext =
    (request: CallableRequest): string => request.auth?.token?.email ?
        request.auth.token.email :
        "fake.user@test.com";
