import dayjs from 'dayjs';
import { fetchMintTransfers, fetchGraduations, MintTransfer, Graduation } from './fetchData';

interface DailyStats {
  date: string;
  launchedTokens: number;
  graduatedTokens: number;
  txSigners: number;
}

export async function buildStats() {
  const mintTransfers = await fetchMintTransfers(2000);
  const graduations = await fetchGraduations(mintTransfers.map(m => m.tokenMintAddress), 2000);

  const byDate: Record<string, DailyStats> = {};

  const group = (dateStr: string) => {
    if (!byDate[dateStr]) {
      byDate[dateStr] = {
        date: dateStr,
        launchedTokens: 0,
        graduatedTokens: 0,
        txSigners: 0
      };
    }
    return byDate[dateStr];
  };

  const signerByDate: Record<string, Set<string>> = {};

  mintTransfers.forEach(m => {
    const dateStr = dayjs.unix(m.blockTime).format('YYYY-MM-DD');
    group(dateStr).launchedTokens += 1;
    if (!signerByDate[dateStr]) signerByDate[dateStr] = new Set();
    signerByDate[dateStr].add(m.txSigner);
  });

  Object.entries(signerByDate).forEach(([date, signers]) => {
    group(date).txSigners = signers.size;
  });

  graduations.forEach(g => {
    const dateStr = dayjs.unix(g.blockTime).format('YYYY-MM-DD');
    group(dateStr).graduatedTokens += 1;
  });

  // Convert to array ordered by date
  const stats = Object.values(byDate).sort((a, b) =>
    dayjs(a.date).unix() - dayjs(b.date).unix()
  );

  // Cumulative & moving sums
  let cumulativeLaunch = 0;
  let cumulativeGrad = 0;
  let cumulativeSigners = 0;

  return stats.map((s, idx) => {
    cumulativeLaunch += s.launchedTokens;
    cumulativeGrad += s.graduatedTokens;
    cumulativeSigners += s.txSigners;

    const last3 = stats.slice(Math.max(0, idx - 2), idx + 1);
    const last7 = stats.slice(Math.max(0, idx - 6), idx + 1);

    const sum = (arr: DailyStats[], field: keyof DailyStats) =>
      arr.reduce((acc, item) => acc + (item[field] as number), 0);

    return {
      ...s,
      cumulativeLaunch,
      cumulativeGrad,
      cumulativeSigners,
      launchedTokensLast3Days: sum(last3, 'launchedTokens'),
      graduatedTokensLast3Days: sum(last3, 'graduatedTokens'),
      launchedTokensLast7Days: sum(last7, 'launchedTokens'),
      graduatedTokensLast7Days: sum(last7, 'graduatedTokens')
    };
  });
}