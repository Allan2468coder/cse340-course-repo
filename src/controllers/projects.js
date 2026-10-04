// Import any needed model functions
import { body, validationResult } from 'express-validator';
import {
    getUpcomingProjects,
    getProjectDetails,
    getProjectCategories,
    getProjectById,
    createProject,
    updateProject,
    updateProjectCategories
} from '../models/projects.js';
import { getAllOrganizations, getOrganizationById } from '../models/organizations.js';
import { getAllCategories } from '../models/categories.js';

const projectValidationRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required.')
        .bail()
        .isLength({ min: 3, max: 150 }).withMessage('Title must be between 3 and 150 characters.'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required.')
        .bail()
        .isLength({ min: 3, max: 5000 }).withMessage('Description must be between 3 and 5000 characters.'),
    body('project_date')
        .trim()
        .notEmpty().withMessage('Project date is required.')
        .bail()
        .isLength({ min: 10, max: 10 }).withMessage('Enter a date in YYYY-MM-DD format.')
        .bail()
        .isISO8601({ strict: true }).withMessage('Enter a valid project date.'),
    body('organization_id')
        .trim()
        .notEmpty().withMessage('Organization is required.')
        .bail()
        .isLength({ min: 1, max: 10 }).withMessage('Select a valid organization.')
        .bail()
        .isInt({ min: 1 }).withMessage('Select a valid organization.')
        .bail()
        .custom(async value => {
            if (!await getOrganizationById(Number(value))) {
                throw new Error('Select an existing organization.');
            }
            return true;
        })
];

const projectCategoryValidationRules = [
    body('categoryIds')
        .optional()
        .custom(value => (Array.isArray(value) ? value : [value])
            .every(id => typeof id === 'string' && /^\d+$/.test(id)))
        .withMessage('Category IDs must be valid integers.')
];

const getValidationErrors = (req) => Object.fromEntries(
    Object.entries(validationResult(req).mapped()).map(([field, error]) => [field, error.msg])
);

const NUMBER_OF_UPCOMING_PROJECTS = 5;

// Define any controller functions
const showProjectsPage = async (req, res) => {
    const projects = await getUpcomingProjects(NUMBER_OF_UPCOMING_PROJECTS);
    const title = 'Upcoming Service Projects';

    res.render('projects', { title, projects });
};

const showProjectDetailsPage = async (req, res) => {
    const projectId = Number(req.params.id);

    if (Number.isNaN(projectId)) {
        return res.status(404).send('Project not found');
    }

    const project = await getProjectDetails(projectId);

    if (!project) {
        return res.status(404).send('Project not found');
    }

    const categories = await getProjectCategories(projectId);
    const title = project.title;
    res.render('project', { title, project, categories });
};

const projectForm = async (res, { title, heading, action, project, errors }, status = 200) => {
    const organizations = await getAllOrganizations();
    return res.status(status).render('project-form', {
        title, heading, action, project, organizations, errors
    });
};

const showNewProjectPage = (req, res) => projectForm(res, {
    title: 'Create Service Project', heading: 'Create a Service Project',
    action: '/new-project',
    project: { title: '', description: '', project_date: '', organization_id: '' },
    errors: {}
});

const showEditProjectPage = async (req, res) => {
    const projectId = Number(req.params.id);
    const project = Number.isInteger(projectId) && projectId > 0
        ? await getProjectById(projectId)
        : null;
    if (!project) return res.status(404).send('Project not found');
    return projectForm(res, {
        title: 'Edit Service Project', heading: 'Edit Service Project',
        action: `/edit-project/${projectId}`,
        project: { ...project, project_date: new Date(project.project_date).toISOString().slice(0, 10) },
        errors: {}
    });
};

const readProjectForm = (body) => ({
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    project_date: String(body.project_date || '').trim(),
    organization_id: Number(body.organization_id)
});

const createProjectAction = async (req, res) => {
    const project = readProjectForm(req.body);
    const errors = getValidationErrors(req);
    if (Object.keys(errors).length) {
        return projectForm(res, {
            title: 'Create Service Project', heading: 'Create a Service Project',
            action: '/new-project', project, errors
        }, 400);
    }
    await createProject(project);
    req.flash('success', 'Service project created successfully.');
    res.redirect('/projects');
};

const updateProjectAction = async (req, res) => {
    const projectId = Number(req.params.id);
    if (!Number.isInteger(projectId) || projectId < 1) {
        return res.status(404).send('Project not found');
    }
    const project = readProjectForm(req.body);
    const errors = getValidationErrors(req);
    if (Object.keys(errors).length) {
        return projectForm(res, {
            title: 'Edit Service Project', heading: 'Edit Service Project',
            action: `/edit-project/${projectId}`, project, errors
        }, 400);
    }
    const updated = await updateProject(projectId, project);
    if (!updated) return res.status(404).send('Project not found');
    req.flash('success', 'Service project updated successfully.');
    res.redirect(`/project/${projectId}`);
};

const renderProjectCategoriesPage = async (res, project, selectedCategoryIds, errors = {}, status = 200) => {
    const categories = await getAllCategories();
    return res.status(status).render('assign-categories', {
        title: 'Assign Project Categories', project, categories, selectedCategoryIds, errors
    });
};

const showAssignCategoriesPage = async (req, res) => {
    const projectId = Number(req.params.id);
    const project = Number.isInteger(projectId) && projectId > 0
        ? await getProjectById(projectId)
        : null;
    if (!project) return res.status(404).send('Project not found');

    const assignedCategories = await getProjectCategories(projectId);
    return renderProjectCategoriesPage(
        res,
        project,
        assignedCategories.map(category => category.category_id)
    );
};

const updateProjectCategoriesAction = async (req, res) => {
    const projectId = Number(req.params.id);
    const project = Number.isInteger(projectId) && projectId > 0
        ? await getProjectById(projectId)
        : null;
    if (!project) return res.status(404).send('Project not found');

    const submittedIds = req.body.categoryIds === undefined
        ? []
        : Array.isArray(req.body.categoryIds) ? req.body.categoryIds : [req.body.categoryIds];
    const parsedIds = submittedIds.map(Number);
    const categories = await getAllCategories();
    const availableIds = new Set(categories.map(category => category.category_id));
    const selectedCategoryIds = [...new Set(parsedIds)];
    const errors = getValidationErrors(req);
    const hasInvalidId = Boolean(errors.categoryIds)
        || parsedIds.some(id => !Number.isInteger(id) || !availableIds.has(id));

    if (hasInvalidId) {
        return renderProjectCategoriesPage(
            res,
            project,
            selectedCategoryIds.filter(id => availableIds.has(id)),
            { categoryIds: errors.categoryIds || 'Select categories from the list.' },
            400
        );
    }

    await updateProjectCategories(projectId, selectedCategoryIds);
    req.flash('success', 'Project categories updated successfully.');
    res.redirect(`/project/${projectId}`);
};

// Export any controller functions
export {
    showProjectsPage,
    showProjectDetailsPage,
    showNewProjectPage,
    showEditProjectPage,
    projectValidationRules,
    projectCategoryValidationRules,
    createProjectAction,
    updateProjectAction,
    showAssignCategoriesPage,
    updateProjectCategoriesAction
};
