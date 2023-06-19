import * as functions from "firebase-functions";
import {
    AuthUserRecord,
} from "firebase-functions/lib/common/providers/identity";
import * as admin from "firebase-admin";
import {getUserByEmail} from "./authHelper";

export const onCreate = async (user: AuthUserRecord) => {
    let dbUser: User;
    try {
        dbUser = await getUserByEmail(user);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }

    if (!dbUser) {
        throw new functions.auth.HttpsError("invalid-argument",
            `Unauthorized email "${user.email}"`);
    }
    try {
        const customClaims: Claims = {
            role: dbUser.role,
        };

        await admin.auth().setCustomUserClaims(user.uid, customClaims);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new functions.https.HttpsError("internal",
            runQueryError.details);
    }
};
