import * as process from 'process';

export default () => ({
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 3001,
  fetchBlockStep: parseInt(process.env.FETCH_BLOCK_STEP, 10) || 100,
  startBlockNumber: parseInt(process.env.START_BLOCK_NUMBER, 10) || 51283000,
});
