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
import {
	registrationValidationRules,
	loginValidationRules,
	showRegisterPage,
	registerAction,
	showLoginPage,
	loginAction,
	logOut
} from './controllers/auth.js';
import { showDashboard, showUsers } from './controllers/dashboard.js';
import { requireLogin, requireRole } from './middleware/auth.js';

const router = express.Router();

router.get('/', showHomePage);
router.get('/register', showRegisterPage);
router.post('/register', registrationValidationRules, registerAction);
router.get('/login', showLoginPage);
router.post('/login', loginValidationRules, loginAction);
router.get('/logout', logOut);
router.get('/dashboard', requireLogin, showDashboard);
router.get('/users', requireRole('Admin'), showUsers);
router.get('/organizations', showOrganizationsPage);
router.get('/organization/:id', showOrganizationDetailsPage);
router.get('/new-organization', requireRole('Admin'), showNewOrganizationPage);
router.post('/new-organization', requireRole('Admin'), organizationValidationRules, createOrganizationAction);
router.get('/edit-organization/:id', requireRole('Admin'), showEditOrganizationPage);
router.post('/edit-organization/:id', requireRole('Admin'), organizationValidationRules, updateOrganizationAction);
router.get('/projects', showProjectsPage);
router.get('/project/:id', showProjectDetailsPage);
router.get('/new-project', requireRole('Admin'), showNewProjectPage);
router.post('/new-project', requireRole('Admin'), projectValidationRules, createProjectAction);
router.get('/edit-project/:id', requireRole('Admin'), showEditProjectPage);
router.post('/edit-project/:id', requireRole('Admin'), projectValidationRules, updateProjectAction);
router.get('/assign-categories/:id', requireRole('Admin'), showAssignCategoriesPage);
router.post('/assign-categories/:id', requireRole('Admin'), projectCategoryValidationRules, updateProjectCategoriesAction);
router.get('/categories', showCategoriesPage);
router.get('/category/:id', showCategoryDetailsPage);
router.get('/new-category', requireRole('Admin'), showNewCategoryPage);
router.post('/new-category', requireRole('Admin'), categoryValidationRules, createCategoryAction);
router.get('/edit-category/:id', requireRole('Admin'), showEditCategoryPage);
router.post('/edit-category/:id', requireRole('Admin'), categoryValidationRules, updateCategoryAction);

// error-handling routes
router.get('/test-error', testErrorPage);

export default router;
