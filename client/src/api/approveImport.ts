import { Functions, httpsCallable } from 'firebase/functions';

export interface ApproveImportRequest {
  importId: string;
  records: string[] | null; // if only specific records (null --> import all)
  approvedByName?: string | null;
}

export interface ApproveImportResponse {
  successCount: string;
}

export const approveImport = (
  functions: Functions,
  args: ApproveImportRequest,
) =>
  httpsCallable<ApproveImportRequest, ApproveImportResponse>(
    functions,
    'call-approveimport',
  )(args);
