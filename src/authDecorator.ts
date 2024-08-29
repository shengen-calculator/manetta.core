import {CallableRequest} from "firebase-functions/lib/common/providers/https";
import {setGlobalOptions} from "firebase-functions/v2";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

export const authDecorator =
    (fn: (request: CallableRequest) => any, roles: ROLE[]) => {
        setGlobalOptions({region: "europe-west1"});
        onCall((request: CallableRequest) => {
            return decorated(fn(request), roles, request);
        });
    };

const decorated = (wrapped: Promise<any>, roles: ROLE[],
                         request: CallableRequest) => {
    const wrapper = (request: CallableRequest) => {
        if (!process.env.FUNCTIONS_EMULATOR) {
            logger.info(request.auth?.token);
            if (!request.auth) {
                throw new HttpsError("failed-precondition",
                    "The function must be called while authenticated.");
            } else if (!~roles.indexOf(request.auth?.token?.role)) {
                throw new HttpsError("failed-precondition",
                    `Only ${roles} can call this function`);
            }
        }
        return wrapped;
    };
    return wrapper(request);
};

