const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Journal = require('@models/Journal'); 
const Util = require('@utils/Util');
const UserUtil = require('@utils/UserUtil');
const JournalUtil = require('@utils/JournalUtil');
const JournalCategory = require('@models/JournalCategory');

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

    static async pieChartStat(req, res) { 
        try {
            req.query.userId = req.session.user.id;
            const grouped_journals = await JournalUtil.getJournalsByCategories(req.query);

            return res.status(200).json({data: grouped_journals});
        } catch (error) {
            return res.status(200).json({data: [], error: error.message || 'Piechart data retrieval error!'});
        }
    }       
}

module.exports = DashboardController;
