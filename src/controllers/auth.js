import { body, validationResult } from 'express-validator';
import { createAccount, getAccountByEmail } from '../models/accounts.js';
import { hashPassword, verifyPassword } from '../lib/passwords.js';

const registrationValidationRules = [
    body('first_name').trim().notEmpty().withMessage('First name is required.')
        .bail().isLength({ max: 50 }).withMessage('First name must be 50 characters or fewer.'),
    body('last_name').trim().notEmpty().withMessage('Last name is required.')
        .bail().isLength({ max: 50 }).withMessage('Last name must be 50 characters or fewer.'),
    body('email').trim().normalizeEmail().notEmpty().withMessage('Email is required.')
        .bail().isEmail().withMessage('Enter a valid email address.')
        .bail().isLength({ max: 255 }).withMessage('Email must be 255 characters or fewer.'),
    body('password').isString().withMessage('Password must be text.')
        .bail().isLength({ min: 8, max: 128 })
        .withMessage('Password must be between 8 and 128 characters.'),
    body('confirm_password').custom((value, { req }) => value === req.body.password)
        .withMessage('Passwords do not match.')
];

const loginValidationRules = [
    body('email').trim().normalizeEmail().notEmpty().withMessage('Email is required.')
        .bail().isEmail().withMessage('Enter a valid email address.'),
    body('password').isString().withMessage('Password is required.')
        .bail().notEmpty().withMessage('Password is required.')
];

const errorsFor = (req) => Object.fromEntries(
    Object.entries(validationResult(req).mapped()).map(([field, error]) => [field, error.msg])
);

const showRegisterPage = (req, res) => res.render('register', {
    title: 'Create Account', errors: {}, account: { first_name: '', last_name: '', email: '' }
});

const registerAction = async (req, res) => {
    const account = {
        first_name: String(req.body.first_name || '').trim(),
        last_name: String(req.body.last_name || '').trim(),
        email: String(req.body.email || '').trim().toLowerCase()
    };
    const errors = errorsFor(req);
    if (Object.keys(errors).length) {
        return res.status(400).render('register', { title: 'Create Account', account, errors });
    }

    try {
        const passwordHash = await hashPassword(req.body.password);
        await createAccount({
            firstName: account.first_name,
            lastName: account.last_name,
            email: account.email,
            passwordHash
        });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).render('register', {
                title: 'Create Account', account,
                errors: { email: 'An account already exists for this email.' }
            });
        }
        throw error;
    }

    req.flash('success', 'Account created. Please log in.');
    return res.redirect('/login');
};

const showLoginPage = (req, res) => res.render('login', { title: 'Log In', errors: {}, email: '' });

const loginAction = async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const errors = errorsFor(req);
    if (Object.keys(errors).length) {
        return res.status(400).render('login', { title: 'Log In', errors, email });
    }

    const account = await getAccountByEmail(email);
    const validPassword = account && await verifyPassword(req.body.password, account.account_password);
    if (!validPassword) {
        return res.status(401).render('login', {
            title: 'Log In', email,
            errors: { credentials: 'Email or password is incorrect.' }
        });
    }

    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    req.session.account = {
        account_id: account.account_id,
        account_firstname: account.account_firstname,
        account_lastname: account.account_lastname,
        account_email: account.account_email,
        account_type: account.account_type
    };
    req.flash('success', `Welcome, ${account.account_firstname}.`);
    return res.redirect('/dashboard');
};

const logOut = (req, res, next) => {
    req.session.destroy(error => {
        if (error) return next(error);
        res.clearCookie('connect.sid');
        return res.redirect('/login');
    });
};

export {
    registrationValidationRules,
    loginValidationRules,
    showRegisterPage,
    registerAction,
    showLoginPage,
    loginAction,
    logOut
};
