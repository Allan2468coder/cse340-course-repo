import { getAllAccounts } from '../models/accounts.js';
import { getVolunteerProjects } from '../models/projects.js';

const showDashboard = async (req, res) => {
    const volunteerProjects = await getVolunteerProjects(req.session.account.account_id);
    res.render('dashboard', {
        title: 'Dashboard', account: req.session.account, volunteerProjects
    });
};

const showUsers = async (req, res) => {
    const users = await getAllAccounts();
    res.render('users', { title: 'Registered Users', users });
};

export { showDashboard, showUsers };
