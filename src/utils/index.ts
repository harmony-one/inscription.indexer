import { randomBytes } from '@harmony-js/crypto/dist/random';

export const uuidv4 = () => {
  return [randomBytes(4), randomBytes(4), randomBytes(4), randomBytes(4)].join(
    '-',
  );
};

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
