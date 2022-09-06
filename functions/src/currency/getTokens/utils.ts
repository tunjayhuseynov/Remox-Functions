import { ethers } from "ethers";
import type { Token } from "../Types";
import BigNumber from 'bignumber.js'

export const getToken = async (token: Token, ethPrice: string, offChainOracleContract: ethers.Contract) => {
    try {
        const rate = await offChainOracleContract.getRateToEth(
            token.address.toLowerCase(),
            true
        );
        const numerator = new BigNumber(10).pow(token.decimals);
        const denominator = new BigNumber(10).pow(18);
        const tokenAmount = new BigNumber(rate.toString()).multipliedBy(numerator.toString()).div(denominator);
        // const denominator = BigNumber.from(10).pow(6); // eth decimals
        // const price = BigNumber.from(rate).mul(numerator).div(denominator);
        // const finalPrice = (+price / Math.pow(10, 18)).toString();
        const finalPrice = new BigNumber(tokenAmount).div(denominator).multipliedBy(new BigNumber(ethPrice).div(1e6).toFixed(2)).toFixed(4);

        if (+finalPrice == 0 && finalPrice.length > 13) {
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
                type: token.type == "Yield" ?? "Spot",
                priceUSD: +finalPrice,
                logoURI: token.logoURI,
            };
        }
    } catch (e) {
        throw new Error(e as any);
    }
};