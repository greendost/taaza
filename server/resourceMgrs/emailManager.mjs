import fs from 'fs';
import nunjucks from 'nunjucks';
import aws from 'aws-sdk';
import logger from './logger.mjs';
import setTheme from '../../common/styles.mjs';

// email templates
var signupTemplate = nunjucks.compile(
  fs.readFileSync('./server/templates/email/signup.njk', 'utf8')
);
var signupAccountExistsTemplate = nunjucks.compile(
  fs.readFileSync('./server/templates/email/signup-account-exists.njk', 'utf8')
);
var passwordResetTemplate = nunjucks.compile(
  fs.readFileSync('./server/templates/email/pwreset.njk', 'utf8')
);

var theme = setTheme('email');

// email types
const emailTypes = {
  signup: {
    sender: 'Taaza <welcome@taaza.app>',
    subject: 'Welcome to Taaza - Please confirm your account',
    body:
      'Welcome to Taaza.  \nIf you did sign up with us, please ignore this email.  \nOtherwise, please go to this url {{ link }} to confirm your account',
    template: signupTemplate
  },
  pwreset: {
    sender: 'Taaza <welcome@taaza.app>',
    subject: 'Taaza - Password reset requested',
    body:
      'Hi, we received a request for a password reset.\nIf not, please ignore this email.\nOtherwise, please click here {{ link }} to reset',
    template: passwordResetTemplate
  },
  'signup-account-exists': {
    sender: 'Taaza <welcome@taaza.app>',
    subject: 'Just confirming your account',
    body:
      'Welcome to Taaza (again).  \nWe noticed you tried signing up just now, perhaps you meant to login?',
    template: signupAccountExistsTemplate
  }
};

var emailMgr = {
  sendEmail(destEmail, emailType, data) {
    const recipient = destEmail;
    const charset = 'UTF-8';
    let ses = new aws.SES();
    var templateData = Object.assign({}, { theme }, data);

    ses.sendEmail(
      {
        Source: emailTypes[emailType].sender,
        Destination: {
          ToAddresses: [recipient]
        },
        Message: {
          Subject: {
            Data: emailTypes[emailType].subject,
            Charset: charset
          },
          Body: {
            Text: {
              Data: nunjucks.renderString(emailTypes[emailType].body, {
                link: templateData.link
              }),
              Charset: charset
            },
            Html: {
              Data: emailTypes[emailType].template.render(templateData),
              Charset: charset
            }
          }
        }
      },
      (err, data) => {
        if (err) {
          logger.error(`error: ${err}`);
        } else {
          logger.info('successfully sent signup email message');
        }
      }
    );
  }
};

export default emailMgr;
