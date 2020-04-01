import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as Worlds from './worlds';
// import './database';

const port = 4000;

const app = express();

app.use(cors());
app.use(bodyParser.json());

const checkParams = (object: { [_: string]: any }, ...params: string[]) => params.every(param => param in object);

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

app.get('/worlds/:worldId/chunk/:x/:y/:size/:biomes', (req, res) => {
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

    const chunk = world.generateChunk(
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

app.listen(port, () => console.log(`Server listening on port: ${port}!`));
