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

const createProject = async ({ title, description, project_date, organization_id }) => {
    const query = `
        INSERT INTO service_project (title, description, project_date, organization_id)
        VALUES ($1, $2, $3, $4)
        RETURNING project_id, title, description, project_date, organization_id;
    `;

    const result = await db.query(query, [title, description, project_date, organization_id]);

    return result.rows[0];
};

const updateProject = async (projectId, { title, description, project_date, organization_id }) => {
    const query = `
        UPDATE service_project
        SET title = $2, description = $3, project_date = $4, organization_id = $5
        WHERE project_id = $1
        RETURNING project_id, title, description, project_date, organization_id;
    `;

    const result = await db.query(query, [projectId, title, description, project_date, organization_id]);

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

const updateProjectCategories = async (projectId, categoryIds) => {
    const query = `
        WITH requested AS (
            SELECT DISTINCT unnest($2::integer[]) AS category_id
        ), removed AS (
            DELETE FROM project_category
            WHERE project_id = $1
                AND category_id NOT IN (SELECT category_id FROM requested)
        ), added AS (
            INSERT INTO project_category (project_id, category_id)
            SELECT $1, requested.category_id
            FROM requested
            ON CONFLICT (project_id, category_id) DO NOTHING
            RETURNING category_id
        )
        SELECT category_id FROM requested;
    `;

    await db.query(query, [projectId, categoryIds]);
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
    createProject,
    updateProject,
    getProjectDetails,
    getProjectCategories,
    updateProjectCategories,
    getProjectsByOrganizationId
};
