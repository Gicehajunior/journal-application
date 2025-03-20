const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config'); 
const Journal = require('@models/Journal');
const db = require('@config/database');

class JournalUtil extends Util {
    constructor() {
        super();
    }

    async journalExistsById(id) {
        const journal = await Journal.query().findOne({ where: { id } });
        return journal ? true : false;
    }

    async getJournalDetailsById(id) {
        return await Journal.query().findOne({ where: { id } }); 
    }

    async createJournalFunc(data) {
        const {title, date, category, description, user_id, attachments, status, journal_id} = data; 
        const create = await Journal.query()
            .create({title: title, date: date, category: category, description: description, user_id: user_id, attachments: attachments, status: status}); 

        return create;
    }

    async editJournalFunc(data) {
        const {title, date, category, description, user_id, attachments, status, journal} = data;  
        const create = await Journal.query()
            .update({title: title, date: date, category: category, description: description, user_id: user_id, attachments: attachments, status: status}, {
                where: {
                    id: journal
                }
            }); 

        return create;
    }
}

module.exports = new JournalUtil();