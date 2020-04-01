import * as sqlite from 'sqlite3';
import * as path from 'path';

const databaseFile = path.resolve(__dirname, '..', 'data.sqlite3');

const sqlite3 = sqlite.verbose();
// var sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(databaseFile);

/*db.serialize(function() {
  db.run('CREATE TABLE IF NOT EXISTS lorem (info TEXT)');

  const stmt = db.prepare('INSERT INTO lorem VALUES (?)');
  for (var i = 0; i < 3; i++) {
    stmt.run('Ipsum ' + i);
  }
  stmt.finalize();

  db.each('SELECT rowid AS id, info FROM lorem', function(err: Error, row: { id: any; info: string }) {
    console.log(row.id + ': ' + row.info);
  });
});*/

db.close();

export default {
  //TODO
};
