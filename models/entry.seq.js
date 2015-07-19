"use strict";

module.exports = function(sequelize, DataTypes) {
  var Entry = sequelize.define("Entry", {
    id: {
    	type: DataTypes.INTEGER,
    	primaryKey: true,
    },
    datetime: {
    	type: DataTypes.DATE,
    	allowNull: false
    },
    caption: DataTypes.TEXT,
    value: {
    	type: DataTypes.INTEGER,
    	allowNull: false
    },
    details: DataTypes.TEXT,
    //category: {
    //	type: DataTypes.INTEGER,
   // 	allowNull: false,
    	// references: 'categories',
    	// referencesKey: 'id'
    //}
  }, {
    classMethods: {
      associate: function(models) {
        Entry.belongsTo(models.Category, {
        	foreignKey: 'category',
        });
      }
    },
    timestamps: false,
    underscored: true,
    tableName: 'entries'
  });
  return Entry;
};