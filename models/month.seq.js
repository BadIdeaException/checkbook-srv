"use strict";
module.exports = function(sequelize, DataTypes) {
  var Month = sequelize.define("Month", {
    id: {
    	type: DataTypes.INTEGER,
    	primaryKey: true
    },
    value: {
    	type: DataTypes.INTEGER,
    	allowNull: false,
    	defaultValue: 0
    }
  }, {
    classMethods: {
        associate: function(models) {
            // associations can be defined here
        },
        /**
         * Calculates the month id for the passed argument(s).
         * Arguments can be a Date object, a date string (which will be converted to a date object),
         * or two numbers for month (zero-based) and year.
         * Month ids are zero-based, i.e. January 1970 has an id of 0.
         */
        getId: function(arg1, arg2) {
    	   var date, month, year;
    	   // If arg1 is a string, try parsing it to a date
    	   if (typeof arg1 === 'string') {
    	       date = new Date(Date.parse(arg1));
    	   }
    	   // If arg1 is a date object, just use the object
    	   if (typeof arg1 === 'object' && arg1 instanceof Date) date = arg1;
    	   if (date) {
    		  month = date.getMonth();
    		  year = date.getFullYear();
    	   }
    	   // If the arguments are two numbers, use the first one as the month, the second as the year
    	   if (typeof arg1 === 'number' && typeof arg2 === 'number') {
    		  month = arg1;
    		  year = arg2;
    	   }
    	   if (typeof month === 'undefined' || typeof 'year' === undefined) throw new Error('Illegal argument');
    	   return (year - 1970) * 12 + month;
        },
    },
    instanceMethods: {
    	/**
    	 * Gets the month that corresponds to the month's id.
    	 */
    	getMonth: function() {
            return this.id % 12;
    	},
    	/**
    	 * Gets the year that corresponds to the month's id.
    	 */
    	getYear: function() {
    		return 1970 + (Math.floor(this.id / 12));
    	},
    	/**
    	 * Gets all entries for this month.
    	 * <code>options</code> can be passed in as for the usual sequelize finder methods.
    	 * Returns a promise.
    	 */
    	getEntries: function(options) {
    		options = options || { where: {} };
            // Combine existing WHERE with the following that filters out entries in this month
            options.where = sequelize.and(options.where, {
                // datetime column must be between beginning of this month (inclusive) and beginning of
                // the following month (exclusive)
                // We know year and month because we know this month's id
                datetime: {
                    $gte: new Date(this.getYear(), this.getMonth()), // Beginning of the month as decoded from this month's id
                    $lt : new Date(this.getYear(), this.getMonth() + 1) // Beginning of the following month
                }
            });

            return sequelize.models.Entry.findAll(options);
    	}
    },
    timestamps: false,
    underscored: true,
    tableName: 'months'
  });

  // Override truncate method because the DBMS will otherwise throw an error for trying
  // to truncate a view.
  // Always returns a resolved promise with value 0
  Month.truncate = function() {
    return Promise.resolve(0);
  };

  return Month;
};