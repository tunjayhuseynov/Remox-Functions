import arbitrium from "../TokensList/artbitrumTokens.json";
import OffChainOracleABI from "../../abi/OffChainOracle";
import { Token } from "../Types";
import { getEthPrice } from "../Price/getEthereumPrice";
import { BigNumber, ethers } from "ethers";
import { adminApp } from "../../admin";

const proivder = new ethers.providers.JsonRpcProvider(
  "https://arb1.arbitrum.io/rpc"
);

const offChainAddress = "0x735247fb0a604c0adC6cab38ACE16D0DbA31295F";

const offChainOracleContract = new ethers.Contract(
  offChainAddress,
  OffChainOracleABI,
  proivder
);

const getTokens = async () => {
  const ethPrice = await getEthPrice();

  const newTokens = await Promise.allSettled(
    arbitrium.map((s: Token) => getToken(ethPrice, s))
  );

  for (let index = 0; index < Math.ceil(newTokens.length / 500); index++) {
    const batch = adminApp.firestore().batch()
    for (const token of newTokens.slice(index * 500, (index + 1) * 500)) {
      if (token.status == "fulfilled" && token["value"] && token.value.priceUSD != 0) {
        batch.set(adminApp.firestore().collection("arbitriumCurrency").doc(token.value.symbol.replace("/", "")), token.value)
      }
    }
    await batch.commit()
  }

};

const getToken = async (ethPrice: number, token: Token) => {
  try {
    const rate = await offChainOracleContract.getRateToEth(
      token.address.toLowerCase(),
      true
    );
    const numerator = BigNumber.from(10).pow(token.decimals);
    const denominator = BigNumber.from(10).pow(18); // eth decimals
    const price = BigNumber.from(rate).mul(numerator).div(denominator);
    const finalPrice = (+price / Math.pow(10, 18)).toString();

    if (+finalPrice == 0) {
      return {
        ...token,
        priceUSD: 0,
      };
    } else {
      return {
        address: token.address,
        decimals: token.decimals,
        name: token.name,
        symbol: token.symbol,
        chainID: token.chainId,
        priceUSD: +finalPrice * ethPrice,
        logoURI: token.logoURI,
      };
    }
  } catch (e) {
    throw new Error(e as any);
  }
};

export default getTokens;
