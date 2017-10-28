/*
data GET and POST on the client side:
POST: client fills form -> form gets ajaxed as object with key = input name and val = user input
-> req.body (== ajaxed form) gets validated against schema object in this file -> data sent to sql (logic in app.js)

How to create a new user entry form:
1. create/define the object corresponding to the form in this file (schemas.js), also define the field types (isEmail, ...)
2. create the form in html/jade/pug with equivalent (to the definitions in this file) vee validation rules.
3. app.post() to handle the form submit request: validate() it , .then insert it
(4. inkyct() (createTableIfNotExists) through dbinit.js file)
*/



// now i dont really need the validator, since im just evaluating the validator function names on validation in app.js
// const val = require("validator");

//TODO i have to differenciate between schemas and models

module.exports = {
	

	formdata : {restaurantname: "isEmail" , doesdelivery: "isBoolean"},
	user : function () {return {
		firstname : "",
		lastname : "",
		username : "",
		email : "",
		password : "",
		last_login: "",
		status : "",
		passwordResetToken : "",
		passwordResetExpires : ""
	}},
	
	empty : {
		user : function () {
			return {
			firstname : "",
			lastname : "",
			username : "",
			email : "",
			password : "",
			last_login: "",
			status : "",
			passwordResetToken : "",
			passwordResetExpires : ""
		}}
	}
	

};

// TODO
function empty(schema) {
	var res = schema;
	for (let i in res) {
		res[i] = "";
	}
	return res;
}