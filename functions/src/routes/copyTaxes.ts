import { taxesCollection } from '@idemand/common';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// Custom email verification for emails generated in blocking function
app.get('/', async (req: Request, res: Response) => {
  const db = getFirestore();
  const oldTaxesColRef = taxesCollection(db);
  const newTaxesColRef = db.collection('taxes');
  try {
    const taxesSnap = await oldTaxesColRef.get();
    const batch = db.batch();
    taxesSnap.docs.map((snap) => {
      const newTaxRef = newTaxesColRef.doc(snap.id);
      console.log(snap.data());
      batch.set(newTaxRef, { ...snap.data() });
    });
    await batch.commit();
    res.status(201).send({ status: 'success' });
    return;
  } catch (err: unknown) {
    error('error moving taxes to "taxes" collection');
    res.status(500).send({ status: 'error' });
    return;
  }
});

export default app;
