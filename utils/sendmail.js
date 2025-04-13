const nodemailer = require('nodemailer');
exports.sendEmail = (mailOptions) =>{
const transporter = nodemailer.createTransport({
    host: process.env.SMPT_HOST,
    port: process.env.SMPT_PORT,
    service: process.env.SMPT_SERVICE,
    secure: true,
    auth: {
        user: process.env.SMPT_MAIL,
        pass: process.env.SMPT_APP_PASS,
    }
});

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.error("Eror :", error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
};

