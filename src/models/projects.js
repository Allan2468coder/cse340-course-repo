import db from './db.js';

const getAllProjects = async () => {
    const query = `
        SELECT
            service_project.project_id,
            service_project.title,
            service_project.description,
            service_project.project_date,
            organization.name AS organization_name
        FROM service_project
        JOIN organization
            ON service_project.organization_id = organization.organization_id
        ORDER BY service_project.project_date;
    `;

    const result = await db.query(query);

    return result.rows;
};

const getUpcomingProjects = async (numberOfProjects) => {
    const query = `
        SELECT
            service_project.project_id,
            service_project.title,
            service_project.description,
            service_project.project_date AS date,
            NULL::text AS location,
            organization.organization_id,
            organization.name AS organization_name
        FROM service_project
        JOIN organization
            ON service_project.organization_id = organization.organization_id
        WHERE service_project.project_date >= CURRENT_DATE
        ORDER BY service_project.project_date ASC
        LIMIT $1;
    `;

    const result = await db.query(query, [numberOfProjects]);

    return result.rows;
};

const getProjectById = async (projectId) => {
    const query = `
        SELECT
            service_project.project_id,
            service_project.title,
            service_project.description,
            service_project.project_date,
            NULL::text AS location,
            organization.organization_id,
            organization.name AS organization_name
        FROM service_project
        JOIN organization
            ON service_project.organization_id = organization.organization_id
        WHERE service_project.project_id = $1;
    `;

    const result = await db.query(query, [projectId]);

    return result.rows[0] || null;
};

const getProjectDetails = async (id) => {
    const query = `
        SELECT
            service_project.project_id,
            service_project.title,
            service_project.description,
            service_project.project_date AS date,
            NULL::text AS location,
            organization.organization_id,
            organization.name AS organization_name
        FROM service_project
        JOIN organization
            ON service_project.organization_id = organization.organization_id
        WHERE service_project.project_id = $1;
    `;

    const result = await db.query(query, [id]);

    return result.rows[0] || null;
};

const getProjectCategories = async (projectId) => {
    const query = `
        SELECT
            category.category_id,
            category.name
        FROM project_category
        JOIN category
            ON project_category.category_id = category.category_id
        WHERE project_category.project_id = $1
        ORDER BY category.name;
    `;

    const result = await db.query(query, [projectId]);

    return result.rows;
};

const getProjectsByOrganizationId = async (organizationId) => {
    const query = `
        SELECT
            service_project.project_id,
            service_project.title,
            service_project.description,
            service_project.project_date,
            organization.name AS organization_name
        FROM service_project
        JOIN organization
            ON service_project.organization_id = organization.organization_id
        WHERE service_project.organization_id = $1
        ORDER BY service_project.project_date;
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows;
};

export {
    getAllProjects,
    getUpcomingProjects,
    getProjectById,
    getProjectDetails,
    getProjectCategories,
    getProjectsByOrganizationId
};
