-- Create or complete the CSE 340 service-project schema and seed data.
-- Safe to run against a fresh database or an existing installation: this
-- script does not drop tables or delete user data, and seed inserts are
-- skipped when their matching records already exist.

BEGIN;

-- Accounts are also ensured by the application at startup. Keeping this
-- definition here makes the database setup complete when run independently.
CREATE TABLE IF NOT EXISTS public.account (
    account_id SERIAL PRIMARY KEY,
    account_firstname VARCHAR(50) NOT NULL,
    account_lastname VARCHAR(50) NOT NULL,
    account_email VARCHAR(255) NOT NULL UNIQUE,
    account_password TEXT NOT NULL,
    account_type VARCHAR(20) NOT NULL DEFAULT 'Client'
        CHECK (account_type IN ('Client', 'Admin'))
);

CREATE TABLE IF NOT EXISTS public.organization (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    logo_filename VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.service_project (
    project_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    project_date DATE NOT NULL,
    organization_id INTEGER NOT NULL,
    CONSTRAINT service_project_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES public.organization (organization_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS public.category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Many-to-many relationship between service projects and categories.
CREATE TABLE IF NOT EXISTS public.project_category (
    project_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (project_id, category_id),
    CONSTRAINT project_category_project_fk
        FOREIGN KEY (project_id)
        REFERENCES public.service_project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT project_category_category_fk
        FOREIGN KEY (category_id)
        REFERENCES public.category (category_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Many-to-many relationship between accounts and projects. The composite
-- primary key prevents duplicate signups by the same account for one project.
CREATE TABLE IF NOT EXISTS public.project_volunteer (
    account_id INTEGER NOT NULL,
    project_id INTEGER NOT NULL,
    signup_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (account_id, project_id),
    CONSTRAINT project_volunteer_account_fk
        FOREIGN KEY (account_id)
        REFERENCES public.account (account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT project_volunteer_project_fk
        FOREIGN KEY (project_id)
        REFERENCES public.service_project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- The primary key supports lookups by account. This index supports lookups
-- and removals by project as well.
CREATE INDEX IF NOT EXISTS project_volunteer_project_id_idx
    ON public.project_volunteer (project_id);

-- Seed the sample organizations without overwriting existing organization data.
INSERT INTO public.organization (name, description, contact_email, logo_filename)
SELECT seed.name, seed.description, seed.contact_email, seed.logo_filename
FROM (VALUES
    ('BrightFuture Builders', 'A nonprofit focused on improving community infrastructure through sustainable construction projects.', 'info@brightfuturebuilders.org', 'brightfuture-logo.png'),
    ('GreenHarvest Growers', 'An urban farming collective promoting food sustainability and education in local neighborhoods.', 'contact@greenharvest.org', 'greenharvest-logo.png'),
    ('UnityServe Volunteers', 'A volunteer coordination group supporting local charities and service initiatives.', 'hello@unityserve.org', 'unityserve-logo.png')
) AS seed(name, description, contact_email, logo_filename)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.organization AS existing
    WHERE existing.name = seed.name
);

-- Seed sample service projects. Match on title and organization so rerunning
-- setup does not duplicate a project, and use one organization ID per name.
WITH project_seed (title, description, project_date, organization_name) AS (
    VALUES
        ('Community Center Renovation', 'Renovate a local community center.', DATE '2026-04-04', 'BrightFuture Builders'),
        ('Neighborhood Playground Build', 'Construct a safe playground for neighborhood children.', DATE '2026-04-18', 'BrightFuture Builders'),
        ('Accessible Walkway Installation', 'Install an accessible walkway around a community facility.', DATE '2026-05-02', 'BrightFuture Builders'),
        ('Senior Housing Repairs', 'Repair and improve homes for local seniors.', DATE '2026-05-16', 'BrightFuture Builders'),
        ('Community Garden Structures', 'Build sustainable structures for a community garden.', DATE '2026-06-06', 'BrightFuture Builders'),
        ('Spring Garden Preparation', 'Prepare planting beds for the spring growing season.', DATE '2026-03-28', 'GreenHarvest Growers'),
        ('Urban Farm Volunteer Day', 'Help maintain crops at a local urban farm.', DATE '2026-04-11', 'GreenHarvest Growers'),
        ('Community Food Harvest', 'Harvest and package fresh produce for local families.', DATE '2026-05-09', 'GreenHarvest Growers'),
        ('Farm Education Workshop', 'Teach families about sustainable food production.', DATE '2026-05-23', 'GreenHarvest Growers'),
        ('Fall Garden Cleanup', 'Prepare community gardens for the winter season.', DATE '2026-10-10', 'GreenHarvest Growers'),
        ('Park Cleanup Day', 'Clean and improve a local public park.', DATE '2026-04-25', 'UnityServe Volunteers'),
        ('Community Food Drive', 'Collect and organize food donations for local families.', DATE '2026-05-30', 'UnityServe Volunteers'),
        ('Youth Mentoring Event', 'Provide mentoring and educational support to local youth.', DATE '2026-06-13', 'UnityServe Volunteers'),
        ('Neighborhood Cleanup', 'Remove litter and improve shared neighborhood spaces.', DATE '2026-07-11', 'UnityServe Volunteers'),
        ('Holiday Giving Project', 'Organize donations for families during the holiday season.', DATE '2026-12-05', 'UnityServe Volunteers')
)
INSERT INTO public.service_project (title, description, project_date, organization_id)
SELECT seed.title, seed.description, seed.project_date, organization.organization_id
FROM project_seed AS seed
CROSS JOIN LATERAL (
    SELECT existing.organization_id
    FROM public.organization AS existing
    WHERE existing.name = seed.organization_name
    ORDER BY existing.organization_id
    LIMIT 1
) AS organization
WHERE NOT EXISTS (
    SELECT 1
    FROM public.service_project AS existing
    WHERE existing.title = seed.title
        AND existing.organization_id = organization.organization_id
);

-- Seed the categories without duplicating existing records.
INSERT INTO public.category (name)
SELECT seed.name
FROM (VALUES
    ('Community Development'),
    ('Environmental Stewardship'),
    ('Education and Mentoring'),
    ('Food Security')
) AS seed(name)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.category AS existing
    WHERE existing.name = seed.name
);

-- Seed project/category assignments. ON CONFLICT also makes this safe when
-- some assignments already exist.
WITH assignment_seed (project_title, category_name) AS (
    VALUES
        ('Community Center Renovation', 'Community Development'),
        ('Neighborhood Playground Build', 'Community Development'),
        ('Accessible Walkway Installation', 'Community Development'),
        ('Senior Housing Repairs', 'Community Development'),
        ('Community Garden Structures', 'Community Development'),
        ('Park Cleanup Day', 'Community Development'),
        ('Neighborhood Cleanup', 'Community Development'),
        ('Holiday Giving Project', 'Community Development'),
        ('Accessible Walkway Installation', 'Environmental Stewardship'),
        ('Community Garden Structures', 'Environmental Stewardship'),
        ('Spring Garden Preparation', 'Environmental Stewardship'),
        ('Urban Farm Volunteer Day', 'Environmental Stewardship'),
        ('Community Food Harvest', 'Environmental Stewardship'),
        ('Fall Garden Cleanup', 'Environmental Stewardship'),
        ('Park Cleanup Day', 'Environmental Stewardship'),
        ('Neighborhood Cleanup', 'Environmental Stewardship'),
        ('Farm Education Workshop', 'Education and Mentoring'),
        ('Youth Mentoring Event', 'Education and Mentoring'),
        ('Community Food Harvest', 'Food Security'),
        ('Community Food Drive', 'Food Security'),
        ('Holiday Giving Project', 'Food Security')
)
INSERT INTO public.project_category (project_id, category_id)
SELECT project.project_id, category.category_id
FROM assignment_seed AS seed
JOIN public.service_project AS project
    ON project.title = seed.project_title
JOIN public.category AS category
    ON category.name = seed.category_name
ON CONFLICT (project_id, category_id) DO NOTHING;

COMMIT;
