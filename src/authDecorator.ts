import * as functions from "firebase-functions";
import {CallableContext} from "firebase-functions/lib/common/providers/https";

export const authDecorator = (fn: (...args: any[]) => any, roles: ROLE[]) =>
    functions.region("europe-west1")
    .https.onCall( (data, context) => {
    return decorated(fn(data, context), roles, context);
});


const decorated = (wrapped: Promise<any>, roles: ROLE[],
                         callableContext: CallableContext) => {
    const wrapper = (...args: any) => {
        const [context] = args;
        if (!process.env.FUNCTIONS_EMULATOR) {
            functions.logger.log(context.auth.token);
            if (!context.auth) {
                throw new functions.https.HttpsError("failed-precondition",
                    "The function must be called while authenticated.");
            } else if (!~roles.indexOf(context.auth.token.role)) {
                throw new functions.https.HttpsError("failed-precondition",
                    `Only ${roles} can call this function`);
            }
        }
        return wrapped;
    };
    return wrapper(callableContext);
};

