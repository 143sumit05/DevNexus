
const {
    SESClient,
    SendEmailCommand
} = require("@aws-sdk/client-ses");

const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const sendWelcomeEmail = async (recipientEmail, firstName) => {
    const params = {
        Source: process.env.SES_FROM_EMAIL,

        Destination: {
            ToAddresses: [recipientEmail]
        },

        Message: {
            Subject: {
                Data: "Welcome to NeXora!"
            },
            Body: {
                Text: {
                    Data: `Hi ${firstName},

Thanks for registering with NeXora!

Your account has been successfully created.

Happy exploring!
Team NeXora`
                }
            }
        }
    };

    return await ses.send(new SendEmailCommand(params));
};

module.exports = sendWelcomeEmail;
