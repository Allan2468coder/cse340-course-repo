// Import any needed model functions
import { getAllOrganizations, getOrganizationById } from '../models/organizations.js';
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

// Export any controller functions
export { showOrganizationsPage, showOrganizationDetailsPage };
