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
                const {title, date, category, description, stayHere} = req.body;
                
                if (!title && !date && !category && !description) {
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
                return res.status(502).json({
                    status: 'error', 
                    message: error.message || 'An error occurred. Please try again!', 
                });
            }
        }

        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        return res.render("crm/journal/create", { 
            title: "Journal Page", 
            status: status, 
            message: message, 
            badge: 'Journal | Create Journals', 
            user: req.session.user 
        }); 
    }

    static async editJournal(req, res) {
        if (req.method == 'POST') {
            // 
        }

        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        return res.render("crm/journal/create", { 
            title: "Journal Page", 
            status: status, 
            message: message, 
            badge: 'Journal | Edit Journal', 
            user: req.session.user 
        });
    }
}

module.exports = JournalController;
