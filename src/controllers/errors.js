// Import any needed model functions (none are needed for the error pages, so this is empty)

// Define any controller functions
const testErrorPage = (req, res, next) => {
    const err = new Error('This is a test error');
    err.status = 500;
    next(err);
};

// Export any controller functions
export { testErrorPage };
