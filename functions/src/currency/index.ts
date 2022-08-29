import { GraphQLClient, gql } from 'graphql-request';
import axios from 'axios';
import solanaCoins from './solanaCoins';
import celoCoins from './celoCoins';
import { firestore } from 'firebase-admin'

export const CeloCoinFetch = async () => {
    // enableIndexedDbPersistence(db).catch(function (err) {
    //     if (err.code == 'failed-precondition') {
    //         // Multiple tabs open, persistence can only be enabled
    //         // in one tab at a a time.
    //         // ...
    //         console.log(err.code);
    //     } else if (err.code == 'unimplemented') {
    //         // The current browser does not support all of the
    //         // features required to enable persistence
    //         // ...
    //         console.log(err.code);
    //     }
    // });

    const blockGqlQuery = (currentDateFrom: number, currentDateTo: number) => {
        return gql`
        query GetBlock {
            blocks(
              first: 1
              orderBy: timestamp
              orderDirection: desc
              where: { timestamp_gt: ${currentDateFrom}, timestamp_lt: ${currentDateTo} }
              subgraphError: allow
            ) {
              number
            }
        }
  `
    }
    const ubeGqlQuery = (tokenId: string, block: number) => {
        return gql`
        query Token  {
            token(id: "${tokenId}", block: {number:${block}}) {
              name
              symbol
              derivedCUSD
            }
          }
  `
    }

    const endpointBlock = 'https://api.thegraph.com/subgraphs/name/ubeswap/celo-blocks'
    const endpointUbe = 'https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap'


    console.log("interval started")
    let currency = [];
    let currentDateTo = new Date().getTime()
    currentDateTo = Math.floor(currentDateTo / 1000) - 80
    const currentDateFrom = currentDateTo - 600

    const graphQLClientBlock = new GraphQLClient(endpointBlock)
    const graphQLClientUbe = new GraphQLClient(endpointUbe)

    const currentBlockQuery = blockGqlQuery(currentDateFrom, currentDateTo)
    const currentData = await graphQLClientBlock.request(currentBlockQuery)
    const currentBlockNumber = currentData.blocks[0].number

    for await (var token of celoCoins) {

        let currentUbeQuery = ubeGqlQuery(token.address.toLowerCase(), currentBlockNumber)
        let currentUbeData = await graphQLClientUbe.request(currentUbeQuery)
        let currentReserveUSD = currentUbeData.token.derivedCUSD

        let data = {
            address: token.address,
            decimals: token.decimals,
            name: token.name,
            symbol: token.symbol,
            chainID: token.chainId,
            priceUSD: parseFloat(currentReserveUSD.slice(0, 7)),
            logoURI: token.logoURI,
        }
        console.log(data)
        const currencyDF = await firestore().collection("currencies").doc(data.name).get()
        if (currencyDF.exists) {
            await firestore().collection("currencies").doc(data.name).update(data)
        } else {
            await firestore().collection("currencies").doc(data.name).set(data)
        }
        currency.push(data)
    }
    // fs.writeFileSync(path.join(__dirname, "..", "currency.txt"), JSON.stringify(currency))
}


const solanaCall = async (coin: string) => {
    const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${coin}`);
    const data = res.data;
    const current_price = data.market_data.current_price.usd;
    const last_24_chnage = data.market_data.price_change_24h

    return {
        current_price,
        last_24_chnage
    }
}

export const SolanaCoinFetch = async () => {
    try {
        for (let index = 0; index < solanaCoins.length; index++) {
            const id = solanaCoins[index].extensions.coingeckoId;
            const { current_price, last_24_chnage } = await solanaCall(id)

            let data = {
                name: solanaCoins[index].symbol,
                price: current_price,
                percent_24: last_24_chnage
            }

            const currencyDF = await firestore().collection("solanaCurrencies").doc(data.name).get()
            if (currencyDF.exists) {
                await firestore().collection("solanaCurrencies").doc(data.name).update(data)
            } else {
                await firestore().collection("solanaCurrencies").doc(data.name).set(data)
            }
        }
    }
    catch (error) {
        console.error((error as any).message)
    }
}



