const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ContactSubmission = sequelize.define(
        'ContactSubmission',
        {
            contact_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            subject: {
                type: DataTypes.STRING(500),
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: 'contact_submissions',
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    );

    return ContactSubmission;
};
