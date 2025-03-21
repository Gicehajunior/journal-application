const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Journal = require('@models/Journal'); 
const Util = require('@utils/Util');
const UserUtil = require('@utils/UserUtil');

class DashboardController {
    static async index(req, res) {  
        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        let usersCount = await User.count();
        let journalEntriesCount = await Journal.count(); 
        let galleryPhotosCount = 0;
        let contactssCount = 0;
        let messagessCount = 0;
        let backupsCount = 0;

        return res.render("crm/dashboard", { 
            title: "Dashboard Page", 
            status: status, 
            message: message, 
            user: req.session.user,
            usersCount: usersCount,
            journalEntriesCount: journalEntriesCount,
            galleryPhotosCount: galleryPhotosCount,
            contactssCount: contactssCount,
            messagessCount: messagessCount,
            backupsCount: backupsCount
        });
        
    } 
}

module.exports = DashboardController;
