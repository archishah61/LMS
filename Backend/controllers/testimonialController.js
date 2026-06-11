const CompanyLogo = require('../models/testimonials/CompanyLogo');
const Testimonial = require('../models/testimonials/Testimonial');
const { Op } = require('sequelize');
const { callProcedure } = require('../utils/procedure/callProcedure');

// --- Company Logo Controllers ---

exports.createCompanyLogo = async (req, res, next) => {
    try {
        const { name, status, created_by } = req.body;
        let logo_url = req.body.logo_url;

        // Handle file upload
        if (req.files && req.files['companyLogo']) {
            const file = req.files['companyLogo'][0];
            logo_url = `/testimonials/logos/${file.filename}`;
        }

        const { success, data, error } = await callProcedure("createCompanyLogo", [
            name, logo_url, status || 'active', created_by || null
        ]);

        if (!success) {
            return next(error);
        }

        res.status(201).json({
            success: true,
            message: "Company logo created successfully",
            data: data[0],
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllCompanyLogos = async (req, res, next) => {
    try {
        const { success, data, error } = await callProcedure("getAllCompanyLogos", []);

        if (!success) {
            return next(error);
        }

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.updateCompanyLogo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, status, updated_by } = req.body;
        let logo_url = req.body.logo_url;

        // Handle file upload
        if (req.files && req.files['companyLogo']) {
            const file = req.files['companyLogo'][0];
            logo_url = `/testimonials/logos/${file.filename}`;
        }

        const { success, data, error } = await callProcedure("updateCompanyLogo", [
            id, name || null, logo_url || null, status || null, updated_by || null
        ]);

        if (!success) {
            return next(error);
        }

        if (!data[0]) {
            return res.status(404).json({ success: false, message: "Company logo not found" });
        }

        res.status(200).json({
            success: true,
            message: "Company logo updated successfully",
            data: data[0],
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteCompanyLogo = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { success, data, error } = await callProcedure("deleteCompanyLogo", [id]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: "Company logo deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// --- Testimonial Controllers ---
exports.createTestimonial = async (req, res, next) => {
    try {
        const { author_name, author_role, testimonial_text, rating, company_id, status, created_by } = req.body;
        let author_image = req.body.author_image;

        // Handle file upload
        if (req.files && req.files['authorImage']) {
            const file = req.files['authorImage'][0];
            author_image = `/testimonials/authors/${file.filename}`;
        }

        const { success, data, error } = await callProcedure("createTestimonial", [
            author_name, author_image, author_role, testimonial_text,
            rating, company_id || null, status || 'active', created_by || null
        ]);

        if (!success) {
            return next(error);
        }

        res.status(201).json({
            success: true,
            message: "Testimonial created successfully",
            data: data[0],
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllTestimonials = async (req, res, next) => {
    try {
        const { status = '' } = req.query;

        const { success, data, error } = await callProcedure("getAllTestimonials", [status || null]);

        if (!success) {
            return next(error);
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.updateTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { author_name, author_role, testimonial_text, rating, company_id, status, updated_by } = req.body;
        let author_image = req.body.author_image;

        // Handle file upload
        if (req.files && req.files['authorImage']) {
            const file = req.files['authorImage'][0];
            author_image = `/testimonials/authors/${file.filename}`;
        }

        const { success, data, error } = await callProcedure("updateTestimonial", [
            id, author_name || null, author_image || null, author_role || null,
            testimonial_text || null, rating || null, company_id || null,
            status || null, updated_by || null
        ]);

        if (!success) {
            return next(error);
        }

        if (!data[0]) {
            return res.status(404).json({ success: false, message: "Testimonial not found" });
        }

        res.status(200).json({
            success: true,
            message: "Testimonial updated successfully",
            data: data[0],
        });
    } catch (error) {
        next(error);
    }
};

// Delete Testimonial
exports.deleteTestimonial = async (req, res, next) => {
    try {
        const { id } = req.params;

        const { success, data, error } = await callProcedure("deleteTestimonial", [id]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({
            success: true,
            message: "Testimonial deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
