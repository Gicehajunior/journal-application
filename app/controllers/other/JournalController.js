const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Journal = require('@models/Journal');
const Util = require('@utils/Util');
const UserUtil = require('@utils/UserUtil'); 
const JournalUtil = require('@utils/JournalUtil'); 
const utils = require('@config/utils'); 
const path = require('path');
const fs = require('fs');

class JournalController {
    constructor() {
        // 
    }

    static async index(req, res) {
        if (req.query.type && req.query.type == 'dt') {
            try {
                let journals = await JournalUtil.getAllJournals({user_id: req.session.user.id}) 
                journals = journals.map(row => {  
                    return {
                        ...row,
                        action: `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li>
                                        <button class="dropdown-item journal-resource edit-journal-btn" data-id="${row.id}">
                                            ✏️ Edit
                                        </button>
                                    </li>
                                    <li>
                                        <button class="dropdown-item text-danger journal-resource delete-journal-btn" data-id="${row.id}">
                                            🗑️ Delete
                                        </button>
                                    </li>
                                    <li>
                                        <button class="dropdown-item journal-resource preview-journal-btn" data-modal=".preview-journal-modal" data-id="${row.id}">
                                            👁️ Preview
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        `,
                        description_closed: (() => {
                            const maxLength = 80; // Adjust the max length as needed
                            return row.description.length > maxLength 
                                ? row.description.substring(0, maxLength) + "..." 
                                : row.description;
                        })(),
                        title: utils.ucwords(row.title),
                        category_name: row.category.category_name ?? 'N/A',
                        created_at: (() => {
                            if (!row.created_at) return '';
                            
                            let d = new Date(row.created_at);
                            
                            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                        })(),
                        updated_at: (() => {
                            if (!row.updated_at) return '';
                            
                            let d = new Date(row.updated_at);

                            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                        })(),
                    };
                }); 

                return res.status(200).json({data: journals});
            } catch (error) {
                console.error(error);
                return res.status(200).json({data: []});
            }
        }
        
        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        return res.render("crm/journal/index", { 
            title: "Journal Page", 
            status: status, 
            message: message, 
            badge: 'Journal | Manage Journals', 
            user: req.session.user 
        });
    }

    static async createJournal(req, res) {
        if (req.method == 'POST') { 
            try {
                const {title, date, category_id, description, stayHere} = req.body;
                
                if (!title && !date && !category_id && !description) {
                    throw new Error('All fields are need to be filled!');
                }

                req.body.user_id = req.session.user.id ?? null;

                if (!req.body.user_id) {
                    throw new Error('Authentication error occurred. Please try again later!');
                }

                // preprocess uploads dict for db saving. 
                req.body.attachments = {};
                if (req.files) {
                    req.files.forEach(file => {
                        req.body.attachments[file.originalname] = path.join(`/store/uploads/${req.session.user.id}`, file.originalname);
                    });  
                }

                console.log(req.body.attachments);
                req.body.status = 'draft';
                req.body.attachments = JSON.stringify(req.body.attachments);
                const save = await JournalUtil.createJournalFunc(req.body);
                if (!save) {
                    throw new Error('An error occurred. Please try again!');
                }

                // move the files to destination
                if (req.files || req.files.length > 0) { 
                    const uploadPath = `${config.PATHS.PUBLIC}/store/uploads/${req.session.user.id}`;
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    
                    req.files.forEach(file => {
                        const filePath = path.join(uploadPath, file.originalname);
                        fs.writeFileSync(filePath, file.buffer); 
                    }); 
                } 

                let redirectUrl;
                if (!stayHere) {
                    redirectUrl = '/journal/list'; 
                }

                return res.status(200).json({status: 'success', message: 'Journal created Successfully!', redirectUrl: redirectUrl});
            } catch (error) { 
                return res.status(200).json({
                    status: 'error', 
                    message: error.message || 'An error occurred. Please try again!', 
                });
            }
        }

        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        let journal_categories = await JournalUtil.getJournalCategories(); 

        return res.render("crm/journal/create", { 
            title: "Journal Page", 
            status: status, 
            message: message, 
            badge: 'Journal | Create Journals', 
            user: req.session.user,
            journal_categories: journal_categories
        }); 
    }

    static async editJournal(req, res) {
        let journal_id = req.method == 'POST' ? (req.body.journal ?? null) : (req.query.journal ?? null);
        let journal;
        if (journal_id) {
            journal = await JournalUtil.getJournalDetailsById(journal_id);
        } 

        if (req.method == 'POST') {  
            try {
                const {title, date, category_id, description, rmPreviousAddedAttachments, stayHere} = req.body;
                
                if (!title && !date && !category_id && !description) {
                    throw new Error('All fields are need to be filled!');
                }

                req.body.user_id = req.session.user.id ?? null;

                if (!req.body.user_id) {
                    throw new Error('Authentication error occurred. Please try again later!');
                }
                
                if (!journal_id) {
                    throw new Error('Oops, Journal could not be found. Please try again later!');
                }

                // preprocess uploads dict for db saving. 
                req.body.attachments = {};

                // add new attachments to existing ones.
                if (!rmPreviousAddedAttachments && journal && journal.attachments) {
                    journal.attachments = JSON.parse(journal.attachments); 
                    req.body.attachments = journal.attachments; 
                }

                if (req.files) {
                    req.files.forEach(file => {
                        req.body.attachments[file.originalname] = path.join(`/store/uploads/${req.session.user.id}`, file.originalname);
                    });  
                }

                console.log(req.body.attachments);
                req.body.status = 'draft'; 
                req.body.attachments = JSON.stringify(req.body.attachments);
                
                req.body.journal = journal_id;
                const save = await JournalUtil.editJournalFunc(req.body);
                if (!save) {
                    throw new Error('An error occurred. Please try again!');
                }

                // move the files to destination
                if (req.files || req.files.length > 0) { 
                    const uploadPath = `${config.PATHS.PUBLIC}/store/uploads/${req.session.user.id}`;
                    if (!fs.existsSync(uploadPath)) {
                        fs.mkdirSync(uploadPath, { recursive: true });
                    }
                    
                    req.files.forEach(file => {
                        const filePath = path.join(uploadPath, file.originalname);
                        fs.writeFileSync(filePath, file.buffer); 
                    }); 
                }  

                if (rmPreviousAddedAttachments && journal && journal.attachments) {
                    journal.attachments = JSON.parse(journal.attachments); 
                    journal.attachments = Object.entries(journal.attachments);
                    journal.attachments.forEach(([filename, filePath]) => {
                        console.log(filePath);
                        const fullPath = path.join(config.PATHS.PUBLIC, filePath); // Adjust path as needed
                        console.log(fullPath);
                        if (fs.existsSync(fullPath)) {
                            fs.unlink(fullPath, (err) => {
                                if (err) {
                                    console.error(`Error deleting file: ${fullPath}`, err);
                                } else {
                                    console.log(`Deleted file: ${fullPath}`);
                                }
                            });
                        }
                    }); 
                }

                let redirectUrl;
                if (!stayHere) {
                    redirectUrl = '/journal/list'; 
                }

                return res.status(200).json({status: 'success', message: 'Journal edited Successfully!', redirectUrl: redirectUrl, rmPreviousAddedAttachments: rmPreviousAddedAttachments});
            } catch (error) { 
                return res.status(200).json({
                    status: 'error', 
                    message: error.message || 'An error occurred. Please try again!', 
                });
            }
        }

        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        if (!journal_id) {
            const status = req.session.status ?? null;
            const message = req.session.message ?? null;
            return res.render("crm/journal/index", { 
                title: "Journal Page", 
                status: status, 
                message: message, 
                badge: 'Journal | Manage Journals', 
                user: req.session.user 
            });
        }

        journal.attachments = JSON.parse(journal.attachments);   
        journal.journal_date = utils.dateToISO8601Formatter(journal.date);
        let journal_categories = await JournalUtil.getJournalCategories(); 

        return res.render("crm/journal/edit", { 
            title: "Journal Page", 
            status: status, 
            message: message, 
            badge: 'Journal | Edit Journal', 
            user: req.session.user ,
            journal: journal,
            journal_categories: journal_categories
        });
    }

    static async journalPreview(req, res) {
        try { 
            let id; 
            if (req.method == 'GET') {
                id = req.query.id;
            }

            if (!id) {
                throw new Error('Your request has been denied. Authentication error occurred!');
            }
            
            let journal = await JournalUtil.getJournalDetailsById(id);
            journal.title = utils.ucwords(journal.title); 
            journal.description = utils.nl2br(journal.description); 
            journal.journal_date = utils.dateToISO8601Formatter(journal.date);
            journal.attachments = JSON.parse(journal.attachments); 
            let journal_category = null;
            if (journal.category_id) {
                journal_category = await JournalUtil.getJournalCategoryById(journal.category_id); 
                journal.category_name = journal_category.category_name
            }
            
            return res.render('crm/journal/partials/journal-preview', {title: "Edit User", journal: journal, journal_category: journal_category}); 
        } catch(error) {
            console.error(error);
            return res.status(200).json({status: "error", message: error.message || "An error occured!"});
        }
    }

    static async createJournalCategories(req, res) {
        try {  
            console.log(req.body);
            const category_name = req.body.category_name; 
            if (!category_name) {
                throw new Error(`Category name must be provided. Please check, & try again!`);
            }

            const exists = await JournalUtil.getJournalCategoryByName(category_name);
            if (exists) {
                throw new Error(`Category already exists. Please add a new category!`);
            }

            const save = await JournalUtil.createCategory(req.body);
            if (!save) {
                throw new Error(`Category could not be saved. Please try again!`);
            }

            return res.status(200).json({status: 'success', message: 'Category created successfully!'});
        } catch(error) {
            console.error(error);
            return res.status(200).json({status: "error", message: error.message || "An error occured!"});
        }
    }

    static async journalCategories(req, res) {
        if (req.query.type && req.query.type == 'dt') {
            try {
                let journals_categories = await JournalUtil.getJournalCategories(); 
                journals_categories = journals_categories.map(row => { 
                    return {
                        ...row,
                        action: `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                    Actions
                                </button>
                                <ul class="dropdown-menu">
                                    <li>
                                        <button class="dropdown-item journal-category-resource edit-journal-category-btn" data-modal=".edit-category-modal" data-id="${row.id}">
                                            ✏️ Edit
                                        </button>
                                    </li>
                                    <li>
                                        <button class="dropdown-item text-danger journal-category-resource delete-journal-category-btn" data-id="${row.id}">
                                            🗑️ Delete
                                        </button>
                                    </li> 
                                </ul>
                            </div>
                        `, 
                        category_name: utils.ucwords(row.category_name),
                        description_formated: utils.nl2br(row.description),
                        created_at: (() => {
                            if (!row.created_at) return '';
                            
                            let d = new Date(row.created_at);
                            
                            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                        })(),
                        updated_at: (() => {
                            if (!row.updated_at) return '';
                            
                            let d = new Date(row.updated_at);

                            return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                        })(),
                    };
                }); 

                return res.status(200).json({data: journals_categories});
            } catch (error) {
                console.error(error);
                return res.status(200).json({data: []});
            }
        }

        return res.render("crm/journal/categories", { 
            title: "Journal Page",  
            badge: 'Journal | Manage Journal Categories', 
            user: req.session.user 
        });
    }

    static async editJournalCategories(req, res) {
        if (req.method == 'POST') {
            try {   
                const category_name = req.body.category_name; 
                if (!category_name) {
                    throw new Error(`Category name must be provided. Please check, & try again!`);
                } 
    
                const save = await JournalUtil.editCategory(req.body);
                if (!save) {
                    throw new Error(`Category could not be saved. Please try again!`);
                }
    
                return res.status(200).json({status: 'success', message: 'Category created successfully!'});
            } catch(error) {
                console.error(error);
                return res.status(200).json({status: "error", message: error.message || "An error occured!"});
            }
        }
        else {
            try {  
                
                let id = req.query.id;
    
                if (!id) {
                    throw new Error('Your request has been denied. Authentication error occurred!');
                }
                
                let journal_category = await JournalUtil.getJournalCategoryById(id); 
                if (!journal_category) {
                    throw new Error('Your request has been denied. Please try again!');
                }

                journal_category.category_name = utils.ucwords(journal_category.category_name); 
                journal_category.description = utils.nl2br(journal_category.description);  

                return res.render('crm/journal/partials/edit-category', {title: "Edit Journal Category", journal_category: journal_category}); 
            } catch(error) {
                console.error(error);
                return res.status(200).json({status: "error", message: error.message || "An error occured!"});
            }
        }
    }
}

module.exports = JournalController;
