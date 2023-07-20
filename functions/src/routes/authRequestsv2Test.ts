import express, { Request, Response } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';

const app = express();

app.use(cors({ origin: true }));
// parse req.body as a Buffer (or use req.rawBody)
// app.use(bodyParser.raw({ type: 'application/json'}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const router = express.Router({ strict: false }); // eslint-disable-line

// app.get('/', async (req: Request, res: Response) => {
//   res.status(200).send('hi there (index route)');
// });

// app.get('/test', async (req: Request, res: Response) => {
//   res.status(200).send('hi there');
// });

router.get('/', async (req: Request, res: Response) => {
  res.status(200).send('hi there (index route)');
});

router.get('/test', async (req: Request, res: Response) => {
  res.status(200).send('hi there');
});

app.use('/auth-api-test', router);

export default app;
