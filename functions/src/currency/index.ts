import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';
import solanaCoins from './TokensList/solanaCoins.json';
import celoCoins from './TokensList/celoCoins';
import { firestore } from 'firebase-admin'

export const CeloCoinFetch = async () => {
    const ubeGqlQuery = (tokenId: string) => {
        return gql`
        query Token  {
            token(id: "${tokenId}") {
              name
              symbol
              derivedCUSD
            }
          }
  `
    }

    const endpointUbe = 'https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap'

    console.log("interval started")

    const graphQLClientUbe = new GraphQLClient(endpointUbe)

    const tokens = await Promise.allSettled(celoCoins.map(async (token) => {
        let currentUbeQuery = ubeGqlQuery(token.address.toLowerCase())
        let currentUbeData = await graphQLClientUbe.request(currentUbeQuery)
        let currentReserveUSD = currentUbeData.token.derivedCUSD

        return {
            address: token.address,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
            chainID: token.chainId,
            priceUSD: parseFloat(currentReserveUSD.slice(0, 7)),
            logoURI: token.logoURI,
            type: token.type ?? "Spot"
        }
    }))

    for (let index = 0; index < Math.ceil(tokens.length / 500); index++) {
        const batch = firestore().batch()
        const batchTokens = tokens.slice(index * 500, (index + 1) * 500)
        for (let i = 0; i < batchTokens.length; i++) {
            const token = batchTokens[i]
            if (token.status === "fulfilled" && token.value.priceUSD != 0) {
                const data = token.value;
                const docRef = firestore().collection("celoCurrency").doc(data.symbol.replace("/", ""))
                batch.set(docRef, data)
            }
        }
        await batch.commit()
    }

}


const solanaCall = async (coin: string) => {
    // const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);
    // const data = res.data;
    // const current_price = data.market_data.current_price.usd;
    // const last_24_chnage = data.market_data.price_change_24h

    const res = await axios.get(`https://price.jup.ag/v1/price?id=${coin}`);
    const data = res.data;
    if (!data || !data.data || !data.data.price) return { current_price: 0 }
    const current_price = data.data.price;

    return {
        current_price,
    }
}

export const SolanaCoinFetch = async () => {
    try {
        const tokens = await Promise.allSettled(solanaCoins.map(async (token) => {
            const id = token.symbol;
            const { current_price } = await solanaCall(id)

            return {
                address: token.address,
                decimals: token.decimals,
                name: token.name,
                symbol: token.symbol,
                chainID: token.chainId,
                priceUSD: current_price,
                logoURI: token.logoURI,
                type: token.type ?? "Spot"
            }
        }))

        for (let index = 0; index < Math.ceil(tokens.length / 500); index++) {
            const batch = firestore().batch()
            const batchTokens = tokens.slice(index * 500, (index + 1) * 500)
            for (let i = 0; i < batchTokens.length; i++) {
                const token = batchTokens[i]
                if (token.status === "fulfilled" && token.value.priceUSD != 0) {
                    const data = token.value;
                    const docRef = firestore().collection("solanaCurrency").doc(data.symbol.replace("/", ""))
                    batch.set(docRef, data)
                }
            }
            await batch.commit()
        }
    }
    catch (error) {
        console.error((error as any).message)
    }
}



