const fs = require('fs');
const nodemailer = require("nodemailer");
const AES = require('crypto-js/aes');
const Utf8 = require('crypto-js/enc-utf8');

module.exports = {
    getFileNamesInDir: function (dir, callback) {
        fs.readdir(dir, function (err, files) {
            callback(files);
        });
    },
    sendEmailAsync: async function (fromName, fromEmail, fromPassword, recipients, message, subject, html = null) {
        try {
            // default SMTP transport
            let transporter = nodemailer.createTransport({
                host: 'smtpout.secureserver.net',
                secure: true,
                port: 465,
                auth: {
                    user: fromEmail,
                    pass: fromPassword
                }
            });

            let info = await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: recipients,
                subject: subject,
                text: message,
                html: html ? html : message
            });
            
            if(info.accepted && info.accepted.length > 0){
                return "success";
            } else {
                return "email didn't send";
            }
        }
        catch (e) {
            console.log(e.message);
            return e.message;
        }
    },
    encrypt: function(text, phrase) {
        return AES.encrypt(text, phrase).toString();
    },
    decrypt: function(encryptedText, phrase) {
        return AES.decrypt(encryptedText, phrase).toString(Utf8);
    }
};
