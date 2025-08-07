import { useEffect, useState } from 'react';

interface Stat {
  date: string;
  launchedTokens: number;
  graduatedTokens: number;
  txSigners: number;
  cumulativeLaunch: number;
  cumulativeGrad: number;
  cumulativeSigners: number;
  launchedTokensLast3Days: number;
  graduatedTokensLast3Days: number;
  launchedTokensLast7Days: number;
  graduatedTokensLast7Days: number;
}

function App() {
  const [stats, setStats] = useState<Stat[]>([]);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Token Launch & Graduation Stats</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Launched</th>
            <th>Graduated</th>
            <th>TX Signers</th>
            <th>Cumulative Launch</th>
            <th>Cumulative Grad</th>
            <th>Cumulative Signers</th>
            <th>Launch Last 3d</th>
            <th>Grad Last 3d</th>
            <th>Launch Last 7d</th>
            <th>Grad Last 7d</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.date}>
              <td>{s.date}</td>
              <td>{s.launchedTokens}</td>
              <td>{s.graduatedTokens}</td>
              <td>{s.txSigners}</td>
              <td>{s.cumulativeLaunch}</td>
              <td>{s.cumulativeGrad}</td>
              <td>{s.cumulativeSigners}</td>
              <td>{s.launchedTokensLast3Days}</td>
              <td>{s.graduatedTokensLast3Days}</td>
              <td>{s.launchedTokensLast7Days}</td>
              <td>{s.graduatedTokensLast7Days}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;