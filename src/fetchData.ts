import { Connection, PublicKey } from '@solana/web3.js';
import dayjs from 'dayjs';

const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const PROGRAM_ID = new PublicKey('LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj');
const START_DATE = dayjs('2024-04-24');

const ALLOWED_ACCOUNTS = new Set([
  'FfYek5vEz23cMkWsdJwG2oa6EphsvXSHrGpdALN4g6W1',
  'BuM6KDpWiTcxvrpXywWFiw45R2RNH8WURdvqoTDV1BW4'
]);

export interface MintTransfer {
  tokenMintAddress: string;
  txSigner: string;
  blockTime: number;
}

export interface Graduation {
  tokenMintAddress: string;
  blockTime: number;
}

const connection = new Connection(RPC_ENDPOINT, 'confirmed');

// RPC does not provide the same "instruction_calls" table.
// We need to fetch signatures and each transaction then inspect instructions.
export async function fetchMintTransfers(limit = 1000): Promise<MintTransfer[]> {
  const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
    limit,
    until: undefined
  });

  const transfers: MintTransfer[] = [];

  for (const { signature } of signatures) {
    const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
    if (!tx?.blockTime) continue;
    if (dayjs.unix(tx.blockTime).isBefore(START_DATE)) continue;

    const message = tx.transaction.message;
    // find the instruction executed by PROGRAM_ID
    const ix = message.instructions.find(ix =>
      'programId' in ix && ix.programId.equals(PROGRAM_ID)
    );

    if (!ix || !('accounts' in ix)) continue;

    // custom logic: first 8 bytes check
    const data = Buffer.from((ix as any).data, 'base64');
    const sig = 'afaf6d1f0d989bed';
    const header = data.toString('hex').slice(0, sig.length);
    if (header !== sig) continue;

    const accountKeys = message.accountKeys.map(k => k.toBase58());
    const accountArguments = (ix as any).accounts.map((idx: number) => accountKeys[idx]);

    if (!ALLOWED_ACCOUNTS.has(accountArguments[4])) continue;

    transfers.push({
      tokenMintAddress: accountArguments[7],
      txSigner: accountArguments[1],
      blockTime: tx.blockTime
    });
  }
  return transfers;
}

export async function fetchGraduations(mints: string[], limit = 1000): Promise<Graduation[]> {
  const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, {
    limit,
    until: undefined
  });

  const graduations: Graduation[] = [];

  for (const { signature } of signatures) {
    const tx = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
    if (!tx?.blockTime) continue;
    const message = tx.transaction.message;

    const ix = message.instructions.find(ix =>
      'programId' in ix && ix.programId.equals(PROGRAM_ID)
    );
    if (!ix || !('accounts' in ix)) continue;

    const accountKeys = message.accountKeys.map(k => k.toBase58());
    const accountArguments = (ix as any).accounts.map((idx: number) => accountKeys[idx]);

    if (accountArguments[2] && mints.includes(accountArguments[2])) {
      graduations.push({
        tokenMintAddress: accountArguments[2],
        blockTime: tx.blockTime
      });
    }
  }
  return graduations;
}