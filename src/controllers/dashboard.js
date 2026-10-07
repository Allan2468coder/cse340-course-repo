import { getAllAccounts } from '../models/accounts.js';

const showDashboard = (req, res) => res.render('dashboard', {
    title: 'Dashboard', account: req.session.account
});

const showUsers = async (req, res) => {
    const users = await getAllAccounts();
    res.render('users', { title: 'Registered Users', users });
};

export { showDashboard, showUsers };
