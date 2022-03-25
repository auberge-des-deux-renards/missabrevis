import fs from 'fs/promises';

fs.readFile('kaamelott.json', {encoding: 'UTF-8'}).then(data => {
  console.log(JSON.parse(data).seasons[3].episodes);
});
