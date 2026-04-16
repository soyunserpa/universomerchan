const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const newToken = "AQXCizt9s5m5C7S7GV9HG0vzw1tekqYmbmIGRYueaE89v6pNwaVqPEvEA-za2b9tzaegFpO6ryzoEL89SFnVpsePWd5CCFZQC7KctkL0AIchS5nVgLBgrrdM5tstY8cfjfNVW6_gLw9bycQutkQxk5oGvrB5aJsQaCjCtgkHA8yg16tszZPwlNHpBxCYAS7JK6wUNx41bgiFPpuFKbmVSxKB2lEpW1KFwpXzY9Q-sPnRiB4oD_CU9JafIh5bnIVPs3z2Mn7MAjcweNGjvmXNhCE_JUfyM5VK8yOIVhnZe4OZxS6OWzZePLmEbEWgom8i8Bh25LBR8S85ggQqfJx7YfFFo0oaQA";
    
    // update .env inline and preserve quotes
    conn.exec(`sed -i 's/^LINKEDIN_ACCESS_TOKEN=.*/LINKEDIN_ACCESS_TOKEN="${newToken}"/g' /var/www/universomerchan/.env && cd /var/www/universomerchan && pm2 reload all`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6'
});
