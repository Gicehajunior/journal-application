const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Util = require('@utils/Util');
const validator = require('validator');

class AuthController {
    static async register(req, res) {
        return res.render("auth/register", { title: "Register Page" });
    }

    static async authregister(req, res) {
        try {
            const fullname = req.body.fullname ?? null;
            const username = req.body.username ?? null;
            const email = req.body.email ?? null;
            const contact = req.body.contact ?? null;
            const password = req.body.password ?? null;
            const confirmPassword = req.body.confirmPassword ?? null;
    
            // Check if all fields are present
            if (!fullname || !username || !email || !contact || !password || !confirmPassword) {
                throw new Error(`All fields are required!`);
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

            if (password !== confirmPassword) {
                throw new Error(`Password mismatch error!`);
            }
    
            // Check if user already exists
            const existingUser = await User.findOne({ where: { email } }); 
            if (existingUser) {
                throw new Error('Email already registered'); 
            }

            // Hash password and create user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const user = await User.create({ fullname: fullname, username: username, email: email, contact: contact, password: hashedPassword });
            res.status(200).json({ status: 'success', message: 'User registered successfully', redirectUrl: '/login', user });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
    
    static async login(req, res) {
        let message = 'You have been locked out. Please login!';

        if (req.query.message || req.query.auth) {
            try {
                const decodedMessage = Util.decodeMessage(req.query.message || req.query.auth);
                message = decodedMessage || message;
            } catch (error) {
                console.error("Error decoding message:", error);
            }
        }

        try { 
            req.session.destroy();
            res.clearCookie(config.SESSION.SESSION_NAME ?? 'connect.sid'); 
        } catch (error) {
            console.error("Error logging out: ", error);
        }

        return res.render("auth/login", { title: "Login Page", status: 'error', message: message });
    }

    static async authlogin(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new Error(`Check your Username and Password, & try again!`);
            }

            if (!validator.isEmail(email)) {
                throw new Error(`Email appears to be invalid!`);
            }

            const user = await User.findOne({ where: { email } });
            if (!user) {
                throw new Error('User not found');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }
            
            req.session.user = { id: user.id, fullname: user.fullname, username: user.username, email: user.email, contact: user.contact, role: user.role };
            const token = jwt.sign(req.session.user, config.APP.JWT_SECRET, { expiresIn: '1h' });
            req.session.token = token;

            res.status(200).json({ status: 'success', redirectUrl: '/dashboard', token });
        } catch (error) {
            res.status(500).json({ status: 'error', message: 'Error logging in' });
        }
    }

    static async logout(req, res) {
        try {
            req.session.destroy(function (err) {
                if (err) { 
                    throw new Error('Error logging out');
                }
    
                res.clearCookie(config.SESSION.SESSION_NAME ?? 'connect.sid'); 
                
                res.redirect(`/login?auth=${Util.encodeMessage('You have logged out successfully.')}`);
            });
        } catch (error) { 
            if (req.session) {
                req.flash('status', 'error');
                req.flash('message', 'Unexpected error occurred');
            }
            
            res.redirect('back');
        }
    }
}

module.exports = AuthController;
