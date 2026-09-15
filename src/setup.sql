-- Create the organization table
CREATE TABLE organization (
    organization_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    logo_filename VARCHAR(255) NOT NULL
);

-- Insert sample data: Organizations
INSERT INTO organization (name, description, contact_email, logo_filename)
VALUES
    ('BrightFuture Builders', 'A nonprofit focused on improving community infrastructure through sustainable construction projects.', 'info@brightfuturebuilders.org', 'brightfuture-logo.png'),
    ('GreenHarvest Growers', 'An urban farming collective promoting food sustainability and education in local neighborhoods.', 'contact@greenharvest.org', 'greenharvest-logo.png'),
    ('UnityServe Volunteers', 'A volunteer coordination group supporting local charities and service initiatives.', 'hello@unityserve.org', 'unityserve-logo.png');

-- Verify the inserted organizations
SELECT * FROM organization;

-- Create the service project table
CREATE TABLE service_project (
    project_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    project_date DATE NOT NULL,
    organization_id INTEGER NOT NULL,
    CONSTRAINT service_project_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organization (organization_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- Insert five projects for BrightFuture Builders
INSERT INTO service_project
    (title, description, project_date, organization_id)
SELECT project.title, project.description, project.project_date, organization.organization_id
FROM (
    VALUES
        ('Community Center Renovation', 'Renovate a local community center.', DATE '2026-04-04'),
        ('Neighborhood Playground Build', 'Construct a safe playground for neighborhood children.', DATE '2026-04-18'),
        ('Accessible Walkway Installation', 'Install an accessible walkway around a community facility.', DATE '2026-05-02'),
        ('Senior Housing Repairs', 'Repair and improve homes for local seniors.', DATE '2026-05-16'),
        ('Community Garden Structures', 'Build sustainable structures for a community garden.', DATE '2026-06-06')
) AS project(title, description, project_date)
CROSS JOIN organization
WHERE organization.name = 'BrightFuture Builders';

-- Insert five projects for GreenHarvest Growers
INSERT INTO service_project
    (title, description, project_date, organization_id)
SELECT project.title, project.description, project.project_date, organization.organization_id
FROM (
    VALUES
        ('Spring Garden Preparation', 'Prepare planting beds for the spring growing season.', DATE '2026-03-28'),
        ('Urban Farm Volunteer Day', 'Help maintain crops at a local urban farm.', DATE '2026-04-11'),
        ('Community Food Harvest', 'Harvest and package fresh produce for local families.', DATE '2026-05-09'),
        ('Farm Education Workshop', 'Teach families about sustainable food production.', DATE '2026-05-23'),
        ('Fall Garden Cleanup', 'Prepare community gardens for the winter season.', DATE '2026-10-10')
) AS project(title, description, project_date)
CROSS JOIN organization
WHERE organization.name = 'GreenHarvest Growers';

-- Insert five projects for UnityServe Volunteers
INSERT INTO service_project
    (title, description, project_date, organization_id)
SELECT project.title, project.description, project.project_date, organization.organization_id
FROM (
    VALUES
        ('Park Cleanup Day', 'Clean and improve a local public park.', DATE '2026-04-25'),
        ('Community Food Drive', 'Collect and organize food donations for local families.', DATE '2026-05-30'),
        ('Youth Mentoring Event', 'Provide mentoring and educational support to local youth.', DATE '2026-06-13'),
        ('Neighborhood Cleanup', 'Remove litter and improve shared neighborhood spaces.', DATE '2026-07-11'),
        ('Holiday Giving Project', 'Organize donations for families during the holiday season.', DATE '2026-12-05')
) AS project(title, description, project_date)
CROSS JOIN organization
WHERE organization.name = 'UnityServe Volunteers';

-- Verify the inserted service projects and their organizations
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
