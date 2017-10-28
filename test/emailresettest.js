const bluebird = require('bluebird');
const crypto = bluebird.promisifyAll(require('crypto'));
var sqliteconfig = {
  dialect: 'sqlite3',
  connection: { filename: './main.db'}
};
// TODO knex necessary in this file?
var knex = require('knex')(sqliteconfig);

const c = console.log;

var req = {};
req.body.email = "inky.zima@gmail.com";
 
 const createRandomToken = crypto
    .randomBytesAsync(16)
    .then(buf => buf.toString('hex'));

  const setRandomToken = token =>
  knex("users").select().where({email: req.body.email})
      .then((user) => {
        if (!user) {
          c('Account with that email address does not exist.' );
        } else {
			knex("users").where({email: req.body.email}).update({
				"passwordResetToken" : token,
				passwordResetExpires = Date.now() + 3600000; // 1 hour
			})
          user.passwordResetToken = token;
          user.passwordResetExpires = Date.now() + 3600000; // 1 hour
          user = user.save();
        } // else
        return user;
      }); // then

  const sendForgotPasswordEmail = (user) => {
    if (!user) { return; }
    const token = user.passwordResetToken;
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
      subject: 'Reset your password on Hackathon Starter',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://${req.headers.host}/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    return transporter.sendMail(mailOptions)
      .then(() => {
        req.flash('info', { msg: `An e-mail has been sent to ${user.email} with further instructions.` });
      });
  };

  createRandomToken
    .then(setRandomToken)
    .then(sendForgotPasswordEmail)
    .then(() => res.redirect('/forgot'))
    .catch(next);


