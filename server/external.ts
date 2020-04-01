import * as fs from 'fs';
import * as path from 'path';

export const dataFolder = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataFolder)) {
  console.log('Creating directory for external data');
  fs.mkdirSync(dataFolder);
}
