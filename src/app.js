import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import router from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = (NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production') => {
    const app = express();

    app.use(express.static(path.join(__dirname, '../public')));
    app.use(express.urlencoded({ extended: true }));
    app.set('trust proxy', 1);
    app.use(session({
        secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
        resave: false,
        saveUninitialized: false,
        cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 30 * 60 * 1000 }
    }));
    app.use(flash());
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));

    app.use((req, res, next) => {
        if (NODE_ENV === 'development') {
            console.log(`${req.method} ${req.url}`);
        }
        next();
    });

    app.use((req, res, next) => {
        res.locals.NODE_ENV = NODE_ENV;
        res.locals.currentUser = req.session.account || null;
        res.locals.successMessages = req.flash('success');
        res.locals.errorMessages = req.flash('error');
        next();
    });

    app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
    app.use(router);

    app.use((req, res, next) => {
        const err = new Error('Page Not Found');
        err.status = 404;
        next(err);
    });

    app.use((err, req, res, next) => {
        console.error('Error occurred:', err.message);
        if (NODE_ENV === 'development') {
            console.error('Stack trace:', err.stack);
        }

        const status = err.status || 500;
        const template = status === 404 ? '404' : '500';
        res.status(status).render(`errors/${template}`, {
            title: status === 404 ? 'Page Not Found' : 'Server Error',
            error: err.message,
            stack: NODE_ENV === 'development' ? err.stack : ''
        });
    });

    return app;
};

export { createApp };
