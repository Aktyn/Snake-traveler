import * as sqlite from 'sqlite3';
import * as fs from 'fs';

const sqlite3 = sqlite.verbose();

export interface ChunkUpdateData {
  x: number;
  y: number;
  foreground: Buffer | null;
  //background: Buffer | null;
}

export default class WorldDatabase {
  private readonly filePath: string;
  private readonly db: sqlite.Database;

  private layerInsertQuery: sqlite.Statement | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.db = new sqlite3.Database(filePath);

    this.init();
  }

  deleteFile(attempt = 0) {
    try {
      //if database is not in use
      fs.unlinkSync(this.filePath);
    } catch (e) {
      if (attempt < 32) {
        setTimeout(() => this.deleteFile(attempt + 1), 10000);
      } else {
        console.error('Cannot delete database file:', e);
      }
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
        PRIMARY KEY("x","y")
      )`);
    });

    this.db.on('error', err => {
      console.error('SQL error:', err);
    });
  }

  async getForegroundLayer(x: number, y: number): Promise<{ foreground: Buffer | null }> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare('SELECT foreground FROM chunks WHERE x=? AND y=? LIMIT 1');
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

  saveLayers(data: ChunkUpdateData[]) {
    try {
      this.layerInsertQuery = this.db.prepare('INSERT OR REPLACE INTO chunks VALUES (?,?,?)');

      for (const chunkData of data) {
        this.layerInsertQuery.run([chunkData.x | 0, chunkData.y | 0, chunkData.foreground], function(err) {
          if (err) {
            console.error(err);
          }
        });
      }

      this.layerInsertQuery.finalize();
    } catch (e) {
      console.error(e);
    }
  }
}
