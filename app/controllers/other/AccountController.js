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

class AccountController {
    constructor() {
        // 
    }

    static async accountProfile(req, res) { 
        return res.render("crm/settings/account/profile", { 
            title: "Settings Page",  
            badge: 'Settings | Account Profile Settings', 
            user: req.session.user 
        });
    }

    static async accountPrivacy(req, res) { 
        return res.render("crm/settings/account/privacy", { 
            title: "Settings Page",  
            badge: 'Settings | Account Privacy Settings', 
            user: req.session.user 
        });
    }
}

module.exports = AccountController;