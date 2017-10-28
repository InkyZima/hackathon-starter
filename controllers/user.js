/*
TODO:
forgot passwort -> mail to user
reset password page
*/

// todo dont crypto here; move crypto/bcrypt to inkyauth 
const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
const bcrypt = require("bcrypt");

var knex = require('knex')({
  dialect: 'sqlite3',
  connection: {
    filename: './main.db'
  }
});

const nodemailer = require('nodemailer');


var inkyauth = require("../inkyauth");
const c = console.log;
exports.getlogin = (req, res) => {
	if (req.session.user) {
		req.flash("info" , {msg:"User already logged in."});
		res.redirect(req.session.returnTo || "/");
	} else {
		res.render('account/login', {
			title: 'Login'
		});
	}
};

exports.postlogin =  (req, res, next) => {
	if (req.session && req.session.user) {
		// next("already logged in");
		req.flash("info" , {msg:"User already logged in."});
		c("already logged in : referer: "+ req.header('Referer'));
		(req.header('Referer')) ? res.redirect(req.header('Referer')) : res.redirect("/");
	}
	else {
		if (!req.body.username ||  !req.body.password) {
			req.flash('errors', { msg: 'Username or Password missing' });
			res.redirect("/login");
		}
		inkyauth.authuser(req.body.username, req.body.password).then( (authresult) => {
			// todo whose concern is this? maybe make authuser a middleware and move this to authuser?
			req.session.user = req.body.username;	
			req.flash("success" , {msg:"Login successfull."});
			res.redirect(req.session.returnTo || "/");
			// res.send("newskeleton/main");	 
		}, (err) => {
			req.flash("errors" , {msg: err});
			res.redirect("/login");
		}); 
	}
}; // route

exports.getcheckloginclient = (req,res,next) => {
	if (req.session.user) res.send({user:req.session.user});
	else next("checklogin failed: not logged in");
	
};

exports.checklogin =(req,res,next) => {	
	if (req.session.user) next();
	else next("checklogin failed: not logged in");
}

exports.getlogout = (req,res,next) => {
	if(req.session.user) {
		// req.flash("success" , {msg : "Logout successfull."});
		req.session.destroy();
		res.redirect("/");		
		// setTimeout( () => req.session.destroy() , 500);
	} else { 
		req.flash("errors" , {msg : "Couldn't logout because you are not logged in."});
		res.redirect("/");

	}
};

exports.getsignup = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('account/signup', {
    title: 'Create Account'
  });
};
exports.postsignup = (req, res, next) => {
	inkyauth.createuser(req.body.username, req.body.email, req.body.password).then( (authresult) => {
		req.flash("success" , {msg : "User creation successfull."})
		res.redirect("/login");	 
	}, (err) => 
	{
		req.flash("errors" , {msg: err});
		res.redirect("/signup");
	}); // authuser with then
} // route


// exports.getaccount = () => {};
// exports.postupdateprofile = () => {};
// exports.postUpdatePassword = (req, res, next) => {}
exports.getreset = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  knex("users").select().where({passwordResetToken: req.params.token}).catch((err) => {
	  throw err;
  }).then( (users) => {
	  if (!users[0]) {
		req.flash("errors" , {msg : "Couldn't find any user with this password reset token. Invalid password reset token."});
		res.redirect("/forgot");
	  } else {
		  user = users[0];
		  if (user.passwordResetExpires < Date.now()) {
				req.flash("errors" , {msg : "Password reset token has expired. Please request a new password request token."});
				res.redirect("/forgot");  
		  } else {
			  // main logic
			  res.render('account/reset', {
				title: 'Password Reset'
			  });
		  }
	  }
		  
  }); // knex
};
exports.postreset = (req, res, next) => {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords must match.').equals(req.body.password);

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  const resetPassword = () =>
  knex("users").select().where({passwordResetToken : req.params.token}).catch( err => {throw err; }).then((users) => {
	  if (!users[0]) {
		 req.flash('errors', { msg: "Couldn't find any user with this password reset token. Invalid password reset token." });
         return res.redirect('back');
	  } else {
		  var user = users[0];
		  if (user.passwordResetExpires < Date.now()) {
			req.flash("errors" , {msg : "Password reset token has expired. Please request a new password request token."});
			res.redirect("/forgot");  
		  } else {
			  // main logic
			knex("users").where({passwordResetToken : req.params.token}).update({
				passwordResetToken : "",
				passwordResetExpires : "",
				// todo security: resetting passwords for other users!?
				password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(), null)	
			}).catch( err => {throw err; }).then(() => {
				// todo auto-login and send confirmation email
				req.flash('success', { msg: "Password change successfull." });
				return res.redirect('/login');
			});
		  } // else
	  }
  });

  const sendResetPasswordEmail = (user) => {
    if (!user) { return; }
    const transporter = nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: process.env.SENDGRID_USER,
        pass: process.env.SENDGRID_PASSWORD
      }
    });
    const mailOptions = {
      to: user.email,
      from: 'hackathon@starter.com',
      subject: 'Your Hackathon Starter password has been changed',
      text: `Hello,\n\nThis is a confirmation that the password for your account ${user.email} has just been changed.\n`
    };
    return transporter.sendMail(mailOptions)
      .then(() => {
        req.flash('success', { msg: 'Success! Your password has been changed.' });
      });
  };

  resetPassword()
    // .then(sendResetPasswordEmail)
    // .then(() => { if (!res.finished) res.redirect('/'); })
    // .catch(err => next(err));
};

// exports.postDeleteAccount = (req, res, next) => {}
exports.getforgot = (req, res) => {
  if (req.session.user) {
	req.flash("errors" , {msg: "You need to log out first before we can reset your password."});
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};
exports.postforgot =  (req, res, next) => {
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.sanitize('email').normalizeEmail({ gmail_remove_dots: false });

  const errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/forgot');
  }
	
	var thetoken;
	// save tocken at user in users table
	// send email with token
	// redirect
	// todo email has to be unique! its untested here
	crypto.randomBytesAsync(16).then(buf => {
		thetoken = buf.toString('hex');
		c("thetoken: " + thetoken);
		knex("users").select().where({email: req.body.email}).then((user) => { 
		c("knex found via email: "); c(user);
		if (!user[0]) {
		  c('Account with that email address does not exist.' );
		  req.flash("errors" , {msg: "No account with that email address was found."})
		  res.redirect("/forgot");
		} else {
			knex("users").where({email: req.body.email}).update({
				passwordResetToken : thetoken,
				passwordResetExpires : Date.now() + 3600000 // 1 hour
			}).catch(err => next(err)).then(() => sendForgotPasswordEmail(req.body.email, thetoken));
		} // else
	  }); // then
	}) // crypto then
	c("random tocken created");
	

  // const setRandomToken = token =>
    // User
      // .findOne({ email: req.body.email })
      // .then((user) => {
        // if (!user) {
          // req.flash('errors', { msg: 'Account with that email address does not exist.' });
        // } else {
          // user.passwordResetToken = token;
          // user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          // user = user.save();
        // }
        // return user;
      // });

  function sendForgotPasswordEmail(email,token) {
    if (!email || !token) { return; }
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });
    const mailOptions = {
      to: email,
      from: 'inky.zima.web@gmail.com',
      subject: 'Reset your password on Hackathon Starter',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    return transporter.sendMail(mailOptions)
      .then(() => {
        req.flash('info', { msg: `An e-mail has been sent to ${email} with further instructions.` });
		res.redirect("/forgot");
      });
  };

  var testuser = {
	passwordResetToken : "asdf",
	email : "inky.zima@gmail.com",
  }
  
  // sendForgotPasswordEmail(testuser)
  // .then(() => res.redirect('/forgot'))
  // .catch(next);

  // createRandomToken
    // .then(setRandomToken)
    // .then(sendForgotPasswordEmail)
    // .then(() => res.redirect('/forgot'))
    // .catch(next);
};

