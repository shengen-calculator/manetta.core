import {HttpsError} from "firebase-functions/v2/https";
import {AuthUserRecord} from "firebase-functions/v2/identity";
import {getUserByEmail} from "./authHelper";

export const beforeCreate = async (user: AuthUserRecord | undefined) => {
    if (!user) {
        throw new HttpsError("invalid-argument", "Permission denied");
    }

    let dbUser: User;
    try {
        dbUser = await getUserByEmail(user);
    } catch (error: any) {
        const runQueryError: RunQueryError = error;
        throw new HttpsError("internal", runQueryError.details);
    }

    if (!dbUser) {
        throw new HttpsError(
            "invalid-argument",
            `Unauthorized email "${user.email}"`,
        );
    }
};
