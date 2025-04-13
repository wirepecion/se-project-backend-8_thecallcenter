const nodeMailer = require("nodemailer");

const sendEmail = async (options) => { //can add option object
    const transporter = nodeMailer.createTransport({

        host: process.env.SMPT_HOST,
        port: process.env.SMPT_PORT,
        service: process.env.SMPT_SERVICE,
        secure:true,
        auth: {
            user: process.env.SMPT_MAIL,
            pass: process.env.SMPT_APP_PASS,
        },
    });

    const mailOptions = {
        from: process.env.SMPT_MAIL,
        to: options.to,
        subject: options.subject,
        html: options.message, // use 'html' instead of 'message'
    };

    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;