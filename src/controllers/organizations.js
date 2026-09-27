// Import any needed model functions
import {
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization
} from '../models/organizations.js';
import { getProjectsByOrganizationId } from '../models/projects.js';

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
        title, heading, action, organization, errors
    });
};

const showNewOrganizationPage = (req, res) => {
    organizationForm(res, {
        title: 'Create Organization', heading: 'Create an Organization',
        action: '/new-organization',
        organization: { name: '', description: '', contact_email: '', logo_filename: '' },
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

const validateOrganization = (organization) => {
    const errors = {};
    if (!organization.name) errors.name = 'Name is required.';
    else if (organization.name.length < 3) errors.name = 'Name must be at least 3 characters.';
    else if (organization.name.length > 150) errors.name = 'Name must be 150 characters or fewer.';
    if (!organization.description) errors.description = 'Description is required.';
    else if (organization.description.length < 3) errors.description = 'Description must be at least 3 characters.';
    if (!organization.contact_email) errors.contact_email = 'Contact email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(organization.contact_email)) {
        errors.contact_email = 'Enter a valid email address.';
    } else if (organization.contact_email.length > 255) {
        errors.contact_email = 'Contact email must be 255 characters or fewer.';
    }
    if (!organization.logo_filename) errors.logo_filename = 'Logo filename is required.';
    else if (organization.logo_filename.length > 255) errors.logo_filename = 'Logo filename must be 255 characters or fewer.';
    return errors;
};

const readOrganizationForm = (body) => ({
    name: String(body.name || '').trim(),
    description: String(body.description || '').trim(),
    contact_email: String(body.contact_email || '').trim(),
    logo_filename: String(body.logo_filename || '').trim()
});

const createOrganizationAction = async (req, res) => {
    const organization = readOrganizationForm(req.body);
    const errors = validateOrganization(organization);
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
    const errors = validateOrganization(organization);
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
    createOrganizationAction,
    updateOrganizationAction
};
