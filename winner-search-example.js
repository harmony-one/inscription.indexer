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

    data.reverse();

    // search winner
    const firstDomain = Number(`0x${data[0].transactionHash.slice(-2)}`);
    const diffMap = data.slice(1).map(d => {
        const curDomain = Number(`0x${d.transactionHash.slice(-2)}`);
        return firstDomain > curDomain ? firstDomain - curDomain : curDomain - firstDomain;
    });

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


const txs = [
    '0xba446725158111b40a6f6b3facd550f3a657739f3d90ae1aa11449254a5ff69c',
    '0xba446725158111b40a6f6b3facd550f3a657739f3d90ae1aa11449254a5ff69b',
    '0xba446725158111b40a6f6b3facd550f3a657739f3d90ae1aa11449254a5ff68c',
    '0xba446725158111b40a6f6b3facd550f3a657739f3d90ae1aa11449254a5ff61c',
    '0xba446725158111b40a6f6b3facd550f3a657739f3d90ae1aa11449254a5ff600',
    '0xba446725158111b40a6f6b3facd550f3a657739f3d90ae1aa11449254a5ff69c',
];

const getWinner = (data) => {
    const firstDomain = Number(`0x${data[0].transactionHash.slice(-2)}`);
    const diffMap = data.slice(1).map(d => {
        const curDomain = Number(`0x${d.transactionHash.slice(-2)}`);
        return firstDomain > curDomain ? firstDomain - curDomain : curDomain - firstDomain;
    });
    const winner = data[diffMap.indexOf(Math.min(...diffMap)) + 1];
    return winner;
}

console.log(getWinner(txs.map(tx => ({ transactionHash: tx }))));