const axios = require('axios');

const timestampFrom = 1706040220;
const timestampTo = timestampFrom + 24 * 3600;
const to = '0x3abf101D3C31Aec5489C78E8efc86CaA3DF7B053';

axios.get(`https://inscription-indexer.fly.dev/inscriptions`, {
    params: {
        timestampFrom: String(timestampFrom),
        timestampTo: String(timestampTo),
        to: to,
        limit: '1000',
        offset: '0'
    }
}).then(res => {
    const data = res.data.filter(
        d => ['x.com', 'twitter.com'].some(sub => d.payload?.value?.includes(sub))
    );

    // search winner
    const firstDomain = data[0].transactionHash.slice(-2);
    const diffMap = data.slice(1).map(d => firstDomain - d.transactionHash.slice(-2));
    const winner = data[diffMap.indexOf(Math.min(...diffMap)) + 1];

    const winnerDomain = winner.transactionHash.slice(-2);

    console.log({
        startTime: timestampFrom,
        endTime: timestampTo,
        firstTx: data[0]?.transactionHash,
        winnerTx: winner.transactionHash,
        winnerDomain,
        winnerLink: winner.payload.value,
        totalTxs: data.length,
    });
})