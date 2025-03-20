const { DataTypes, Model } = require('sequelize');
const db = require('@config/database');

class Journal extends Model {
    static tableName = 'journal';

    constructor() {
        super()
    }

    static query() {
        const sequelize = db.getSequelize();
        return sequelize.define("Journal", {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            user_id: { type: DataTypes.INTEGER, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: false },
            category_id: { type: DataTypes.INTEGER, allowNull: true },
            attachments: { type: DataTypes.TEXT, allowNull: true },
            status: { type: DataTypes.TEXT, allowNull: false },
            date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        }, {  
            sequelize: sequelize,  
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            tableName: Journal.tableName,
        });    
    }
}

module.exports = Journal;
