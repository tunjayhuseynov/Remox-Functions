import { adminApp } from '../../admin';
import CELOHP from '../hp/celo.json'
import { TokenInDB } from '../Types';
import admin from "firebase-admin";

interface IPriceList {
    date: string,
    price: number
}

export interface JsonFile {
    blockchain: string,
    coins: {
        name: string,
        symbol: string,
        address: string,
        historicalPrices: {
            usd: IPriceList[],
            eur: IPriceList[],
            gbp: IPriceList[],
            try: IPriceList[],
            aud: IPriceList[],
            cad: IPriceList[],
            jpy: IPriceList[],
        }
    }[]
}

export default async function CeloHP() {
    const data = CELOHP as JsonFile;

    const batch = adminApp.firestore().batch();
    for (const coin of data.coins) {
        batch.set(adminApp.firestore().collection("hpCELO").doc(coin.symbol), coin.historicalPrices);
    }

    await batch.commit()
}

export const CeloHPRefresher = async () => {
    const collection = await adminApp.firestore().collection("celoCurrency").get()
    const coins = collection.docs.map(doc => doc.data()) as TokenInDB[];
    const batch = adminApp.firestore().batch();
    for (const coin of coins) {
        const d = new Date()
        const date = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
        const hpReq = await adminApp.firestore().collection("hpCELO").doc(coin.symbol).get()
        const hp = hpReq.data() as JsonFile["coins"][0]["historicalPrices"]
        if (!hp.aud.some((item) => item.date === date)) {
            batch.update(adminApp.firestore().collection("hpCELO").doc(coin.symbol), {
                aud: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceAUD
                }),
                usd: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceUSD
                }),
                cad: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceCAD
                }),
                eur: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceEUR
                }),
                gpb: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceGBP
                }),
                jpy: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceJPY
                }),
                try: admin.firestore.FieldValue.arrayUnion({
                    date,
                    price: coin.priceTRY
                })
            })
        }
    }
    await batch.commit()
}