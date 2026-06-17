const fs = require('fs');
const https = require('https');

https.get('https://rocketdesigners.com/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    fs.writeFileSync('rocket.html', data);
    console.log('saved HTML');
  });
});
