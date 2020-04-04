import * as sqlite from 'sqlite3';
import * as fs from 'fs';

const sqlite3 = sqlite.verbose();

export default class WorldDatabase {
  private readonly filePath: string;
  private readonly db: sqlite.Database;

  private foregroundInsertQuery: sqlite.Statement | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.db = new sqlite3.Database(filePath);

    this.init();
  }

  deleteFile() {
    try {
      fs.unlinkSync(this.filePath);
    } catch (e) {
      console.error(e);
    }
  }

  close() {
    console.log('closing database');
    this.db.close();
  }

  private init() {
    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS chunks (
        x	INTEGER NOT NULL,
        y	INTEGER NOT NULL,
        data	BLOB,
        PRIMARY KEY("x","y")
      )`);

      /*const stmt = this.db.prepare('INSERT INTO lorem VALUES (?)');
      for (let i = 0; i < 3; i++) {
        stmt.run('Ipsum ' + i);
      }
      stmt.finalize();*/

      /*this.db.each('SELECT rowid AS id, info FROM lorem', function(err: Error, row: { id: any; info: string }) {
        console.log(row.id + ': ' + row.info);
      });*/
      /*this.db.get('SELECT * FROM chunks WHERE x=0 AND y=2 LIMIT 1', function(err, row) {
        console.log(err, this, row);
      });*/

      /*const stmt = this.db.prepare('SELECT * FROM chunks WHERE x=? AND y=? LIMIT 1');
      stmt.get([0, 0], function(err, row) {
        console.log(err, row);
      })*/
    });

    this.db.on('error', err => {
      console.error('SQL error:', err);
    });
  }

  async getForegroundLayer(x: number, y: number): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('SELECT data FROM chunks WHERE x=? AND y=? LIMIT 1');
      stmt.get([x, y], function(err: Error, row: any) {
        if (err) {
          reject(err);
        } else {
          resolve(row?.data || null);
        }
        stmt.finalize();
      });
    });
  }

  saveForegroundLayer(x: number, y: number, data: Buffer | null) {
    try {
      this.foregroundInsertQuery = this.db.prepare('INSERT OR REPLACE INTO chunks VALUES (?,?,?)');
      this.foregroundInsertQuery.run([x | 0, y | 0, data], function(err: Error) {});

      this.foregroundInsertQuery.finalize(); //TODO: delay finalization to handle multiple save requests
    } catch (e) {
      console.error(e);
    }
  }
}
