const Util = require('@utils/Util');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('@config/config'); 
const Journal = require('@models/Journal');
const JournalCategory = require('@models/JournalCategory');
const db = require('@config/database');
const { Sequelize, Op } = require('sequelize');

class JournalUtil extends Util {
    constructor() {
        super();
    }

    async journalExistsById(id) {
        const journal = await Journal.findOne({ where: { id } });
        return journal ? true : false;
    }

    async getAllJournals(filter) {
        const queryInterface = db.getSequelize().getQueryInterface(); 
        let journals = await queryInterface.select(null, 'journal', {
            where: { 
                user_id: filter['user_id'],
                ...(filter['start_date'] && filter['end_date'] ? {
                    created_at: {
                        [Op.between]: [filter['start_date'], filter['end_date']]
                    }
                } : {})
            }
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

    async getJournalsByCategories(filters) { 
        const journalsByCategory = await Journal.findAll({
            attributes: [
                'category_id',
                [Sequelize.fn('COUNT', Sequelize.col('Journal.id')), 'count'],
                [Sequelize.col('category.category_name'), 'category_name']
            ],
            where: {
                user_id: filters['userId'],
                created_at: { [Sequelize.Op.between]: [filters['start_date'], filters['end_date']] }
            },
            include: [{ model: JournalCategory, as: 'category', attributes: ['category_name'] }],
            group: ['category_id', 'category.id'],
            raw: true
        });
        
        return journalsByCategory
    }

    async getJournalCategoryByName(categoryName) {
        const queryInterface = db.getSequelize().getQueryInterface();
        const query = await queryInterface.select(null, 'journal_categories');
        const category = query.find(row => row.category_name === categoryName);

        if (!category) { 
            return null;
        } 

        return category;
    }

    async getJournalCategoryById(id) { 
        const queryInterface = db.getSequelize().getQueryInterface();
        const query = await queryInterface.select(null, 'journal_categories', { where: { id } });
        return query.length ? query[0] : null;
    }

    async getJournalCategories() {
        try {
            const queryInterface = db.getSequelize().getQueryInterface();
            const categories = await queryInterface.select(null, 'journal_categories');
            return categories;
        } catch (error) {
            return null;
        }
    }

    async getJournalDetailsById(id, email=null) {
        let filter = {
            where: { 
                id: id
            } 
        };

        if (email?.length) {
            filter.where.email = email;
        }

        return await Journal.findOne(filter); 
    }

    async createJournalFunc(data) {
        const {title, date, category_id, description, user_id, attachments, status, journal_id} = data; 
        const create = await Journal
            .create({title: title, date: date, category_id: category_id, description: description, user_id: user_id, attachments: attachments, status: status}); 

        return create;
    } 
    async editJournalFunc(data) {
        const {title, date, category_id, description, user_id, attachments, status, journal} = data;  
        const create = await Journal
            .update({title: title, date: date, category_id: category_id, description: description, user_id: user_id, attachments: attachments, status: status}, {
                where: {
                    id: journal
                }
            }); 

        return create;
    }

    async deleteJournal(id) { 
        const trash = await Journal.destroy({ 
                where: {
                    id: id
                }
            });

        return !!trash;
    }

    async createCategory(data) { 
        const queryInterface = db.getSequelize().getQueryInterface();

        const create = await queryInterface.bulkInsert('journal_categories', [
            {category_name: data['category_name'], description: data['description']}
        ]); 

        return create;
    }

    async editCategory(data) { 
        const queryInterface = db.getSequelize().getQueryInterface();

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