import { info } from 'firebase-functions/logger';

// TODO: refactor to try/catch and use invariant/verify
export function validateRatePortfolioRow(data: any) {
  if (!data.cov_a_rcv) {
    info(`INVALID - "cov_a_rcv" - VALUE: ${data.cov_a_rcv}`);
    return false;
  }
  if (!data.cov_b_rcv && data.cov_b_rcv !== 0) {
    info(`INVALID - "cov_b_rcv" - VALUE: ${data.cov_b_rcv} - TYPE: ${typeof data.cov_b_rcv}`);
    return false;
  }
  if (!data.cov_c_rcv && data.cov_c_rcv !== 0) {
    info(`INVALID - "cov_c_rcv" - VALUE: ${data.cov_c_rcv}`);
    return false;
  }
  if (!data.cov_d_rcv && data.cov_d_rcv !== 0) {
    info(`INVALID - "cov_d_rcv" - VALUE: ${data.cov_d_rcv}`);
    return false;
  }
  if (!data.cov_a_limit) {
    info(`INVALID - "cov_a_limit" - VALUE: ${data.cov_a_limit}`);
    return false;
  }
  if (!data.cov_b_limit && data.cov_b_limit !== 0) {
    info(`INVALID - "cov_b_limit" - VALUE: ${data.cov_b_limit}`);
    return false;
  }
  if (!data.cov_c_limit && data.cov_c_limit !== 0) {
    info(`INVALID - "cov_c_limit" - VALUE: ${data.cov_c_limit}`);
    return false;
  }
  if (!data.cov_d_limit && data.cov_d_limit !== 0) {
    info(`INVALID - "cov_d_limit" - VALUE: ${data.cov_d_limit}`);
    return false;
  }
  if (!data.deductible) {
    info(`INVALID - "deductible" - VALUE ${data.deductible}`);
    return false;
  }
  if (!data.latitude) {
    info(`INVALID - "latitude" - VALUE ${data.latitude}`);
    return false;
  }
  if (!data.longitude) {
    info(`INVALID - "longitude" - VALUE ${data.longitude}`);
    return false;
  }
  if (!data.state) {
    info(`INVALID - "state" - VALUE ${data.state}`);
    return false;
  }

  return true;
}
