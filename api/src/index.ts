import cors from 'cors';
import express, { Request, Response } from 'express';
import 'express-async-errors';
import { applicationDefault, initializeApp } from 'firebase-admin/app';

import { NotFoundError } from './errors/index.js';
import { errorHandler, morganMiddleware } from './middlewares/index.js';
import {
  licenseRouter,
  listStatesRouter,
  moratoriumRouter,
  stateTaxRouter,
} from './routes/index.js';

// TODO: connect login to google Logger (set up with morgan ??)
// https://levelup.gitconnected.com/better-logs-for-expressjs-using-winston-and-morgan-with-typescript-1c31c1ab9342

// TODO: check for env vars at start up ??

initializeApp({
  credential: applicationDefault(),
});

const app = express();

// const allowedOrigins = ['http://localhost:3000'];
const options: cors.CorsOptions = {
  origin: true, //allowedOrigins,
};

app.use(cors(options));
app.use(express.json());
app.use(morganMiddleware);

app.get('/ping', (req: Request, res: Response) => {
  res.status(200).send('pong');
});

app.use(stateTaxRouter);
app.use(listStatesRouter);
app.use(moratoriumRouter);
app.use(licenseRouter);

// abandoned protosure integration
// app.use(updateQuoteRouter);
// app.use(calcPremiumRouter);
// app.use(propertyDataRouter);

// TEST FOR FIREBASE REWRITES (DELETE)
const router = express.Router();

router.post('/ping', async (req: Request, res: Response) => {
  res.status(200).send({ answer: 'pong' });
});

app.use('/idemand-submissions-api', router);

app.all('*', (req: Request, res: Response) => {
  console.log('REQ: ', req);
  throw new NotFoundError('Route not found');
});

app.use(errorHandler);
// Docs "Starting with Express 5, route handlers and middleware that return a Promise will call next(value) automatically when they reject or throw an error"
// wont need to pass to next(err) - replaces 'express-async-errors'

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
