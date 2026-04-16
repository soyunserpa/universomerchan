const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Escaping the token and using regex to fix the v/V discrepancy seen in images vs text
    let fixedStr = "AQVKJHK2maZxHnWLxerx0DCIxT9GChhatJ-yCxXwlwVQrzXhB3vp3jZ8iVtkCEjCHH9KadEoeBa8t7r-enT60Vi0SG36z3k-EPS3Lh1_I9S63CyWVmbv7323VqQCtJHzNQXgK1BIP6IfHQUxsmwWoTIS9cLSD8Q-jKPCcYKJ-i8raR5PMdR7MnSCvb6CSsD-vBiLZ0OIvyFbN4n2po2u0bjMIHTz6hwjf4U5m_D94CkBewOTm6Rk4KVO55UyPxT06juVVkyMsdOdklzqb-F4mWWAMkbHYJ0lsR1L2MIPtyA9plhKoHvTatsQSZZq6-LG8PQW7Mg_fzOoQDh3Q35CLmjPZGTPjA";
    
    conn.exec(`sed -i "s/^LINKEDIN_ACCESS_TOKEN=.*/LINKEDIN_ACCESS_TOKEN=${fixedStr}/g" /var/www/universomerchan/.env && cd /var/www/universomerchan && pm2 reload all`, (err, stream) => {
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
