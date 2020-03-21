import * as express from 'express';
import * as cors from 'cors';
import Generator from './generator';
import './database';

const port = 4000;

const app = express();

app.use(cors());

app.get('/chunk/:x/:y/:size/:biomes', (req, res) => {
  if (!('x' in req.params && 'y' in req.params && 'size' in req.params && 'biomes' in req.params)) {
    res.status(501).send('Incorrect request parameters');
    return;
  }
  try {
    const chunk = Generator.generateChunk(
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
