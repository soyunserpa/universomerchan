const { Client } = require('ssh2');
const conn = new Client();
const propertyId = "487160166";
const clientEmail = "universo-analytics@project-812ca632-367d-40bf-b19.iam.gserviceaccount.com";
const privateKey = "-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDW3XGnakAcppXs\\neQ6cXted5m9lWLFRFfoaBsSwpyIyTPWhgCeabCKex10M9ltFvl9whn5A52JVzw+U\\n2GXUp8cRc2U1K/iiximhxc3aDWhXOe83ZZNK93FYaxFXbwBS5m1rR2NKrTPJoMjS\\nOO6FHwxcbDl6aAGReOJz2Zk1ylWZ1Yku4GNI61ANoFeio0MoOKBJIXm6ejNhxh3i\\nlzkYSymIvbBo0dhSln2p3q2lZn4aHXInjGv3M8oj6TovYlZWWrdAdXX9dRVB9g18\\nirliHkgu4UQPWrHwfwMKBenFa7WdK7gluRj/DtOFszliNwp3z34AeN1iPoNa59Kc\\nPvqA9F+ZAgMBAAECggEAHsp10BJXhQORC+XpOcVpoWogCpD5kBorJhxUMXsyA61T\\nAfArPLjvA9FOvLMihKMcat611w08N/nH94JEotiMRtbs6QAXzb5swY8RdIRkBc6l\\nQPYLHpIefxeQ0PZ06xcJv8w80WXIEcaQdiJ3I+09cz0wcMyDdQUIG/v8iwsngIzS\\n9LmMGfPPdmNwic1cG0Q6B38jzTycsMkrYZUjLCBEwROy36aYRoSsGu4Ep/CDIspk\\nw7VaOwW+b87OxRNE/RrxVEq0leO5arZDjetiaR6xMI4jkzMYI8SIrdro6bRSgIBt\\nT1d5FQ44oqvchYxWMzTpmM1sulq2XvGEdHHhgGyKhQKBgQD3PlbY2CiPkbqbRAlF\\nDQ/CIney2+9RBuyoLipGALqp4fMU6zfBe5CmKHg4bhw+N7zWa0PrXm1SIJ8TBmQR\\na/T6i0mf7YXrAzYPJmVcIBekFAuSSNvOXprT0uFaVWReJbaon0TnwTXxvVxKuiqj\\nDT01QRmiNuLurqmW4QLMrMQaFwKBgQDeeYqeIB1+A5LBNwQsxfNTGKXaRFKNc/Cd\\nmXGpsAaX8oVDi88QIZ7xeafQ8OVKzCgWQiLQooQnvZVxS+tEu5Z9f6Tt+Dq1E9O2\\nTBI4U9TzMTtmfPGgrpgTkKI1c1ta3Evg7ddRox8P5bXbtbxmHs8Hp1RlKYBSvp5A\\nzWzhvi5RzwKBgQCOvjoL1biNMximfcBQUnsvnRC4fcwMXtARRR347oDWhfH+uNKm\\n7T0VATZvdfruXOW0cZdz8z9wdA8DP+RUPpzgbbxjDhIMHf1+/67zYj/j5gLMQS5O\\nVkZTV2Pt8HES/fkYH2P73YvUdnwrVJI7MvCMp3oyMjgQj1ywFFa2bmSFnwKBgDvE\\n/YfD6wh630eHh1icCeYuPgioyGD2YBOHMPE8uFjEMCdYfVXBIpmPbJWG0qNIvBBW\\nzlGtB8JBfc/FbLy3hRPMYjwIr4UMgZl9UHvPkeuQM3wyXxwjK/o9pkaj6kw72Srh\\n2zI0l9jGhxgy+B2bc1WED/lpr+8LBSs1xWXUmU8jAoGBAPP154OHlRKg2zEIAiSf\\n0igsveGbR22GwirZfN8Cktv493sudKxvr9fUARMruugqoXKUMwmjqQmjWBPcz/ke\\nHzgHCVAb51Ybkx9LKYIAbC6OVjrHpx1zCvCRWiNNmC0FPmynKf9jLRrGetGmSn9M\\nZ2Fp9eYM+GhIs3rc5Xbc57Uq\\n-----END PRIVATE KEY-----\\n";

conn.on('ready', () => {
    // Delete the previous botched appended lines:
    conn.exec('sed -i "/# Google Analytics API/,$d" /var/www/universomerchan/.env', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.exec(`cat << 'INNEREOF' >> /var/www/universomerchan/.env\n\n# Google Analytics API\nGA_PROPERTY_ID=${propertyId}\nGA_CLIENT_EMAIL=${clientEmail}\nGA_PRIVATE_KEY="${privateKey}"\nINNEREOF\n`, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('close', () => {
                    console.log('Fixed .env. Restarting pm2...');
                    conn.exec('pm2 restart universo-tienda', (err3, stream3) => {
                        if (err3) throw err3;
                        stream3.on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
