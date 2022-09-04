import ethereumTokens from "../TokensList/ethereumTokens.json";
import OffChainOracleABI from "../../abi/OffChainOracle";
import { ethers } from "ethers";
import { adminApp } from "../../admin";
import { getToken } from "./utils";

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.ankr.com/eth"
);

const offChainAddress = "0x07D91f5fb9Bf7798734C3f606dB065549F6893bb";

const offChainOracleContract = new ethers.Contract(
  offChainAddress,
  OffChainOracleABI,
  provider
);

const getTokens = async () => {
  const ethPrice = await offChainOracleContract.getRate(
    "0x0000000000000000000000000000000000000000",
    "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    true
  );

  const newTokens = await Promise.allSettled(
    ethereumTokens.map((s) => getToken(s, ethPrice.toString(), offChainOracleContract))
  );


  for (let index = 0; index < Math.ceil(newTokens.length / 500); index++) {
    const batch = adminApp.firestore().batch()
    for (const token of newTokens.slice(index * 500, (index + 1) * 500)) {
      if (token.status == "fulfilled" && token["value"] && token.value.priceUSD != 0) {
        batch.set(adminApp.firestore().collection("ethereumCurrency").doc(token.value.symbol.replace("/", "")), token.value)
      }
    }
    await batch.commit()
  }
};

export default getTokens;
