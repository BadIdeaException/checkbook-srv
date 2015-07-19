"use strict";
module.exports = function(sequelize, DataTypes) {
  var Category = sequelize.define("Category", {
    id: {
    	type: DataTypes.INTEGER,
    	primaryKey: true,
    },
    caption: DataTypes.TEXT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      },
    },
    timestamps: false,
    underscored: true,
    tableName: 'categories'
  });
  return Category;
};