// Import any needed model functions
import { body, validationResult } from 'express-validator';
import {
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization
} from '../models/organizations.js';
import { getProjectsByOrganizationId } from '../models/projects.js';

const ORGANIZATION_LOGOS = [
    { filename: 'cse340-service-network.png', label: 'Service Network placeholder' },
    { filename: 'brightfuture-logo.png', label: 'BrightFuture Builders' },
    { filename: 'greenharvest-logo.png', label: 'GreenHarvest Growers' },
    { filename: 'unityserve-logo.png', label: 'UnityServe Volunteers' }
];
const DEFAULT_ORGANIZATION_LOGO = ORGANIZATION_LOGOS[0].filename;
const ORGANIZATION_LOGO_FILENAMES = ORGANIZATION_LOGOS.map(logo => logo.filename);

const organizationValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required.')
        .bail()
        .isLength({ min: 3, max: 150 }).withMessage('Name must be between 3 and 150 characters.'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required.')
        .bail()
        .isLength({ min: 3, max: 5000 }).withMessage('Description must be between 3 and 5000 characters.'),
    body('contact_email')
        .trim()
        .notEmpty().withMessage('Contact email is required.')
        .bail()
        .isEmail().withMessage('Enter a valid email address.')
        .bail()
        .isLength({ max: 255 }).withMessage('Contact email must be 255 characters or fewer.'),
    body('logo_filename')
        .customSanitizer(value => value || DEFAULT_ORGANIZATION_LOGO)
        .trim()
        .notEmpty().withMessage('An organization image is required.')
        .bail()
        .isLength({ min: 1, max: 255 }).withMessage('Organization image filename must be 255 characters or fewer.')
        .bail()
        .isIn(ORGANIZATION_LOGO_FILENAMES).withMessage('Choose an available organization image.')
];

const getValidationErrors = (req) => Object.fromEntries(
    Object.entries(validationResult(req).mapped()).map(([field, error]) => [field, error.msg])
);

// Define any controller functions
const showOrganizationsPage = async (req, res) => {
    const organizations = await getAllOrganizations();
    const title = 'Our Partner Organizations';

    res.render('organizations', { title, organizations });
};

const showOrganizationDetailsPage = async (req, res) => {
    const organizationId = Number(req.params.id);

    if (Number.isNaN(organizationId)) {
        return res.status(404).send('Organization not found');
    }

    const organization = await getOrganizationById(organizationId);

    if (!organization) {
        return res.status(404).send('Organization not found');
    }

    const projects = await getProjectsByOrganizationId(organizationId);
    const title = organization.name;

    res.render('organization', { title, organization, projects });
};

const organizationForm = (res, { title, heading, action, organization, errors }, status = 200) => {
    res.status(status).render('organization-form', {
        title, heading, action, organization, errors, organizationLogos: ORGANIZATION_LOGOS
    });
};

const showNewOrganizationPage = (req, res) => {
    organizationForm(res, {
        title: 'Create Organization', heading: 'Create an Organization',
        action: '/new-organization',
        organization: {
            name: '',
            description: '',
            contact_email: '',
            logo_filename: DEFAULT_ORGANIZATION_LOGO
        },
        errors: {}
    });
};

const showEditOrganizationPage = async (req, res) => {
    const organizationId = Number(req.params.id);
    const organization = Number.isInteger(organizationId) && organizationId > 0
        ? await getOrganizationById(organizationId)
        : null;

    if (!organization) return res.status(404).send('Organization not found');

    organizationForm(res, {
        title: 'Edit Organization', heading: 'Edit Organization',
        action: `/edit-organization/${organizationId}`, organization, errors: {}
    });
};

const readOrganizationForm = (body) => ({
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    contact_email: String(body.contact_email || '').trim(),
    logo_filename: String(body.logo_filename || '').trim()
});

const createOrganizationAction = async (req, res) => {
    const organization = readOrganizationForm(req.body);
    const errors = getValidationErrors(req);
    if (Object.keys(errors).length) {
        return organizationForm(res, {
            title: 'Create Organization', heading: 'Create an Organization',
            action: '/new-organization', organization, errors
        }, 400);
    }
    await createOrganization(organization);
    req.flash('success', 'Organization created successfully.');
    res.redirect('/organizations');
};

const updateOrganizationAction = async (req, res) => {
    const organizationId = Number(req.params.id);
    if (!Number.isInteger(organizationId) || organizationId < 1) {
        return res.status(404).send('Organization not found');
    }
    const organization = readOrganizationForm(req.body);
    const errors = getValidationErrors(req);
    if (Object.keys(errors).length) {
        return organizationForm(res, {
            title: 'Edit Organization', heading: 'Edit Organization',
            action: `/edit-organization/${organizationId}`, organization, errors
        }, 400);
    }
    const updated = await updateOrganization(organizationId, organization);
    if (!updated) return res.status(404).send('Organization not found');
    req.flash('success', 'Organization updated successfully.');
    res.redirect(`/organization/${organizationId}`);
};

// Export any controller functions
export {
    showOrganizationsPage,
    showOrganizationDetailsPage,
    showNewOrganizationPage,
    showEditOrganizationPage,
    organizationValidationRules,
    createOrganizationAction,
    updateOrganizationAction
};
