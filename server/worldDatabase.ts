import * as sqlite from 'sqlite3';
import * as fs from 'fs';

const sqlite3 = sqlite.verbose();

export default class WorldDatabase {
  private readonly filePath: string;
  private readonly db: sqlite.Database;

  private layersInsertQuery: sqlite.Statement | null = null;

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
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        foreground BLOB,
        background BLOB,
        PRIMARY KEY("x","y")
      )`);
    });

    this.db.on('error', err => {
      console.error('SQL error:', err);
    });
  }

  async getForegroundLayer(x: number, y: number): Promise<{ foreground: Buffer | null; background: Buffer | null }> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('SELECT foreground, background FROM chunks WHERE x=? AND y=? LIMIT 1');
      stmt.get([x, y], function(err: Error, row: any) {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
        stmt.finalize();
      });
    });
  }

  saveLayers(x: number, y: number, foreground: Buffer | null, background: Buffer | null) {
    setTimeout(() => {
      try {
        if (background) {
          this.layersInsertQuery = this.db.prepare('INSERT OR REPLACE INTO chunks VALUES (?,?,?,?)');
          this.layersInsertQuery.run([x | 0, y | 0, foreground, background], function(err) {
            if (err) {
              console.error(err);
            }
          });
        } else {
          this.layersInsertQuery = this.db.prepare(
            'INSERT OR REPLACE INTO chunks VALUES ($x,$y,$foreground, (SELECT background from chunks as ch2 WHERE ch2.x=$x AND ch2.y=$y))'
          );
          this.layersInsertQuery.run(
            {
              $x: x | 0,
              $y: y | 0,
              $foreground: foreground
            },
            function(err) {
              if (err) {
                console.error(err);
              }
            }
          );
        }

        this.layersInsertQuery.finalize(); //TODO: delay finalization to handle multiple save requests
      } catch (e) {
        console.error(e);
      }
    }, 1);
  }
}
