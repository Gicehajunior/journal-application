const Exception = require('@config/exception');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Journal = require('@models/Journal');
const Util = require('@utils/Util');
const UserUtil = require('@utils/UserUtil'); 
const JournalUtil = require('@utils/JournalUtil'); 
const utils = require('@config/utils'); 
const validator = require('validator');
const path = require('path');
const fs = require('fs');

class JournalController {
    constructor() {
        // 
    }

    static async index(req, res) { 
        try {
            let { start_date, end_date, email } = req.query;
    
            if (!start_date || !end_date || !email) {
                throw new Exception(400, "VALIDATION_ERROR", "Missing required fields", {
                    start_date: !start_date ? "start_date is required" : null,
                    end_date: !end_date ? "end_date is required" : null,
                    email: !email ? "email is required" : null
                });
            }
    
            let user = await UserUtil.getUserByEmail(email, true);  
            if (!user) {
                throw new Exception(400, "USER_NOT_FOUND_ERROR", "User not found", "Email invalid or does not exist");
            }
    
            let journals = await JournalUtil.getAllJournals({
                user_id: user.id,
                start_date, 
                end_date
            });
    
            journals = journals.map(row => ({  
                ...row, 
                description_closed: (() => {
                    const maxLength = 80;
                    const cleanDescription = row.description.replace(/<[^>]*>/g, "");
                    return `<p class="w-100">${cleanDescription.length > maxLength 
                        ? cleanDescription.substring(0, maxLength) + "..." 
                        : cleanDescription}</p>`;
                })(),
                title: utils.ucwords(row.title),
                category_name: row.category?.category_name ?? 'N/A',
                created_at: row.created_at 
                    ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) 
                    : '',
                updated_at: row.updated_at 
                    ? new Date(row.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) 
                    : '',
            }));  
    
            return res.status(200).json({ success: true, data: journals });
    
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: error.message || "Gateway error", 
                    reason: error.reason || "Internal server error"
                }
            });
        }
    }
    
    static async createJournal(req, res) {
        try { 
            let { email, title, date, category_id, description } = req.body;
    
            const missingFields = [];
            if (!email) missingFields.push("email");
            if (!title) missingFields.push("title");
            if (!date) missingFields.push("date");
            if (!category_id) missingFields.push("category_id");
            if (!description) missingFields.push("description");
    
            if (missingFields.length > 0) {
                throw new Exception(400, "VALIDATION_ERROR", "Missing required fields.", missingFields);
            }
    
            // Sanitize inputs
            email = validator.escape(validator.trim(email));
            title = validator.escape(validator.trim(title));
            date = validator.escape(validator.trim(date));
            category_id = validator.escape(validator.trim(category_id));
            description = validator.escape(validator.trim(description));
    
            if (!validator.isEmail(email)) {
                throw new Exception(400, "INVALID_EMAIL", "Invalid email format.");
            }
    
            let user = await UserUtil.getUserByEmail(email, true);
    
            if (!user) {
                throw new Exception(400, "USER_NOT_FOUND_ERROR", "User not found", "Email invalid or unexists");
            }
    
            // Initialize attachments
            let attachments = {};
            if (req.files && req.files.length > 0) {
                const uploadDir = path.join(config.PATHS.PUBLIC, `/store/uploads/${email}`);
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
    
                req.files.forEach(file => {
                    const filePath = path.join(uploadDir, file.filename);
                    try {
                        if (file.buffer) {
                            fs.writeFileSync(filePath, file.buffer);
                        } else if (file.path) {
                            fs.copyFileSync(file.path, filePath);
                        }
                        attachments[file.filename] = `/store/uploads/${email}/${file.filename}`;
                    } catch (err) {
                        console.error(`Error saving file ${file.filename}:`, err);
                    }
                });
            }
    
            // Prepare journal data
            const journalData = {
                user_id: user.id,
                title,
                date,
                category_id,
                description,
                status: "draft",
                attachments: JSON.stringify(attachments),
            };  
    
            // Save journal
            const save = await JournalUtil.createJournalFunc(journalData);
    
            if (!save) {
                // Cleanup files if journal creation fails
                Object.values(attachments).forEach(filePath => {
                    const fullPath = path.join(config.PATHS.PUBLIC, filePath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlink(fullPath, err => {
                            if (err) console.error(`Error deleting file: ${fullPath}`, err);
                        });
                    }
                });
    
                throw new Exception(500, "JOURNAL_CREATION_FAILED", "Failed to create journal. Please try again.");
            }
    
            // Success response
            return res.status(200).json({
                success: true,
                message: "Journal created successfully!",
                data: save
            });
    
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: error.message || "Gateway error", 
                    reason: error.reason || "Internal server error"
                }
            });
        }
    }
    
    static async editJournal(req, res) {
        try {
            let { journal_id, email, title, date, category_id, description, rmPreviousAddedAttachments } = req.body;
            
            if (!journal_id) {
                throw new Exception(400, "MISSING_JOURNAL_ID", "Journal ID is required.");
            }
    
            let journal = await JournalUtil.getJournalDetailsById(journal_id);
            if (!journal) {
                throw new Exception(404, "JOURNAL_NOT_FOUND", "Journal not found.");
            }
    
            const missingFields = [];
            if (!title) missingFields.push("title");
            if (!date) missingFields.push("date");
            if (!category_id) missingFields.push("category_id");
            if (!description) missingFields.push("description");
    
            if (missingFields.length > 0) {
                throw new Exception(400, "VALIDATION_ERROR", "Missing required fields.", missingFields);
            }
            
            let user = await UserUtil.getUserByEmail(email, true);
    
            if (!user) {
                throw new Exception(400, "USER_NOT_FOUND_ERROR", "User not found", "Email invalid or unexists");
            }

            req.body.user_id = user.id;
    
            // Sanitize inputs
            title = validator.escape(validator.trim(title));
            date = validator.escape(validator.trim(date));
            category_id = validator.escape(validator.trim(category_id));
            description = validator.escape(validator.trim(description));
            
            // Initialize attachments
            let attachments = {};
    
            if (!rmPreviousAddedAttachments && journal.attachments) {
                attachments = JSON.parse(journal.attachments);
            }
    
            if (req.files && req.files.length > 0) {
                const uploadDir = path.join(config.PATHS.PUBLIC, `/store/uploads/${user_id}`);
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
    
                req.files.forEach(file => {
                    const filePath = path.join(uploadDir, file.filename);
                    try {
                        if (file.buffer) {
                            fs.writeFileSync(filePath, file.buffer);
                        } else if (file.path) {
                            fs.copyFileSync(file.path, filePath);
                        }
                        attachments[file.filename] = `/store/uploads/${user_id}/${file.filename}`;
                    } catch (err) {
                        console.error(`Error saving file ${file.filename}:`, err);
                    }
                });
            }
    
            // Prepare journal update data
            const journalData = {
                journal_id,
                user_id,
                title,
                date,
                category_id,
                description,
                status: "draft",
                attachments: JSON.stringify(attachments),
            };
    
            // Update journal
            const save = await JournalUtil.editJournalFunc(journalData);
    
            if (!save) {
                // Cleanup new attachments if update fails
                Object.values(attachments).forEach(filePath => {
                    const fullPath = path.join(config.PATHS.PUBLIC, filePath);
                    if (fs.existsSync(fullPath)) {
                        fs.unlink(fullPath, err => {
                            if (err) console.error(`Error deleting file: ${fullPath}`, err);
                        });
                    }
                });
    
                throw new Exception(500, "JOURNAL_UPDATE_FAILED", "Failed to update journal. Please try again.");
            }
    
            return res.status(200).json({
                success: true,
                message: "Journal updated successfully!",
                redirectUrl: stayHere ? null : '/journal/list',
                data: save
            });
    
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: error.message || "Gateway error", 
                    reason: error.reason || "Internal server error"
                }
            });
        }
    }
    

    static async trashJournal(req, res) {
        try { 
            const { id } = req.body;
    
            if (!id) {
                throw new Exception(400, "MISSING_JOURNAL_ID", "Journal ID is required.");
            }
    
            const journal = await JournalUtil.getJournalDetailsById(id);
            if (!journal) {
                throw new Exception(404, "JOURNAL_NOT_FOUND", "Journal not found.");
            }
            
            const deletedJournal = await JournalUtil.deleteJournal(id);
            if (!deletedJournal) {
                throw new Exception(500, "JOURNAL_DELETE_FAILED", "Failed to delete journal. Please try again.");
            }
            
            return res.status(200).json({
                success: true,
                message: "Journal deleted successfully!"
            });
    
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: error.message || "An unexpected error occurred."
                }
            });
        }
    }
    
    static async createJournalCategories(req, res) {
        try {  
            const { category_name, role } = req.body;
            
            if (!category_name) {
                throw new Exception(400, "MISSING_CATEGORY_NAME", "Category name is required.");
            }
    
            const allowedRoles = ["superadmin"];
            if (!allowedRoles.includes(role)) {
                throw new Exception(403, "UNAUTHORIZED_ACCESS", "Unauthorized access!");
            }
    
            const exists = await JournalUtil.getJournalCategoryByName(category_name);
            if (exists) {
                throw new Exception(409, "CATEGORY_ALREADY_EXISTS", "Category already exists. Please choose a different name.");
            }
            
            const save = await JournalUtil.createCategory({ category_name });
            if (!save) {
                throw new Exception(500, "CATEGORY_CREATE_FAILED", "Failed to create category. Please try again.");
            }
    
            return res.status(201).json({
                success: true,
                message: "Category created successfully!"
            });
    
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: error.message || "An unexpected error occurred."
                }
            });
        }
    }
    
    static async journalCategories(req, res) { 
        try {
            const { role } = req.query;
            if (!role) {
                throw new Exception(400, "MISSING_ROLE", "Role is required!");
            }
    
            const allowedRoles = ["superadmin"];
            if (!allowedRoles.includes(role)) {
                throw new Exception(403, "UNAUTHORIZED_ACCESS", "Unauthorized access!");
            }
    
            let journals_categories = await JournalUtil.getJournalCategories(); 
            journals_categories = journals_categories.map(row => ({ 
                ...row, 
                category_name: utils.ucwords(row.category_name),
                description_formated: utils.nl2br(row.description),
                created_at: row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '',
                updated_at: row.updated_at ? new Date(row.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : ''
            })); 
    
            return res.status(200).json({
                success: true,
                data: journals_categories
            });
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: "An unexpected error occurred!"
                },
                data: []
            });
        }  
    }
    
    static async editJournalCategories(req, res) { 
        try {   
            const { category_name, role } = req.body;
            
            if (!role) {
                throw new Exception(403, "MISSING_ROLE", "Access denied. Missing role!");
            }
            
            const allowedRoles = ["superadmin"];
            if (!allowedRoles.includes(role)) {
                throw new Exception(403, "UNAUTHORIZED_ACCESS", "Unauthorized access!");
            }
            
            if (!category_name) {
                throw new Exception(400, "MISSING_CATEGORY_NAME", "Category name is required!");
            } 
            
            const isUpdated = await JournalUtil.editCategory(req.body);
            if (!isUpdated) {
                throw new Exception(500, "CATEGORY_UPDATE_FAILED", "Failed to update category. Please try again!");
            }
    
            return res.status(200).json({
                success: true,
                message: "Category updated successfully!"
            });
    
        } catch (error) {
            const statusCode = error.status || 500;
            return res.status(statusCode).json({ 
                success: false, 
                error: {
                    code: error.code || "GATEWAY_ERROR",
                    message: "An unexpected error occurred!"
                }
            });
        } 
    }
    
}

module.exports = JournalController;
