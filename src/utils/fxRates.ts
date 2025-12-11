import type { ExchangeRates } from '../types';

type QuoteWithBidAsk = {
  ask: number;
  bid: number;
  variation?: number;
  timestamp?: number;
};

type QuoteWithPrice = {
  price: number;
  variation?: number;
  timestamp?: number;
};

type MepBondQuote = {
  '24hs': QuoteWithPrice;
  ci: QuoteWithPrice;
};

type CriptoQuotes = {
  ccb: QuoteWithBidAsk;
  usdt: QuoteWithBidAsk;
  usdc: QuoteWithBidAsk;
};

type MepQuotes = {
  al30: MepBondQuote;
  gd30: MepBondQuote;
  [key: string]: MepBondQuote;
};

type CriptoYaDolarResponse = {
  blue: QuoteWithBidAsk;
  mep: MepQuotes;
  cripto: CriptoQuotes;
};

export async function fetchExchangeRatesFromAPI(): Promise<ExchangeRates> {
  const response = await fetch('https://criptoya.com/api/dolar');
  
  if (!response.ok) {
    throw new Error('Failed to fetch exchange rates from CriptoYa API');
  }

  const data = (await response.json()) as CriptoYaDolarResponse;

  const blueRate = (data.blue.ask + data.blue.bid) / 2;
  const mepRate = data.mep.al30['24hs'].price;
  const usdtRate = (data.cripto.usdt.ask + data.cripto.usdt.bid) / 2;

  return {
    ARS: { toARS: 1 },
    USD_BLUE: { toARS: blueRate },
    USD_MEP: { toARS: mepRate },
    USDT: { toARS: usdtRate },
  };
}
