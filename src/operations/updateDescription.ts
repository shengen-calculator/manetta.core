import { CallableRequest } from "firebase-functions/lib/common/providers/https";
import { HttpsError } from "firebase-functions/v2/https";

export const updateDescription = async (request: CallableRequest) => {
  try {
  } catch (error: any) {
    const runQueryError: RunQueryError = error;
    throw new HttpsError("internal", runQueryError.details);
  }
};
