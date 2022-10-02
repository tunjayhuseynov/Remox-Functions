import * as functions from "firebase-functions";
import { CeloHPRefresher } from "./currency/HPrice/celo";
import { CeloCoinFetch, SolanaCoinFetch } from "./currency";
import getEthereumTokens from "./currency/getTokens/getEthereumTokens";
import getOptimismTokens from "./currency/getTokens/getOptimismTokens";
import getPolygonTokens from "./currency/getTokens/getPolygonTokens";
import getArbitrumTokens from "./currency/getTokens/getArbitrumTokens";
import getBinanceTokens from "./currency/getTokens/getBinanceTokens";
import getAvaxTokens from "./currency/getTokens/getAvaxTokens";
import getGnosisTokens from "./currency/getTokens/getGnosisTokens";
import getFantomTokens from "./currency/getTokens/getFantomTokens";

const runtimeOpts: functions.RuntimeOptions = {
    timeoutSeconds: 540,
    memory: "512MB"
}

export const celoSolanacurrency = functions.runWith(runtimeOpts).pubsub.schedule("*/5 * * * *").timeZone('Greenwich').onRun(async (context) => {
    await Promise.all([
        CeloCoinFetch(),
        SolanaCoinFetch(),
    ])
});

export const CeloHpRefresher = functions.runWith(runtimeOpts).pubsub.schedule("1 0 * * *").timeZone('Greenwich').onRun(async (context) => {
    await CeloHPRefresher()
})


export const EthereumCurrency = functions.runWith(runtimeOpts).pubsub.schedule("*/5 * * * *").onRun(async (context) => {
    await getEthereumTokens()
});

export const FirstEVMcurrency = functions.runWith(runtimeOpts).pubsub.schedule("*/5 * * * *").onRun(async (context) => {
    await Promise.all([
        getOptimismTokens(),
        getPolygonTokens(),
        getArbitrumTokens(),
    ])
});

export const SecondEVMcurrency = functions.runWith(runtimeOpts).pubsub.schedule("*/5 * * * *").onRun(async (context) => {
    await Promise.all([
        getBinanceTokens(),
        getAvaxTokens()
    ])
});

export const ThirdEVMcurrency = functions.runWith(runtimeOpts).pubsub.schedule("*/5 * * * *").onRun(async (context) => {
    await Promise.all([
        getFantomTokens(),
        getGnosisTokens()
    ])
});

// export const scheduledFunction = functions.pubsub.schedule('00 01,13 * * *').onRun(async (context) => {
//     try {
//         await checker()
//     } catch (error) {
//         console.log(error)
//     }
//     return true
// });


// export const celoHP = functions.https.onRequest(async (request, response) => {
//     try {
//         await CeloHP()
//     } catch (error) {
//         console.log(error)
//     }
//     response.send("Hello from Firebase!");
// })