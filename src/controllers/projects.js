// Import any needed model functions
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

const validateProject = async (project) => {
    const errors = {};
    if (!project.title) errors.title = 'Title is required.';
    else if (project.title.length < 3) errors.title = 'Title must be at least 3 characters.';
    else if (project.title.length > 150) errors.title = 'Title must be 150 characters or fewer.';
    if (!project.description) errors.description = 'Description is required.';
    else if (project.description.length < 3) errors.description = 'Description must be at least 3 characters.';
    const parsedDate = new Date(`${project.project_date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(project.project_date)
        || Number.isNaN(parsedDate.getTime())
        || parsedDate.toISOString().slice(0, 10) !== project.project_date) {
        errors.project_date = 'Enter a valid project date.';
    }
    if (!Number.isInteger(project.organization_id) || project.organization_id < 1
        || !await getOrganizationById(project.organization_id)) {
        errors.organization_id = 'Select an organization.';
    }
    return errors;
};

const createProjectAction = async (req, res) => {
    const project = readProjectForm(req.body);
    const errors = await validateProject(project);
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
    const errors = await validateProject(project);
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
    const hasInvalidId = parsedIds.some(id => !Number.isInteger(id) || !availableIds.has(id));

    if (hasInvalidId) {
        return renderProjectCategoriesPage(
            res,
            project,
            selectedCategoryIds.filter(id => availableIds.has(id)),
            { categoryIds: 'Select categories from the list.' },
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
    createProjectAction,
    updateProjectAction,
    showAssignCategoriesPage,
    updateProjectCategoriesAction
};
