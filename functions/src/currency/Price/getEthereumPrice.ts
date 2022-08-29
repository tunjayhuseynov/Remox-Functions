import axios from "axios";

const url =
  "https://api.coingecko.com/api/v3/coins/ethereum?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false";

export const getEthPrice = async () => {
  try {
    const request = await axios(url);
    const response = await request.data;
    return response.market_data.current_price.usd;
  } catch (e: any) {
    return e;
  }
};
