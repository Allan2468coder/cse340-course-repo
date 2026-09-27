import db from './db.js';

const getAllOrganizations = async () => {
    const query = `
        SELECT organization_id, name, description, contact_email, logo_filename
        FROM public.organization
        ORDER BY name;
    `;

    const result = await db.query(query);

    return result.rows;
};

const getOrganizationById = async (organizationId) => {
    const query = `
        SELECT organization_id, name, description, contact_email, logo_filename
        FROM public.organization
        WHERE organization_id = $1;
    `;

    const result = await db.query(query, [organizationId]);

    return result.rows[0] || null;
};

const createOrganization = async ({ name, description, contact_email, logo_filename }) => {
    const query = `
        INSERT INTO public.organization (name, description, contact_email, logo_filename)
        VALUES ($1, $2, $3, $4)
        RETURNING organization_id, name, description, contact_email, logo_filename;
    `;

    const result = await db.query(query, [name, description, contact_email, logo_filename]);

    return result.rows[0];
};

const updateOrganization = async (organizationId, { name, description, contact_email, logo_filename }) => {
    const query = `
        UPDATE public.organization
        SET name = $2, description = $3, contact_email = $4, logo_filename = $5
        WHERE organization_id = $1
        RETURNING organization_id, name, description, contact_email, logo_filename;
    `;

    const result = await db.query(query, [organizationId, name, description, contact_email, logo_filename]);

    return result.rows[0] || null;
};

export { getAllOrganizations, getOrganizationById, createOrganization, updateOrganization };
