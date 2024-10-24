import {
    beforeUserCreated,
    beforeUserSignedIn,
} from "firebase-functions/v2/identity";
import {beforeCreate} from "./auth/beforeCreateUser";
import {beforeSignIn} from "./auth/beforeSignIn";
import {setGlobalOptions} from "firebase-functions/v2";


setGlobalOptions({region: "europe-west1"});

exports.beforeCreate = beforeUserCreated((event) => {
        return beforeCreate(event.data);
    });

exports.beforeSignIn = beforeUserSignedIn((event) => {
        return beforeSignIn(event.data);
    });
