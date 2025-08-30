//File: services/emailService.js

const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("../config/ses");

const sendVerificationEmail = async (userEmail, userName, verificationToken) => {
    const verificationLink = `${process.env.FRONTEND_URL}/verify?token=${verificationToken}`;
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email - Jubili</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Jubili!</h1>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
                <h2 style="color: #333; margin-bottom: 20px;">Hi ${userName}!</h2>
                
                <p style="font-size: 16px; margin-bottom: 20px;">
                    Thank you for signing up with Jubili. To complete your registration and start shopping, 
                    please verify your email address by clicking the button below.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 15px 30px; 
                              text-decoration: none; 
                              border-radius: 25px; 
                              font-weight: bold; 
                              font-size: 16px;
                              display: inline-block;
                              transition: transform 0.2s;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    <strong>Important:</strong> This verification link will expire in 10 minutes for security reasons.
                </p>
                
                <p style="font-size: 14px; color: #666;">
                    If you didn't create an account with Jubili, please ignore this email.
                </p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    This is an automated email from Jubili. Please do not reply to this email.
                    <br>
                    If you have any questions, contact us at support@jubili.in
                </p>
            </div>
        </body>
        </html>
    `;

    const textContent = `
        Welcome to Jubili!
        
        Hi ${userName}!
        
        Thank you for signing up with Jubili. To complete your registration, please verify your email address by clicking the link below:
        
        ${verificationLink}
        
        Important: This verification link will expire in 10 minutes for security reasons.
        
        If you didn't create an account with Jubili, please ignore this email.
        
        ---
        This is an automated email from Jubili. Please do not reply.
        For support, contact us at support@jubili.in
    `;

    const params = {
        Source: "noreply@jubili.in",
        Destination: {
            ToAddresses: [userEmail],
        },
        Message: {
            Subject: {
                Data: "Verify Your Email Address - Jubili",
                Charset: "UTF-8",
            },
            Body: {
                Html: {
                    Data: htmlContent,
                    Charset: "UTF-8",
                },
                Text: {
                    Data: textContent,
                    Charset: "UTF-8",
                },
            },
        },
    };

    try {
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        console.log("Verification email sent successfully:", result.MessageId);
        return result;
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

module.exports = { sendVerificationEmail };