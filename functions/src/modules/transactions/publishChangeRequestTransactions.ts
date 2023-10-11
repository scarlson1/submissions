import { isValid } from 'date-fns';
import { getFirestore } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import {
  CancellationReason,
  CancellationRequest,
  ChangeRequest,
  PolicyChangeRequest,
  getReportErrorFn,
  policiesCollection,
  printObj,
} from '../../common/index.js';
import { getDoc } from '../../routes/utils/index.js';
import {
  publishAmendment,
  publishEndorsement,
  publishLocationCancel,
} from '../../services/pubsub/index.js';

const reportErr = getReportErrorFn('policyChangeRequest.publishChangeRequestTransactions');

export function isPolicyChangeRequest(data: any): data is PolicyChangeRequest {
  const keys = Object.keys(data);
  return keys.includes('endorsementChanges') || keys.includes('amendmentChanges');
}

export function isCancellationRequest(data: any): data is CancellationRequest {
  const keys = Object.keys(data);
  return keys.includes('cancellationChanges');
}

// Emit pubsub event
export async function publishChangeRequestTransactions(data: ChangeRequest, policyId: string) {
  try {
    // TODO: status check sufficient ?? what if there was an error and requires re-emitting ??
    // need to update change request for each trx to show published trx status ??
    // verify(data.trxPubSubEmitted !== true, 'trx pubsub event has already been emitted for change request.)
    // TODO: matching firestore rule

    // redundant ?? calling function if status matches accepted
    // const UNPROCESSED_CHANGE_REQUEST_STATUSES = [
    //   CHANGE_REQUEST_STATUS.SUBMITTED,
    //   CHANGE_REQUEST_STATUS.ERROR,
    //   CHANGE_REQUEST_STATUS.UNDER_REVIEW,
    // ];
    // const notProcessed = UNPROCESSED_CHANGE_REQUEST_STATUSES.includes(
    //   data.status as CHANGE_REQUEST_STATUS
    // );

    // verify(
    //   !notProcessed,
    //   `Change request was already processed (status did not match: ${UNPROCESSED_CHANGE_REQUEST_STATUSES.join(
    //     ', '
    //   )})`
    // );

    // TODO: handle new location
    // different from publishEndorsement ??
    // should be same as location ??
    if (data.scope === 'add_location') {
      throw new Error('add location publisher not set up yet');
    }

    // TODO: save pub/sub data to change request

    // TEMP (transition to new interface) - if new endorsement/amendment interface --> intercept
    if (isPolicyChangeRequest(data)) {
      const { endorsementChanges, amendmentChanges, requestEffDate } = data;

      const effDateMS = requestEffDate.toMillis();
      if (!requestEffDate || !isValid(effDateMS)) throw new Error(`invalid request effective date`);

      const endorsementsLcnIds = Object.keys(endorsementChanges);
      for (let lcnId of endorsementsLcnIds) {
        const msgDetails = await publishEndorsement({
          policyId,
          locationId: lcnId,
          effDateMS,
        });
        // TODO: save msgDetails to change request (can event ID be returned from publisher ?? if yes, could construct transaction ID from policyId + locationId + eventId)
        printObj(msgDetails);
      }

      const amendmentLcnIds = Object.keys(amendmentChanges);
      for (let lcnId of amendmentLcnIds) {
        const msgDetails = await publishAmendment({
          policyId,
          locationId: lcnId,
          // amendmentScope: 'location',
          effDateMS,
        });

        printObj(msgDetails);
      }

      return;
    }

    if (isCancellationRequest(data)) {
      const locationIds = Object.keys(data.cancellationChanges);

      for (let lcnId of locationIds) {
        await publishLocationCancel({
          policyId,
          locationId: lcnId, // TODO: fix discriminating union types
          cancelReason: data.cancelReason || ('' as CancellationReason),
          cancelEffDateMS: data.requestEffDate.toMillis(),
        });
      }

      return;
    }

    // TODO: delete ?? (old schema)
    if (data.scope === 'location') {
      switch (data.trxType) {
        case 'endorsement':
          const msgDetails = await publishEndorsement({
            policyId,
            locationId: data.locationId,
            effDateMS: data.requestEffDate.toMillis(),
          });
          // TODO: save msgDetails to change request (can event ID be returned from publisher ?? if yes, could construct transaction ID from policyId + locationId + eventId)
          printObj(msgDetails);

          break;
        case 'amendment':
          await publishAmendment({
            policyId,
            locationId: data.locationId,
            // amendmentScope: 'location',
            effDateMS: data.requestEffDate.toMillis(),
          });
          break;
        case 'cancellation':
          await publishLocationCancel({
            policyId,
            locationId: data.locationId, // TODO: fix discriminating union types
            cancelReason: data.cancelReason || ('' as CancellationReason),
            cancelEffDateMS: data.requestEffDate.toMillis(),
          });
          break;
        case 'flat_cancel':
          throw new Error('flat_cancel handling not set up yet');
        // TODO
        // flat_cancel handled differently that cancel ??
        // or publishLocationCancel for each location ??
        case 'reinstatement':
          throw new Error('reinstatement handling not set up yet');
          // TODO: location reinstatement listener not built yet ?? create on its own or build into policy reinstatement ??
          break;
        default:
          error('location trxType not matched in switch statement. no pub/sub event emitted.');
      }
    }
    if (data.scope === 'policy') {
      switch (data.trxType) {
        case 'endorsement':
          throw new Error('TODO: handle publish policy endorsement pubsub message');
        // TODO: does policy endorsement scenario exist ?? (exp date ??)
        // would effDate request change actually be a cancel ?? can eff date be move later ??

        // break;
        case 'amendment':
          throw new Error('TODO: handle publish policy amendment pubsub message');

        // break;
        case 'cancellation': {
          console.log('TODO: handle publish policy cancellation pubsub message');
          const db = getFirestore();
          const policyRef = policiesCollection(db).doc(policyId);
          const policy = await getDoc(policyRef);

          // TODO: handle in batch instead of pubsub for each location ??
          let lcnEntries = Object.entries(policy.locations).filter(([id, l]) => !l.cancelEffDate);
          for (const [id] of lcnEntries) {
            await publishLocationCancel({
              policyId,
              locationId: id, // TODO: fix discriminating union types
              cancelReason: data.cancelReason || ('' as CancellationReason),
              cancelEffDateMS: data.requestEffDate.toMillis(),
            });
          }
          // let locationIds = Object.keys(policy.locations);
          // for (const id of locationIds) {
          //   await publishLocationCancel({
          //     policyId,
          //     locationId: id, // TODO: fix discriminating union types
          //     cancelReason: data.cancelReason || ('' as CancellationReason),
          //     cancelEffDateMS: data.requestEffDate.toMillis(),
          //   });
          // }
          break;
        }
        case 'flat_cancel':
          // TODO: flat cancel should look up prev trx --> use as base to offset instead of calculation using "getOffsetTrx"
          throw new Error('TODO: handle publish policy cancellation pubsub message');
        // TODO: different transactions than regular cancel ?? can a location be flat_cancelled or just policy ?? location can b/c all trx is location

        // break;
        default:
          error(`failed to match transaction type. no message published`);
      }
    }
  } catch (err: any) {
    console.log('Error: ', err);
    const errMsg = `Error publishing change request accepted pubsub event`;
    // TODO: set error message
    // setChangeRequestErr(requestRef, errMsg);
    reportErr(errMsg, {}, err);
    // error(errMsg, { ...err });
  }

  return;
}
