import cors from 'cors';
import express, { Request, Response } from 'express';

const app = express();

app.use(cors({ origin: true }));
// parse req.body as a Buffer (or use req.rawBody)
// app.use(bodyParser.raw({ type: 'application/json'}))
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
