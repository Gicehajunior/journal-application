const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const db = require('@config/database');
const validator = require('validator');

class UserUtil extends Util {
    constructor() {
        super();
    }

    async userExistsById(id) {
        const user = await User.findOne({ where: { id } });
        return user ? true : false;
    }

    async getUserById(id) {
        return await User.findOne({ where: { id } });
    }

    async editUserFunc(data) {
        let { id, fullname, username, email, contact, password, confirmPassword, role } = data;

        if (!id || !fullname || !username || !email || !contact) {
            throw new Error("ID, Username, Email, and Contact are required!");
        }
        
        fullname = validator.escape(validator.trim(fullname));
        username = validator.escape(validator.trim(username));
        email = validator.escape(validator.trim(email));
        contact = validator.escape(validator.trim(contact));
        password = validator.escape(validator.trim(password));
        confirmPassword = validator.escape(validator.trim(confirmPassword));

        if (!validator.isEmail(email)) {
            throw new Error(`Email appears to be invalid!`);
        }

        // Fetch user
        let userDetails = await this.getUserById(id);
        if (!userDetails) {
            throw new Error("User not found!");
        }

        // Hash password if password is newly provided
        if (password) {
            if (password == confirmPassword) {
                throw new Error("Oops, Password mismatch!");
            }
            
            const salt = await bcrypt.genSalt(10);
            password = await bcrypt.hash(password, salt);
        } else {
            password = userDetails.password;
        }

        // Update user details  
        return await User.update({ fullname, username, email, contact, password, role }, {
            where: {
                id: id,
            },
        }); 
    }

    async updatePassword(data) {
        let { id, newPassword } = data;

        if (!id || !newPassword) {
            throw new Error("Password is required!");
        }

        newPassword = validator.escape(validator.trim(newPassword)); 

        let userDetails = await this.getUserById(id);
        if (!userDetails) {
            throw new Error("User not found!");
        }

        // Update user password  
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt); 
        return await User.update({ password: hashedPassword }, {
            where: {
                id: id,
            },
        }); 
    }
}

module.exports = new UserUtil();