const requireLogin = (req, res, next) => {
    if (req.session?.account) return next();
    req.flash('error', 'Please log in to view that page.');
    return res.redirect('/login');
};

const requireRole = (role) => (req, res, next) => {
    if (!req.session?.account) {
        req.flash('error', 'Please log in to view that page.');
        return res.redirect('/login');
    }
    if (req.session.account.account_type !== role) {
        req.flash('error', 'You do not have permission to view that page.');
        return res.redirect('/dashboard');
    }
    return next();
};

export { requireLogin, requireRole };
