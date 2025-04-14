const nodemailer = require('nodemailer');

// Get the current date and time
let currentDate = new Date(Date.now());
// Format it into a readable string 
let formattedDate = currentDate.toLocaleString();

// transportation configuration
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
exports.sendNewPayment = (userEmail,userName,bookingId) =>{
const mailOptions = {
    from: process.env.SMPT_MAIL,
                to: userEmail,
                subject: "[No-reply] New Payment",
                html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); max-width: 600px; margin: 0 auto;">
        <h2 style="color:rgb(30, 203, 36);">Thank You for Your Purchase!</h2>

        <p>Dear <strong>${userName}</strong>,</p>

        <p>Date and Time of Payment <strong>${formattedDate}</strong>,</p>
        <p>We’ve successfully received your payment for <strong>BookingID : ${bookingId}</strong>. Thank you so much for your payment! Your booking is now being processed, 
        Please note that your booking is still pending approval from our system.</p>
        <p>Thank you for choosing <strong>The TCC Hotel Booking Team</strong>. We truly appreciate and look forward to delivering an exceptional experience.</p>
        <div style="margin-top: 20px; font-size: 14px; color: #777;">
            <p>Best regards,</p>
            <p><strong>The TCC Hotel Booking Team</strong><br>
        </div>
    </div>
</div>
`
}
transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.error("Eror :", error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});
};

