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

    async getAllJournals(filter) {
        const queryInterface = db.getSequelize().getQueryInterface();

        let journals = await queryInterface.select(null, 'journal', {
            where: { user_id: filter['user_id'] }
        });
        
        for (let journal of journals) {
            const category = await queryInterface.select(null, 'journal_categories', {
                where: { 
                    id: journal.category_id 
                }
            });
        
            journal.category = category.length > 0 ? category[0] : null;
        }

        return journals;
    }

    async getJournalCategoryByName(categoryName) {
        const queryInterface = await db.getSequelize().getQueryInterface();
        const query = await queryInterface.select(null, 'journal_categories');
        const category = query.find(row => row.category_name === categoryName);

        if (!category) { 
            return null;
        } 

        return category;
    }

    async getJournalCategoryById(id) { 
        const queryInterface = await db.getSequelize().getQueryInterface();
        const query = await queryInterface.select(null, 'journal_categories', { where: { id } });
        return query.length ? query[0] : null;
    }

    async getJournalCategories() {
        try {
            const queryInterface = await db.getSequelize().getQueryInterface();
            const categories = await queryInterface.select(null, 'journal_categories');
            return categories;
        } catch (error) {
            return null;
        }
    }

    async getJournalDetailsById(id) {
        return await Journal.query().findOne({ where: { id } }); 
    }

    async createJournalFunc(data) {
        const {title, date, category_id, description, user_id, attachments, status, journal_id} = data; 
        const create = await Journal.query()
            .create({title: title, date: date, category_id: category_id, description: description, user_id: user_id, attachments: attachments, status: status}); 

        return create;
    }

    async editJournalFunc(data) {
        const {title, date, category_id, description, user_id, attachments, status, journal} = data;  
        const create = await Journal.query()
            .update({title: title, date: date, category_id: category_id, description: description, user_id: user_id, attachments: attachments, status: status}, {
                where: {
                    id: journal
                }
            }); 

        return create;
    }

    async createCategory(data) { 
        const queryInterface = await db.getSequelize().getQueryInterface();

        const create = await queryInterface.bulkInsert('journal_categories', [
            {category_name: data['category_name'], description: data['description']}
        ]); 

        return create;
    }

    async editCategory(data) { 
        const queryInterface = await db.getSequelize().getQueryInterface();

        const updated = await queryInterface.bulkUpdate(
            'journal_categories', 
            { 
                category_name: data.category_name, 
                description: data.description 
            }, 
            { id: data.id }
        ); 

        return updated;
    }
}

module.exports = new JournalUtil();