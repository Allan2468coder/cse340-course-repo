// Import any needed model functions
import { body, validationResult } from 'express-validator';
import {
    getAllCategories,
    getCategoryById,
    getProjectsByCategoryId,
    createCategory,
    updateCategory
} from '../models/categories.js';

const categoryValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Category name is required.')
        .bail()
        .isLength({ min: 3, max: 100 })
        .withMessage('Category name must be between 3 and 100 characters.')
];

const getValidationErrors = (req) => Object.fromEntries(
    Object.entries(validationResult(req).mapped()).map(([field, error]) => [field, error.msg])
);

// Define any controller functions
const showCategoriesPage = async (req, res) => {
    const categories = await getAllCategories();
    const title = 'Service Categories';

    res.render('categories', { title, categories });
};

const showCategoryDetailsPage = async (req, res) => {
    const categoryId = Number(req.params.id);

    if (Number.isNaN(categoryId)) {
        return res.status(404).send('Category not found');
    }

    const category = await getCategoryById(categoryId);

    if (!category) {
        return res.status(404).send('Category not found');
    }

    const projects = await getProjectsByCategoryId(categoryId);
    const title = category.name;

    res.render('category', { title, category, projects });
};

const showNewCategoryPage = (req, res) => {
    res.render('category-form', {
        title: 'Create Category',
        heading: 'Create a Category',
        action: '/new-category',
        category: { name: '' },
        errors: {}
    });
};

const showEditCategoryPage = async (req, res) => {
    const categoryId = Number(req.params.id);
    const category = Number.isInteger(categoryId) && categoryId > 0
        ? await getCategoryById(categoryId)
        : null;

    if (!category) {
        return res.status(404).send('Category not found');
    }

    res.render('category-form', {
        title: 'Edit Category',
        heading: 'Edit Category',
        action: `/edit-category/${categoryId}`,
        category,
        errors: {}
    });
};

const createCategoryAction = async (req, res) => {
    const category = { name: String(req.body.name || '').trim() };
    const errors = getValidationErrors(req);

    if (Object.keys(errors).length > 0) {
        return res.status(400).render('category-form', {
            title: 'Create Category', heading: 'Create a Category',
            action: '/new-category', category, errors
        });
    }

    try {
        await createCategory(category.name);
        req.flash('success', 'Category created successfully.');
        res.redirect('/categories');
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).render('category-form', {
                title: 'Create Category', heading: 'Create a Category',
                action: '/new-category', category,
                errors: { name: 'A category with that name already exists.' }
            });
        }
        throw error;
    }
};

const updateCategoryAction = async (req, res) => {
    const categoryId = Number(req.params.id);
    const category = { name: String(req.body.name || '').trim() };
    const errors = getValidationErrors(req);

    if (!Number.isInteger(categoryId) || categoryId < 1) {
        return res.status(404).send('Category not found');
    }

    if (Object.keys(errors).length > 0) {
        return res.status(400).render('category-form', {
            title: 'Edit Category', heading: 'Edit Category',
            action: `/edit-category/${categoryId}`, category, errors
        });
    }

    try {
        const updatedCategory = await updateCategory(categoryId, category.name);
        if (!updatedCategory) {
            return res.status(404).send('Category not found');
        }
        req.flash('success', 'Category updated successfully.');
        res.redirect(`/category/${categoryId}`);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).render('category-form', {
                title: 'Edit Category', heading: 'Edit Category',
                action: `/edit-category/${categoryId}`, category,
                errors: { name: 'A category with that name already exists.' }
            });
        }
        throw error;
    }
};

// Export any controller functions
export {
    showCategoriesPage,
    showCategoryDetailsPage,
    showNewCategoryPage,
    showEditCategoryPage,
    categoryValidationRules,
    createCategoryAction,
    updateCategoryAction
};
