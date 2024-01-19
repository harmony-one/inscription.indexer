import * as process from 'process';

const parseBoolean = (value = '1') => {
  if (['true', 'false'].includes(value)) {
    return value === 'true';
  }
  return Boolean(+value);
};

export default () => ({
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 3001,
  indexer: {
    isEnabled: parseBoolean(process.env.INDEXER_IS_ENABLED || '1'),
    fetchBlockStep: parseInt(process.env.FETCH_BLOCK_STEP, 10) || 500,
    startBlockNumber: parseInt(process.env.START_BLOCK_NUMBER, 10) || 51283000,
  },
});
