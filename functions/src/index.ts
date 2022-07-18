import * as functions from "firebase-functions";
import { CeloCoinFetch, SolanaCoinFetch } from "./currency";
import { checker } from "./gelato";

export const currency = functions.pubsub.schedule("*/5 * * * *").onRun(async (context) => {
    await CeloCoinFetch()
    await SolanaCoinFetch()
});

export const scheduledFunction = functions.pubsub.schedule('00 01,13 * * *').onRun(async (context) => {
    try {
        await checker()
    } catch (error) {
        console.log(error)
    }
    return true
});