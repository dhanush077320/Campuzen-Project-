const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/users',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const users = JSON.parse(data);
            const shambu = users.find(u => u.username === 'Shambu_123');
            if (shambu) {
                console.log(`Found Shambu_123 with ID: ${shambu._id}. Deleting...`);
                const deleteReq = http.request({
                    hostname: 'localhost',
                    port: 5000,
                    path: `/api/users/${shambu._id}`,
                    method: 'DELETE'
                }, (deleteRes) => {
                    if (deleteRes.statusCode === 200) {
                        console.log('Successfully deleted Shambu_123');
                    } else {
                        console.log(`Failed to delete. Status: ${deleteRes.statusCode}`);
                    }
                });
                deleteReq.end();
            } else {
                console.log('Shambu_123 not found.');
            }
        } catch (e) {
            console.error('Error parsing users:', e);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
