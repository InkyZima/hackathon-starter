
var schemas = require("../models/models");

var knex = require('knex')({
  dialect: 'sqlite3',
  connection: {
    filename: '../main.db'
  }
});

var throwerr = (err) => {throw err};
var c = console.log;

knex.schema.dropTableIfExists("users").catch((err) => {
	c(err);
	return ;
}).then(() => {
	knex.schema.createTableIfNotExists("users" , (table) => {
	table.increments();
	table.timestamps();	
	var newuser = schemas.user();
	for (var i in newuser) {
		table.string(i);
	}
	}).catch(err => {c("error on table users creation: " + err); throw err;}).then(() => {
		c("created table users."); 
		knex.destroy();
	});
});
	
/*
(async function() {
	var temp = await knex("leadmanagement").count().where({
	dealer: "112",
	"managed in objective" : "0"
	}).then((res) => {return res})
	c(temp)

})();
*/


