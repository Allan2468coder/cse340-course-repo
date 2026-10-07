import db from './db.js';
import { hashPassword } from '../lib/passwords.js';

const ensureAccountTable = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS account (
            account_id SERIAL PRIMARY KEY,
            account_firstname VARCHAR(50) NOT NULL,
            account_lastname VARCHAR(50) NOT NULL,
            account_email VARCHAR(255) NOT NULL UNIQUE,
            account_password TEXT NOT NULL,
            account_type VARCHAR(20) NOT NULL DEFAULT 'Client'
                CHECK (account_type IN ('Client', 'Admin'))
        );
    `);
};

const getAllAccounts = async () => {
    const result = await db.query(`
        SELECT account_id, account_firstname, account_lastname, account_email, account_type
        FROM account
        ORDER BY account_lastname, account_firstname, account_email;
    `);
    return result.rows;
};

const getAccountByEmail = async (email) => {
    const result = await db.query(`
        SELECT account_id, account_firstname, account_lastname, account_email,
            account_password, account_type
        FROM account
        WHERE account_email = $1;
    `, [email]);
    return result.rows[0] || null;
};

const createAccount = async ({ firstName, lastName, email, passwordHash, role = 'Client' }) => {
    const result = await db.query(`
        INSERT INTO account
            (account_firstname, account_lastname, account_email, account_password, account_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING account_id, account_firstname, account_lastname, account_email, account_type;
    `, [firstName, lastName, email, passwordHash, role]);
    return result.rows[0];
};

const ensureAdminAccount = async ({ email, password, firstName = 'Admin', lastName = 'User' }) => {
    if (!password) return false;

    const passwordHash = await hashPassword(password);
    await db.query(`
        INSERT INTO account
            (account_firstname, account_lastname, account_email, account_password, account_type)
        VALUES ($1, $2, $3, $4, 'Admin')
        ON CONFLICT (account_email) DO UPDATE SET
            account_firstname = EXCLUDED.account_firstname,
            account_lastname = EXCLUDED.account_lastname,
            account_password = EXCLUDED.account_password,
            account_type = 'Admin';
    `, [firstName, lastName, email.toLowerCase(), passwordHash]);
    return true;
};

export { ensureAccountTable, ensureAdminAccount, getAllAccounts, getAccountByEmail, createAccount };
