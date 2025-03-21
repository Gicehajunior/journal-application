const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const db = require('@config/database');

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