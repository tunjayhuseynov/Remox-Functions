export interface Token {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  type?: string;
}

export interface TokenInDB extends Token{
  priceUSD: number,
  priceAUD: number,
  priceCAD: number,
  priceEUR: number,
  priceGBP: number,
  priceJPY: number,
  priceTRY: number,
}