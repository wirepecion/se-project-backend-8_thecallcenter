const nodeMailer = require("nodemailer");
// Get the current date and time
let currentDate = new Date(Date.now());
// Format it into a readable string 
let formattedDate = currentDate.toLocaleString();

// transportation configuration
const transporter = nodeMailer.createTransport({
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

exports.sendRefund = (email, userName, bookingId, refundAmount) =>{
    const mailOptions = {
        from: process.env.SMPT_MAIL,
                    to: email,
                    subject: "🔔 Your refund has been confirmed!",
                    html: `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #2c3e50;">📄 Refund Details</h2>
                
                            <p><strong>Customer Name:</strong> ${userName}</p>
                            <p><strong>Booking ID:</strong> ${bookingId}</p>
                            <p><strong>Date ane Time:</strong> ${formattedDate}</p>
                
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                
                            <p>
                                Your Refund amount :<strong> ${refundAmount} </strong>
                            </p>
                            <p>
                                If you have any questions, please contact our support team at <a href="tel:1112">1112</a>.
                            </p>
                
                            <p style="margin-top: 30px;">Thank you,<br>The TCC Hotel Booking Team</p>
                        </div>`
    }
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.error("Eror :", error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};


exports.sendTOHotelManager = (hotelEmail,userName,bookingId,prevStatus,nowStatus,adminId) =>{
    const mailOptions = {
        from: process.env.SMPT_MAIL,
                    to: hotelEmail,
                    subject: "🔔 Payment Status Updated by Admin",
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #2c3e50;">📄 Payment Status Update</h2>
                
                            <p><strong>Customer Name:</strong> ${userName}</p>
                            <p><strong>Booking ID:</strong> ${bookingId}</p>
                            <p><strong>Date ane Time:</strong> ${formattedDate}</p>
                            <p>
                                <strong>Previous Status:</strong>
                                <span style="color: #e74c3c;">${prevStatus}</span>
                            </p>
                            <p>
                                <strong>Current Status:</strong>
                                <span style="color: #27ae60;">${nowStatus}</span>
                            </p>
                
                            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
                
                            <p>
                                This update was made by <strong>Admin ID:</strong> ${adminId}
                            </p>
                            <p>
                                If you have any questions, please contact our support team at <a href="tel:1112">1112</a>.
                            </p>
                
                            <p style="margin-top: 30px;">Thank you,<br>The TCC Hotel Booking Team</p>
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