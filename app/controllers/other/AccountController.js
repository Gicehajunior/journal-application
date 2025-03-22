const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Journal = require('@models/Journal');
const Util = require('@utils/Util');
const UserUtil = require('@utils/UserUtil'); 
const JournalUtil = require('@utils/JournalUtil'); 
const utils = require('@config/utils'); 
const bcrypt = require('bcryptjs');
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

    static async updateAccountProfile(req, res) {
        try { 
            let data = {};  
            data['id'] = req.session.user.id;
            data['fullname'] = req.body.fullname ?? null;
            data['username'] = req.body.username ?? null;
            data['email'] = req.body.email ?? null;
            data['contact'] = req.body.contact ?? null;    
            
            if (!req.session.user.id) {
                throw new Error('Your request has been denied. Please try again!');
            }

            const user = await UserUtil.userExistsById(req.session.user.id);
            if (!user) {
                throw new Error('User Not found!');
            } 
            
            const action = await UserUtil.editUserFunc(data);
            if (!action) {
                throw new Error('Your request has been denied. User detail not edited. Please try again!');
            }

            const updated_user_details = await User.findOne({ where: { id: data['id'] } });
            req.session.user = { 
                id: updated_user_details.id, 
                fullname: updated_user_details.fullname, 
                username: updated_user_details.username, 
                email: updated_user_details.email, 
                contact: updated_user_details.contact, 
                role: updated_user_details.role 
            };

            const updateSession = await User.build().updateSession(req);
            let redirectUrl = '';
            let status = 'success';
            let message = "Profile updated successfully!";
            if (!updateSession) {
                status = 'warning';
                message = 'Your session appears to have changed. For security purposes, you have therefore been logged out of the system!';
                redirectUrl = `/login?auth=${Util.encodeMessage(message)}`;
            }

            return res.status(200).json({status: status, message: message, redirectUrl: redirectUrl, action});
            
        } catch(error) {
            console.error(error);
            return res.status(200).json({status: "error", message: error.message || "An error occured!"});
        } 
    }

    static async updateAccountPrivacy(req, res) {
        try { 
            let data = {};  
            data['id'] = req.session.user.id;
            data['oldPassword'] = req.body.oldPassword ?? null;
            data['newPassword'] = req.body.newPassword ?? null; 
            data['confirmPassword'] = req.body.confirmPassword ?? null; 

            if (!req.session.user.id) {
                throw new Error('Your request has been denied. Please try again!');
            }

            if (!data['oldPassword'] || !data['newPassword'] || !data['confirmPassword']) {
                throw new Error(`All fields are required!`);
            }


            if (data['newPassword'] !== data['confirmPassword']) {
                throw new Error(`Password mismatch error!`);
            }

            const exists = await UserUtil.userExistsById(req.session.user.id);
            if (!exists) {
                throw new Error('User Not found!');
            }  

            const user = await User.findOne({ where: { id: data['id'] } });
            if (!user) {
                throw new Error('User not found');
            }

            const isMatch = await bcrypt.compare(data['oldPassword'], user.password);
            if (!isMatch) {
                throw new Error('Invalid Old password!');
            } 

            const action = await UserUtil.updatePassword(data);
            if (!action) {
                throw new Error('Your request has been denied. User detail not edited. Please try again!');
            }
            
            let message = "You have been locked out. Your password appears to have changed, please log in again!"; 
            return res.status(200).json({status: 'success', message: message, redirectUrl: `/login?auth=${Util.encodeMessage(message)}`, action});
            
        } catch(error) {
            console.error(error);
            return res.status(200).json({status: "error", message: error.message || "An error occured!"});
        }  
    }

}

module.exports = AccountController;