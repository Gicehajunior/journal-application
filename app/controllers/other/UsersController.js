const jwt = require('jsonwebtoken');
const config = require('@config/config');
const User = require('@models/User');
const Util = require('@utils/Util');
const UserUtil = require('@utils/UserUtil');
const Journal = require('@models/Journal'); 
const utils = require('@config/utils');

class UsersController {
    constructor () {
        // this.util = new Util();
        // this.userUtil = UserUtil;  
    }

    static async index(req, res) {   
        const status = req.session.status ?? null;
        const message = req.session.message ?? null;
        return res.render("crm/users/index", { title: "Users Management", badge: 'Users | Manage Users', status: status, message: message, user: req.session.user });
    } 

    static async getUsers(req, res) {   
        try { 
            let users = await User.query().findAll(); 
            users = users.map(user => {
                let data = user.dataValues; // Extract Sequelize dataValues
    
                return {
                    ...data,
                    action: `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li>
                                    <button class="dropdown-item users-resource edit-user-btn" data-modal=".edit-users-modal" data-id="${data.id}">
                                        ✏️ Edit
                                    </button>
                                </li>
                                <li>
                                    <button class="dropdown-item text-danger users-resource delete-user-btn" data-id="${data.id}">
                                        🗑️ Delete
                                    </button>
                                </li>
                            </ul>
                        </div>
                    `,
                    fullname: utils.ucwords(data.fullname),
                    created_at: (() => {
                        if (!data.created_at) return '';
                        
                        let d = new Date(data.created_at);
                        
                        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                    })(),
                    updated_at: (() => {
                        if (!data.updated_at) return '';
                        
                        let d = new Date(data.updated_at);

                        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
                    })(),
                };
            });

            return res.status(200).json({data: users}); 
        } catch (error) {
            console.error(error);
            return res.status(200).json({data: []});
        }
    }  
    
    static async editUser(req, res) {
        try { 
            let id;
            let data = {};
            
            if (req.method == 'GET') {
                id = req.query.id;
            }

            if (req.method == 'POST') {
                id = req.body.id ?? null; 
                data['id'] = req.body.id ?? null;
                data['fullname'] = req.body.fullname ?? null;
                data['username'] = req.body.username ?? null;
                data['email'] = req.body.email ?? null;
                data['contact'] = req.body.contact ?? null;
                data['password'] = req.body.password ?? null;
                data['confirmPassword'] = req.body.confirmPassword ?? null;    
            }
            
            if (!id) {
                throw new Error('Your request has been denied. Please try again! ' + req.method);
            }

            const user = await UserUtil.userExistsById(id);
            if (!user) {
                throw new Error('User Not found!');
            }

            if (req.method == 'GET') {
                let user = await UserUtil.getUserById(id);
                user.fullname = utils.ucwords(user.fullname); 

                return res.render('crm/users/partials/edit-user', {title: "Edit User", user: user});
            }

            const action = await UserUtil.editUserFunc(data);
            if (!action) {
                throw new Error('Your request has been denied. User detail not edited. Please try again!');
            }

            return res.status(200).json({status: 'success', message: "User edited successfully!", action});
            
        } catch(error) {
            console.error(error);
            return res.status(200).json({status: "error", message: error.message || "An error occured!"});
        }
    }
}

module.exports = UsersController;
