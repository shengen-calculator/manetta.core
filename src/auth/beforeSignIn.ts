import {HttpsError} from "firebase-functions/v2/https";
import {
    AuthUserRecord,
} from "firebase-functions/lib/common/providers/identity";
import {getUserByEmail} from "./authHelper";

export const beforeSignIn = async (user: AuthUserRecord) => {
    let dbUser: User;
    try {
        dbUser = await getUserByEmail(user);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }

    if (!dbUser) {
        throw new HttpsError("invalid-argument",
            `Unauthorized email "${user.email}"`);
    }
    try {
        const customClaims: Claims = {
            role: dbUser.role,
        };
        return {
            sessionClaims: customClaims,
        };
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal",
            runQueryError.details);
    }
};
