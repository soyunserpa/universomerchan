const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        CREATE TABLE IF NOT EXISTS "traffic_sessions" (
            "id" serial PRIMARY KEY NOT NULL,
            "session_id" varchar(100) NOT NULL,
            "source" varchar(100) NOT NULL,
            "medium" varchar(100),
            "campaign" varchar(200),
            "device_type" varchar(50),
            "url" text,
            "created_at" timestamp DEFAULT now() NOT NULL,
            CONSTRAINT "traffic_sessions_session_id_unique" UNIQUE("session_id")
        );
        CREATE INDEX IF NOT EXISTS "traffic_sessions_source_idx" ON "traffic_sessions" ("source");
        CREATE INDEX IF NOT EXISTS "traffic_sessions_created_at_idx" ON "traffic_sessions" ("created_at");
    `;
    conn.exec(`sudo -u postgres psql universomerchan -c '${query}'`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.log('Connection error:', err);
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: '***REMOVED***'
});
