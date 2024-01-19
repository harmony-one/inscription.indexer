import axios from 'axios';
const Web3Utils = require('web3-utils');

export interface Tx {
  hash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string;
  gas: number;
  gasPrice: number;
  timestamp: number;
  input: string; // this is the encoded data
}

export interface Inscription extends Tx {
  jsonData: any;
}

const DEFAULT_RPC_ENDPOINT = 'https://api.s0.t.hmny.io';

export interface FetchParams {
  rpcEndpoint?: string;
}

export interface FetchTransactionsParams extends FetchParams {
  startBlock: number;
  endBlock: number;
}

export const fetchTransactions = async (
  params: FetchTransactionsParams,
): Promise<Tx[]> => {
  const { startBlock, endBlock, rpcEndpoint = DEFAULT_RPC_ENDPOINT } = params;

  const res = await axios.post(rpcEndpoint, {
    jsonrpc: '2.0',
    method: 'hmyv2_getBlocks',
    params: [
      startBlock,
      endBlock,
      {
        fullTx: true,
        withSigners: false,
        inclStaking: false,
      },
    ],
    id: 1,
  });

  if (!res.data.result && res.data.error) {
    throw res.data.error.message;
  }

  const txs: Tx[] = [];

  for (const block of res.data.result) {
    if (block.transactions && Array.isArray(block.transactions)) {
      const blockTxs = block.transactions.map((tx: any) => ({
        hash: tx.hash,
        transactionIndex: tx.transactionIndex,
        blockHash: tx.blockHash,
        blockNumber: tx.blockNumber,
        from: tx.from,
        to: tx.to,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        timestamp: tx.timestamp,
        input: tx.input,
      }));

      txs.push(...blockTxs);
    }
  }

  return txs;
};

export async function getBlockNumber(params?: FetchParams): Promise<number> {
  const rpcEndpoint = params?.rpcEndpoint || DEFAULT_RPC_ENDPOINT;

  const res = await axios.post(rpcEndpoint, {
    jsonrpc: '2.0',
    method: 'hmyv2_blockNumber',
    params: [],
    id: 1,
  });

  if (!res.data.result && res.data.error) {
    throw res.data.error.message;
  }

  return res.data.result;
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const processTxs = (txs: Tx[]): Inscription[] => {
  const inscriptions = [];

  for (const tx of txs) {
    try {
      const data = Web3Utils.hexToUtf8(tx.input);
      const jsonData = JSON.parse(data);
      inscriptions.push({
        ...tx,
        jsonData,
      });
    } catch (error) {}
  }

  return inscriptions;
};
