import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as multer from 'multer';
import * as path from 'path';
import * as Worlds from './worlds';
import { ChunkUpdateData } from './worldDatabase';

const port = 4000;
const MAX_BATCH_SIZE = 32;

const app = express();

app.use(cors());
app.use(bodyParser.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const chunkUpload = upload.fields([
  { name: 'data', maxCount: 1 },
  { name: 'foreground', maxCount: MAX_BATCH_SIZE }
  //{ name: 'background', maxCount: MAX_BATCH_SIZE }
]);

const checkParams = (object?: { [_: string]: any }, ...params: string[]) =>
  !!object && params.every(param => param in object);

app.get('/ping', (_, res) => {
  res.send('pong');
});

app.get('/worlds', (_, res) => {
  res.json(Worlds.getList());
});

app.post('/worlds', (req, res) => {
  if (!checkParams(req.body, 'name', 'seed')) {
    res.status(422).send('Incorrect request parameters');
    return;
  }
  res.json(Worlds.addWorld(req.body.name, req.body.seed).getSchema());
});

app.delete('/worlds/:worldId', (req, res) => {
  if (!checkParams(req.params, 'worldId')) {
    res.status(422).send('Incorrect request parameters');
    return;
  }
  try {
    Worlds.deleteWorld(req.params.worldId);
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.post('/worlds/:worldId/reset', (req, res) => {
  if (!checkParams(req.params, 'worldId')) {
    res.status(422).send('Incorrect request parameters');
    return;
  }
  try {
    const world = Worlds.getWorld(req.params.worldId);
    if (!world) {
      res.status(404).send('World with given id does not exists: ' + req.params.worldId);
      return;
    }
    world.resetProgress();
    res.json(world.getSchema());
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.get('/worlds/:worldId/chunks/:x/:y/:size/:biomes', async (req, res) => {
  if (!checkParams(req.params, 'worldId', 'x', 'y', 'size', 'biomes')) {
    res.status(422).send('Incorrect request parameters');
    return;
  }
  try {
    const world = Worlds.getWorld(req.params.worldId);
    if (!world) {
      res.status(404).send('World with given id does not exists: ' + req.params.worldId);
      return;
    }

    const chunk = await world.getChunk(
      parseInt(req.params.x),
      parseInt(req.params.y),
      parseInt(req.params.size),
      parseInt(req.params.biomes)
    );
    res.status(200).send(chunk);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.put('/worlds/chunks', chunkUpload, (req, res) => {
  if (!checkParams(req.body, 'data')) {
    res.status(422).send('Incorrect request parameters');
    return;
  }

  try {
    const data: { worldId: string; chunksPos: { x: number; y: number }[] } = JSON.parse(req.body.data);

    const world = Worlds.getWorld(data.worldId);
    if (!world) {
      res.status(404).send('World with given id does not exists: ' + data.worldId);
      return;
    }

    const chunksUpdateData = data.chunksPos.map(
      ({ x, y }, index) =>
        ({
          x,
          y,
          foreground: (req.files as any).foreground[index].buffer || null
        } as ChunkUpdateData)
    );

    world.update(chunksUpdateData);

    res.json({ success: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.patch('/worlds/:worldId/playerPos', (req, res) => {
  if (!checkParams(req.params, 'worldId') || !checkParams(req.body, 'data')) {
    res.status(422).send('Incorrect request parameters');
    return;
  }

  try {
    const world = Worlds.getWorld(req.params.worldId);
    if (!world) {
      res.status(404).send('World with given id does not exists: ' + req.params.worldId);
      return;
    }

    world.updateData(req.body.data);
    res.json({ success: true });
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(port, () => console.log(`Server listening on port: ${port}!`));

app.use(express.static(path.join(__dirname, '..', 'build')));
