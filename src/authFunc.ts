import {
    beforeUserCreated,
    beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import {beforeCreate} from "./auth/beforeCreateUser";
import {beforeSignIn} from "./auth/beforeSignIn";


exports.beforeCreate = beforeUserCreated((event) => {
        return beforeCreate(event.data);
    });

exports.beforeSignIn = beforeUserSignedIn((event) => {
        return beforeSignIn(event.data);
    });
