import type {NativeMemberReview,NativeMemberReviewSaveReceipt,NativeMemberReviewSubmitReceipt} from '../product-core/open-member-review.ts';
/** Genuine source-family review capability; transport and infrastructure remain outside Application. */
export interface NativeMemberReviewStore {
 review(intent_id:string):NativeMemberReview|null;
 reviewForTask(task_id:string):NativeMemberReview|null;
 submissionForReview(review_id:string):NativeMemberReviewSubmitReceipt|null;
 reviewById(review_id:string):NativeMemberReview|null;
 reviewReceipt(command_id:string):NativeMemberReviewSaveReceipt|null;
 saveReview(input:unknown):Promise<NativeMemberReviewSaveReceipt>;
 submissionReceipt(command_id:string):NativeMemberReviewSubmitReceipt|null;
 submitReview(input:unknown):Promise<NativeMemberReviewSubmitReceipt>;
}
