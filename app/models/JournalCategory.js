const { DataTypes, Model } = require('sequelize');
const db = require('@config/database'); 
const Journal = require('@models/Journal');

class JournalCategory extends Model {
    static tableName = 'journal_categories';

    static query(sequelize) {
        JournalCategory.init({
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            category_name: { type: DataTypes.STRING, allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        }, {
            sequelize,
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            tableName: JournalCategory.tableName,
        });

        // Relationship calls
        JournalCategory.hasManyJournals();
        JournalCategory.belongsToJournalCategory();
    }

    static hasManyJournals() {
        JournalCategory.hasMany(Journal, { foreignKey: 'category_id', as: 'journals' });
    }

    static belongsToJournalCategory() {
        Journal.belongsTo(JournalCategory, { foreignKey: 'category_id', as: 'category' });
    }
}

JournalCategory.query(db.getSequelize());
module.exports = JournalCategory;
