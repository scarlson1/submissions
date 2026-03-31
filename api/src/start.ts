import cors from 'cors';
import express, { Request, Response } from 'express';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { AddressInfo } from 'net';
import { NotFoundError } from './errors/index.js';
import { errorHandler, morganMiddleware } from './middlewares/index.js';
import {
  licenseRouter,
  listStatesRouter,
  moratoriumRouter,
  stateTaxRouter,
} from './routes/index.js';
import logger from './utils/logger.js';

// https://kentcdodds.com/blog/how-i-structure-express-apps
// see above for integrations test example

// const allowedOrigins = ['http://localhost:3000'];
const options: cors.CorsOptions = {
  origin: true, // allowedOrigins,
};

export function startServer({
  port = process.env.PORT || 8080,
}: {
  port?: string | number;
}) {
  const app = express();

  app.use(cors(options));
  app.use(express.json());
  app.use(morganMiddleware);

  // app.use('/api', getRoutes());
  app.use('/api', stateTaxRouter);
  app.use('/api', listStatesRouter);
  app.use('/api', moratoriumRouter);
  app.use('/api', licenseRouter);

  // TODO: delete - for testing rewrites
  const router = express.Router();
  router.get('/ping', (req: Request, res: Response) => {
    res.status(200).send({ response: 'bar' });
  });
  app.use('/api', router);

  app.all('*', (req: Request, res: Response) => {
    throw new NotFoundError('Route not found');
  });

  app.use(errorHandler);

  // Prefer dealing with promises. It makes testing easier, among other things.
  // This block allows starting the app and resolve the promise with the express server
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.info(
        `Listening on port ${(server.address() as AddressInfo)?.port}`,
      );

      // this block of code turns `server.close` into a promise API
      const originalClose = server.close.bind(server);
      // @ts-ignore
      server.close = (
        callback?: ((err?: Error | undefined) => void) | undefined,
      ) => {
        return new Promise<
          Server<typeof IncomingMessage, typeof ServerResponse>
        >((resolveClose) => {
          // @ts-ignore
          originalClose(resolveClose);
        });
      };

      // this ensures that we properly close the server when the program exists
      setupCloseOnExit(server);

      // resolve the whole promise with the express server
      resolve(server);
    });
  });
}

// ensures we close the server in the event of an error.
function setupCloseOnExit(
  server: Server<typeof IncomingMessage, typeof ServerResponse>,
) {
  // thank you stack overflow
  // https://stackoverflow.com/a/14032965/971592
  async function exitHandler(options: { exit?: boolean } = {}) {
    try {
      await server.close();
      logger.info('Server successfully closed');
    } catch (err: any) {
      logger.warn('Something went wrong closing the server', err.stack);
    }
    // await server
    //   .close()
    //   .then(() => {
    //     logger.info('Server successfully closed');
    //   })
    //   .catch((e: any) => {
    //     logger.warn('Something went wrong closing the server', e.stack);
    //   });

    if (options.exit) process.exit();
  }

  // do something when app is closing
  process.on('exit', exitHandler);

  // catches ctrl+c event
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
}
