// TODO: create reversal fn: https://stripe.com/docs/api/tax/transactions/create_reversal

// should create the reversal transaction object
// and save to DB ?? or just return object ?? (might want to use in firebase atomic transaction/batch)
// rename createTaxReversalTrxObject (if not saving to DB);

export {};

// params:
//    - mode: partial or full
//    - flatAmount: required if MODE=PARTIAL AND LINE_ITEMS NOR SHIPPING_COST PROVIDED
//    - lineItems: required if MODE=PARTIAL AND NEITHER SHIPPING_COST NOR FLAT_AMOUNT IS PROVIDED
//    - originalTransactionId
//    - reference: 'myOrder-123_refund_1'
//

// const transaction = await stripe.tax.transactions.createReversal({
//   mode: 'partial',
//   original_transaction: 'tax_1OHBhDAz0TiSvYFf8JRmv0zh',
//   reference: 'myOrder_123-refund_1',
//   line_items: [
//     {
//       amount: -1499,
//       amount_tax: -148,
//       original_line_item: 'tax_li_P5MQiA8GnwNoL2',
//       reference: 'refund of Pepperoni Pizza',
//     },
//   ],
//   expand: ['line_items'],
// });

// {
//   "id": "tax_1OHBhEAz0TiSvYFfkDWQsLFR",
//   "object": "tax.transaction",
//   "created": 1701117983,
//   "currency": "usd",
//   "customer": null,
//   "customer_details": {
//     "address": {
//       "city": "South San Francisco",
//       "country": "US",
//       "line1": "354 Oyster Point Blvd",
//       "line2": "",
//       "postal_code": "94080",
//       "state": "CA"
//     },
//     "address_source": "shipping",
//     "ip_address": null,
//     "tax_ids": [],
//     "taxability_override": "none"
//   },
//   "line_items": {
//     "object": "list",
//     "data": [
//       {
//         "id": "tax_li_P5MQpyJXT1l44s",
//         "object": "tax.transaction_line_item",
//         "amount": -1499,
//         "amount_tax": -148,
//         "livemode": false,
//         "metadata": null,
//         "product": null,
//         "quantity": 1,
//         "reference": "refund of Pepperoni Pizza",
//         "reversal": {
//           "original_line_item": "tax_li_P5MQiA8GnwNoL2"
//         },
//         "tax_behavior": "exclusive",
//         "tax_code": "txcd_40060003",
//         "type": "reversal"
//       }
//     ],
//     "has_more": false,
//     "url": "/v1/tax/transactions/tax_1OHBhDAz0TiSvYFf8JRmv0zh/line_items"
//   },
//   "livemode": false,
//   "metadata": null,
//   "reference": "myOrder_123-refund_1",
//   "reversal": {
//     "original_transaction": "tax_1OHBhDAz0TiSvYFf8JRmv0zh"
//   },
//   "shipping_cost": null,
//   "tax_date": 1701117983,
//   "type": "reversal"
// }
