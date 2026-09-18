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

const getProjectById = async (projectId) => {
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
        WHERE service_project.project_id = $1;
    `;

    const result = await db.query(query, [projectId]);

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

export { getAllProjects, getProjectById, getProjectCategories };
