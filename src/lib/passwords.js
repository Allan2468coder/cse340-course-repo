import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const hashPassword = async (password) => {
    const salt = randomBytes(16);
    const derivedKey = await scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
    return `scrypt$${SCRYPT_OPTIONS.N}$${SCRYPT_OPTIONS.r}$${SCRYPT_OPTIONS.p}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
};

const verifyPassword = async (password, storedHash) => {
    const [algorithm, n, r, p, saltHex, keyHex] = String(storedHash || '').split('$');
    if (algorithm !== 'scrypt' || n !== '16384' || r !== '8' || p !== '1'
        || !/^[a-f\d]{32}$/i.test(saltHex) || !/^[a-f\d]{128}$/i.test(keyHex)) return false;

    const expectedKey = Buffer.from(keyHex, 'hex');
    if (expectedKey.length !== KEY_LENGTH) return false;

    const actualKey = await scrypt(password, Buffer.from(saltHex, 'hex'), expectedKey.length, {
        N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024
    });
    return timingSafeEqual(expectedKey, actualKey);
};

export { hashPassword, verifyPassword };
