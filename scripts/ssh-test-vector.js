const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        SELECT 
            to_tsvector('spanish', unaccent('WARM Chaleco acolchado')) as doc_vector,
            websearch_to_tsquery('spanish', unaccent('chaleco')) as query_vector,
            to_tsvector('spanish', unaccent('WARM Chaleco acolchado')) @@ websearch_to_tsquery('spanish', unaccent('chaleco')) as matches,
            word_similarity(unaccent('chaleco'), unaccent('WARM')) as sim1,
            word_similarity(unaccent('chaleco'), unaccent('WARM Chaleco acolchado')) as sim2
    `;
    conn.exec(`sudo -u postgres psql universomerchan -c "${query}"`, (err, stream) => {
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
