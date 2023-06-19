import * as functions from "firebase-functions";
import {beforeCreate} from "./auth/beforeCreateUser";
import {onCreate} from "./auth/onCreateUser";

exports.beforeCreate = functions.region("europe-west1")
    .auth.user().beforeCreate((user, context) => {
        return beforeCreate(user);
    });

exports.onCreate = functions.region("europe-west1")
    .auth.user().onCreate((user) => {
        return onCreate(user);
    });
