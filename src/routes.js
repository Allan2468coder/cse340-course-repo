import express from 'express';

import { showHomePage } from './controllers/index.js';
import {
	showOrganizationsPage,
	showOrganizationDetailsPage,
	showNewOrganizationPage,
	showEditOrganizationPage,
	organizationValidationRules,
	createOrganizationAction,
	updateOrganizationAction
} from './controllers/organizations.js';
import {
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
} from './controllers/projects.js';
import {
	showCategoriesPage,
	showCategoryDetailsPage,
	showNewCategoryPage,
	showEditCategoryPage,
	categoryValidationRules,
	createCategoryAction,
	updateCategoryAction
} from './controllers/categories.js';
import { testErrorPage } from './controllers/errors.js';

const router = express.Router();

router.get('/', showHomePage);
router.get('/organizations', showOrganizationsPage);
router.get('/organization/:id', showOrganizationDetailsPage);
router.get('/new-organization', showNewOrganizationPage);
router.post('/new-organization', organizationValidationRules, createOrganizationAction);
router.get('/edit-organization/:id', showEditOrganizationPage);
router.post('/edit-organization/:id', organizationValidationRules, updateOrganizationAction);
router.get('/projects', showProjectsPage);
router.get('/project/:id', showProjectDetailsPage);
router.get('/new-project', showNewProjectPage);
router.post('/new-project', projectValidationRules, createProjectAction);
router.get('/edit-project/:id', showEditProjectPage);
router.post('/edit-project/:id', projectValidationRules, updateProjectAction);
router.get('/assign-categories/:id', showAssignCategoriesPage);
router.post('/assign-categories/:id', projectCategoryValidationRules, updateProjectCategoriesAction);
router.get('/categories', showCategoriesPage);
router.get('/category/:id', showCategoryDetailsPage);
router.get('/new-category', showNewCategoryPage);
router.post('/new-category', categoryValidationRules, createCategoryAction);
router.get('/edit-category/:id', showEditCategoryPage);
router.post('/edit-category/:id', categoryValidationRules, updateCategoryAction);

// error-handling routes
router.get('/test-error', testErrorPage);

export default router;
