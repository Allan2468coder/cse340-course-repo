// Import any needed model functions
import { getUpcomingProjects, getProjectDetails, getProjectCategories } from '../models/projects.js';

const NUMBER_OF_UPCOMING_PROJECTS = 5;

// Define any controller functions
const showProjectsPage = async (req, res) => {
    const projects = await getUpcomingProjects(NUMBER_OF_UPCOMING_PROJECTS);
    const title = 'Upcoming Service Projects';

    res.render('projects', { title, projects });
};

const showProjectDetailsPage = async (req, res) => {
    const projectId = Number(req.params.id);

    if (Number.isNaN(projectId)) {
        return res.status(404).send('Project not found');
    }

    const project = await getProjectDetails(projectId);

    if (!project) {
        return res.status(404).send('Project not found');
    }

    const categories = await getProjectCategories(projectId);
    const title = project.title;
    res.render('project', { title, project, categories });
};

// Export any controller functions
export { showProjectsPage, showProjectDetailsPage };
