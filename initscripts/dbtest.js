
var knex = require('knex')({
  dialect: 'sqlite3',
  connection: {
    filename: '../main.db'
  }
});

var throwerr = (err) => {throw err};
var c = console.log;
// # leads
var amountofleads;
knex("leadmanagement").count().where({dealer: "112"}).catch(throwerr).then(rows => {
	amountofleads = rows[0]
	});

// #leads managed
var managed;
knex("leadmanagement").count().where({
	dealer: "112",
	"managed in objective" : "1"
	}).catch(throwerr).then(rows => {
	managed = rows[0]
	c(managed);
	});
	



function objval (obj)  {
	var arr = [];
	for (let i in obj) {
		arr.push(obj[i]);
	}
	return arr
}

(async function() {
	var temp = await knex("leadmanagement").count().where({
	dealer: "112",
	"managed in objective" : "0"
	}).then((res) => {return res})
	c(temp)

})();


knex.destroy();