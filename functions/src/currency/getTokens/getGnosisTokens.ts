import avaxTokens from "../TokensList/avaxTokens.json";
import OffChainOracleABI from "../../abi/OffChainOracle";
import { Token } from "../Types";
import { ethers } from "ethers";
import { adminApp } from "../../admin";
import { getToken } from "./utils";

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc.gnosischain.com"
);

const offChainAddress = "0xBd0c7AaF0bF082712EbE919a9dD94b2d978f79A9";

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
    avaxTokens.map((s: Token) => getToken(s, ethPrice.toString(), offChainOracleContract))
  );


  for (let index = 0; index < Math.ceil(newTokens.length / 500); index++) {
    const batch = adminApp.firestore().batch()
    for (const token of newTokens.slice(index * 500, (index + 1) * 500)) {
      if (token.status == "fulfilled" && token["value"] && token.value.priceUSD != 0) {
        batch.set(adminApp.firestore().collection("gnosisCurrency").doc(token.value.symbol.replace("/", "")), token.value)
      }
    }
    await batch.commit()
  }
};

export default getTokens;
