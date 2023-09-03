export interface IRow extends Record<string, string> {
  cov_a_rcv: string;
  cov_b_rcv: string;
  cov_c_rcv: string;
  cov_d_rcv: string;
  total_rcv: string;
  cov_a_limit: string;
  cov_b_limit: string;
  cov_c_limit: string;
  cov_d_limit: string;
  total_limits: string;
  deductible: string;
  state: string;
}
export interface TRow extends Record<string, any> {
  cov_a_rcv: number;
  cov_b_rcv: number;
  cov_c_rcv: number;
  cov_d_rcv: number;
  total_rcv: number;
  cov_a_limit: number;
  cov_b_limit: number;
  cov_c_limit: number;
  cov_d_limit: number;
  total_limits: number;
  deductible: number;
  state: string;
}
