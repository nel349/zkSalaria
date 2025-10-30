'use strict';
const __compactRuntime = require('@midnight-ntwrk/compact-runtime');
const expectedRuntimeVersionString = '0.8.1';
const expectedRuntimeVersion = expectedRuntimeVersionString.split('-')[0].split('.').map(Number);
const actualRuntimeVersion = __compactRuntime.versionString.split('-')[0].split('.').map(Number);
if (expectedRuntimeVersion[0] != actualRuntimeVersion[0]
     || (actualRuntimeVersion[0] == 0 && expectedRuntimeVersion[1] != actualRuntimeVersion[1])
     || expectedRuntimeVersion[1] > actualRuntimeVersion[1]
     || (expectedRuntimeVersion[1] == actualRuntimeVersion[1] && expectedRuntimeVersion[2] > actualRuntimeVersion[2]))
   throw new __compactRuntime.CompactError(`Version mismatch: compiled code expects ${expectedRuntimeVersionString}, runtime is ${__compactRuntime.versionString}`);
{ const MAX_FIELD = 52435875175126190479447740508185965837690552500527637822603658699938581184512n;
  if (__compactRuntime.MAX_FIELD !== MAX_FIELD)
     throw new __compactRuntime.CompactError(`compiler thinks maximum field value is ${MAX_FIELD}; run time thinks it is ${__compactRuntime.MAX_FIELD}`)
}

const _descriptor_0 = new __compactRuntime.CompactTypeBytes(32);

const _descriptor_1 = new __compactRuntime.CompactTypeUnsignedInteger(4294967295n, 4);

const _descriptor_2 = new __compactRuntime.CompactTypeBoolean();

const _descriptor_3 = new __compactRuntime.CompactTypeUnsignedInteger(18446744073709551615n, 8);

const _descriptor_4 = new __compactRuntime.CompactTypeUnsignedInteger(65535n, 2);

const _descriptor_5 = new __compactRuntime.CompactTypeBytes(64);

const _descriptor_6 = new __compactRuntime.CompactTypeEnum(3, 1);

class _Subscription_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_4.alignment().concat(_descriptor_6.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment().concat(_descriptor_1.alignment())))))))));
  }
  fromValue(value_0) {
    return {
      subscription_id: _descriptor_0.fromValue(value_0),
      merchant_id: _descriptor_0.fromValue(value_0),
      customer_id: _descriptor_0.fromValue(value_0),
      amount: _descriptor_3.fromValue(value_0),
      max_amount: _descriptor_3.fromValue(value_0),
      frequency_days: _descriptor_4.fromValue(value_0),
      status: _descriptor_6.fromValue(value_0),
      last_payment: _descriptor_1.fromValue(value_0),
      next_payment: _descriptor_1.fromValue(value_0),
      payment_count: _descriptor_1.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.subscription_id).concat(_descriptor_0.toValue(value_0.merchant_id).concat(_descriptor_0.toValue(value_0.customer_id).concat(_descriptor_3.toValue(value_0.amount).concat(_descriptor_3.toValue(value_0.max_amount).concat(_descriptor_4.toValue(value_0.frequency_days).concat(_descriptor_6.toValue(value_0.status).concat(_descriptor_1.toValue(value_0.last_payment).concat(_descriptor_1.toValue(value_0.next_payment).concat(_descriptor_1.toValue(value_0.payment_count))))))))));
  }
}

const _descriptor_7 = new _Subscription_0();

const _descriptor_8 = new __compactRuntime.CompactTypeEnum(3, 1);

class _MerchantInfo_0 {
  alignment() {
    return _descriptor_0.alignment().concat(_descriptor_5.alignment().concat(_descriptor_8.alignment().concat(_descriptor_1.alignment().concat(_descriptor_3.alignment().concat(_descriptor_1.alignment().concat(_descriptor_2.alignment()))))));
  }
  fromValue(value_0) {
    return {
      merchant_id: _descriptor_0.fromValue(value_0),
      business_name: _descriptor_5.fromValue(value_0),
      tier: _descriptor_8.fromValue(value_0),
      transaction_count: _descriptor_1.fromValue(value_0),
      total_volume: _descriptor_3.fromValue(value_0),
      created_at: _descriptor_1.fromValue(value_0),
      is_active: _descriptor_2.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.merchant_id).concat(_descriptor_5.toValue(value_0.business_name).concat(_descriptor_8.toValue(value_0.tier).concat(_descriptor_1.toValue(value_0.transaction_count).concat(_descriptor_3.toValue(value_0.total_volume).concat(_descriptor_1.toValue(value_0.created_at).concat(_descriptor_2.toValue(value_0.is_active)))))));
  }
}

const _descriptor_9 = new _MerchantInfo_0();

const _descriptor_10 = new __compactRuntime.CompactTypeVector(2, _descriptor_0);

const _descriptor_11 = new __compactRuntime.CompactTypeVector(3, _descriptor_0);

class _ContractAddress_0 {
  alignment() {
    return _descriptor_0.alignment();
  }
  fromValue(value_0) {
    return {
      bytes: _descriptor_0.fromValue(value_0)
    }
  }
  toValue(value_0) {
    return _descriptor_0.toValue(value_0.bytes);
  }
}

const _descriptor_12 = new _ContractAddress_0();

const _descriptor_13 = new __compactRuntime.CompactTypeUnsignedInteger(255n, 1);

class Contract {
  witnesses;
  constructor(...args_0) {
    if (args_0.length !== 1)
      throw new __compactRuntime.CompactError(`Contract constructor: expected 1 argument, received ${args_0.length}`);
    const witnesses_0 = args_0[0];
    if (typeof(witnesses_0) !== 'object')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor is not an object');
    if (typeof(witnesses_0.merchant_info) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named merchant_info');
    if (typeof(witnesses_0.set_merchant_info) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named set_merchant_info');
    if (typeof(witnesses_0.customer_subscription_count) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named customer_subscription_count');
    if (typeof(witnesses_0.set_customer_subscription_count) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named set_customer_subscription_count');
    if (typeof(witnesses_0.subscription_info) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named subscription_info');
    if (typeof(witnesses_0.set_subscription_info) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named set_subscription_info');
    if (typeof(witnesses_0.calculate_percentage_fee) !== 'function')
      throw new __compactRuntime.CompactError('first (witnesses) argument to Contract constructor does not contain a function-valued field named calculate_percentage_fee');
    this.witnesses = witnesses_0;
    this.circuits = {
      deposit_customer_funds: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`deposit_customer_funds: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const customer_id_0 = args_1[1];
        const amount_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('deposit_customer_funds',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 40 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('deposit_customer_funds',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 40 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('deposit_customer_funds',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 40 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(customer_id_0).concat(_descriptor_3.toValue(amount_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_deposit_customer_funds_0(context,
                                                         partialProofData,
                                                         customer_id_0,
                                                         amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      withdraw_customer_funds: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`withdraw_customer_funds: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const customer_id_0 = args_1[1];
        const amount_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('withdraw_customer_funds',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 62 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('withdraw_customer_funds',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 62 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('withdraw_customer_funds',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 62 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(customer_id_0).concat(_descriptor_3.toValue(amount_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_withdraw_customer_funds_0(context,
                                                          partialProofData,
                                                          customer_id_0,
                                                          amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      withdraw_merchant_earnings: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`withdraw_merchant_earnings: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const merchant_id_0 = args_1[1];
        const amount_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('withdraw_merchant_earnings',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 86 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(merchant_id_0.buffer instanceof ArrayBuffer && merchant_id_0.BYTES_PER_ELEMENT === 1 && merchant_id_0.length === 32))
          __compactRuntime.type_error('withdraw_merchant_earnings',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 86 char 1',
                                      'Bytes<32>',
                                      merchant_id_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('withdraw_merchant_earnings',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 86 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(merchant_id_0).concat(_descriptor_3.toValue(amount_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_3.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_withdraw_merchant_earnings_0(context,
                                                             partialProofData,
                                                             merchant_id_0,
                                                             amount_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      register_merchant: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`register_merchant: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const merchant_id_0 = args_1[1];
        const business_name_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('register_merchant',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 111 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(merchant_id_0.buffer instanceof ArrayBuffer && merchant_id_0.BYTES_PER_ELEMENT === 1 && merchant_id_0.length === 32))
          __compactRuntime.type_error('register_merchant',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 111 char 1',
                                      'Bytes<32>',
                                      merchant_id_0)
        if (!(business_name_0.buffer instanceof ArrayBuffer && business_name_0.BYTES_PER_ELEMENT === 1 && business_name_0.length === 64))
          __compactRuntime.type_error('register_merchant',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 111 char 1',
                                      'Bytes<64>',
                                      business_name_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(merchant_id_0).concat(_descriptor_5.toValue(business_name_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_5.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_register_merchant_0(context,
                                                    partialProofData,
                                                    merchant_id_0,
                                                    business_name_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      create_subscription: (...args_1) => {
        if (args_1.length !== 6)
          throw new __compactRuntime.CompactError(`create_subscription: expected 6 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const merchant_id_0 = args_1[1];
        const customer_id_0 = args_1[2];
        const amount_0 = args_1[3];
        const max_amount_0 = args_1[4];
        const frequency_days_0 = args_1[5];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('create_subscription',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 138 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(merchant_id_0.buffer instanceof ArrayBuffer && merchant_id_0.BYTES_PER_ELEMENT === 1 && merchant_id_0.length === 32))
          __compactRuntime.type_error('create_subscription',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 138 char 1',
                                      'Bytes<32>',
                                      merchant_id_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('create_subscription',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 138 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        if (!(typeof(amount_0) === 'bigint' && amount_0 >= 0 && amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('create_subscription',
                                      'argument 3 (argument 4 as invoked from Typescript)',
                                      'pay.compact line 138 char 1',
                                      'Uint<0..18446744073709551615>',
                                      amount_0)
        if (!(typeof(max_amount_0) === 'bigint' && max_amount_0 >= 0 && max_amount_0 <= 18446744073709551615n))
          __compactRuntime.type_error('create_subscription',
                                      'argument 4 (argument 5 as invoked from Typescript)',
                                      'pay.compact line 138 char 1',
                                      'Uint<0..18446744073709551615>',
                                      max_amount_0)
        if (!(typeof(frequency_days_0) === 'bigint' && frequency_days_0 >= 0 && frequency_days_0 <= 18446744073709551615n))
          __compactRuntime.type_error('create_subscription',
                                      'argument 5 (argument 6 as invoked from Typescript)',
                                      'pay.compact line 138 char 1',
                                      'Uint<0..18446744073709551615>',
                                      frequency_days_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(merchant_id_0).concat(_descriptor_0.toValue(customer_id_0).concat(_descriptor_3.toValue(amount_0).concat(_descriptor_3.toValue(max_amount_0).concat(_descriptor_3.toValue(frequency_days_0))))),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment().concat(_descriptor_3.alignment()))))
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_create_subscription_0(context,
                                                      partialProofData,
                                                      merchant_id_0,
                                                      customer_id_0,
                                                      amount_0,
                                                      max_amount_0,
                                                      frequency_days_0);
        partialProofData.output = { value: _descriptor_0.toValue(result_0), alignment: _descriptor_0.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      pause_subscription: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`pause_subscription: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const subscription_id_0 = args_1[1];
        const customer_id_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('pause_subscription',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 184 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(subscription_id_0.buffer instanceof ArrayBuffer && subscription_id_0.BYTES_PER_ELEMENT === 1 && subscription_id_0.length === 32))
          __compactRuntime.type_error('pause_subscription',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 184 char 1',
                                      'Bytes<32>',
                                      subscription_id_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('pause_subscription',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 184 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(subscription_id_0).concat(_descriptor_0.toValue(customer_id_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_pause_subscription_0(context,
                                                     partialProofData,
                                                     subscription_id_0,
                                                     customer_id_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      resume_subscription: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`resume_subscription: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const subscription_id_0 = args_1[1];
        const customer_id_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('resume_subscription',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 224 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(subscription_id_0.buffer instanceof ArrayBuffer && subscription_id_0.BYTES_PER_ELEMENT === 1 && subscription_id_0.length === 32))
          __compactRuntime.type_error('resume_subscription',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 224 char 1',
                                      'Bytes<32>',
                                      subscription_id_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('resume_subscription',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 224 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(subscription_id_0).concat(_descriptor_0.toValue(customer_id_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_resume_subscription_0(context,
                                                      partialProofData,
                                                      subscription_id_0,
                                                      customer_id_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      cancel_subscription: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`cancel_subscription: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const subscription_id_0 = args_1[1];
        const customer_id_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('cancel_subscription',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 263 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(subscription_id_0.buffer instanceof ArrayBuffer && subscription_id_0.BYTES_PER_ELEMENT === 1 && subscription_id_0.length === 32))
          __compactRuntime.type_error('cancel_subscription',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 263 char 1',
                                      'Bytes<32>',
                                      subscription_id_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('cancel_subscription',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 263 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(subscription_id_0).concat(_descriptor_0.toValue(customer_id_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_cancel_subscription_0(context,
                                                      partialProofData,
                                                      subscription_id_0,
                                                      customer_id_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      process_subscription_payment: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`process_subscription_payment: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const subscription_id_0 = args_1[1];
        const service_proof_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('process_subscription_payment',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 305 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(subscription_id_0.buffer instanceof ArrayBuffer && subscription_id_0.BYTES_PER_ELEMENT === 1 && subscription_id_0.length === 32))
          __compactRuntime.type_error('process_subscription_payment',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 305 char 1',
                                      'Bytes<32>',
                                      subscription_id_0)
        if (!(service_proof_0.buffer instanceof ArrayBuffer && service_proof_0.BYTES_PER_ELEMENT === 1 && service_proof_0.length === 32))
          __compactRuntime.type_error('process_subscription_payment',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 305 char 1',
                                      'Bytes<32>',
                                      service_proof_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(subscription_id_0).concat(_descriptor_0.toValue(service_proof_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_0.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_process_subscription_payment_0(context,
                                                               partialProofData,
                                                               subscription_id_0,
                                                               service_proof_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      prove_active_subscriptions_count: (...args_1) => {
        if (args_1.length !== 3)
          throw new __compactRuntime.CompactError(`prove_active_subscriptions_count: expected 3 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const customer_id_0 = args_1[1];
        const threshold_0 = args_1[2];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('prove_active_subscriptions_count',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 394 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(customer_id_0.buffer instanceof ArrayBuffer && customer_id_0.BYTES_PER_ELEMENT === 1 && customer_id_0.length === 32))
          __compactRuntime.type_error('prove_active_subscriptions_count',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 394 char 1',
                                      'Bytes<32>',
                                      customer_id_0)
        if (!(typeof(threshold_0) === 'bigint' && threshold_0 >= 0 && threshold_0 <= 4294967295n))
          __compactRuntime.type_error('prove_active_subscriptions_count',
                                      'argument 2 (argument 3 as invoked from Typescript)',
                                      'pay.compact line 394 char 1',
                                      'Uint<0..4294967295>',
                                      threshold_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_0.toValue(customer_id_0).concat(_descriptor_1.toValue(threshold_0)),
            alignment: _descriptor_0.alignment().concat(_descriptor_1.alignment())
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_prove_active_subscriptions_count_0(context,
                                                                   partialProofData,
                                                                   customer_id_0,
                                                                   threshold_0);
        partialProofData.output = { value: _descriptor_2.toValue(result_0), alignment: _descriptor_2.alignment() };
        return { result: result_0, context: context, proofData: partialProofData };
      },
      update_timestamp: (...args_1) => {
        if (args_1.length !== 2)
          throw new __compactRuntime.CompactError(`update_timestamp: expected 2 arguments (as invoked from Typescript), received ${args_1.length}`);
        const contextOrig_0 = args_1[0];
        const new_timestamp_0 = args_1[1];
        if (!(typeof(contextOrig_0) === 'object' && contextOrig_0.originalState != undefined && contextOrig_0.transactionContext != undefined))
          __compactRuntime.type_error('update_timestamp',
                                      'argument 1 (as invoked from Typescript)',
                                      'pay.compact line 406 char 1',
                                      'CircuitContext',
                                      contextOrig_0)
        if (!(typeof(new_timestamp_0) === 'bigint' && new_timestamp_0 >= 0 && new_timestamp_0 <= 4294967295n))
          __compactRuntime.type_error('update_timestamp',
                                      'argument 1 (argument 2 as invoked from Typescript)',
                                      'pay.compact line 406 char 1',
                                      'Uint<0..4294967295>',
                                      new_timestamp_0)
        const context = { ...contextOrig_0 };
        const partialProofData = {
          input: {
            value: _descriptor_1.toValue(new_timestamp_0),
            alignment: _descriptor_1.alignment()
          },
          output: undefined,
          publicTranscript: [],
          privateTranscriptOutputs: []
        };
        const result_0 = this.#_update_timestamp_0(context,
                                                   partialProofData,
                                                   new_timestamp_0);
        partialProofData.output = { value: [], alignment: [] };
        return { result: result_0, context: context, proofData: partialProofData };
      }
    };
    this.impureCircuits = {
      deposit_customer_funds: this.circuits.deposit_customer_funds,
      withdraw_customer_funds: this.circuits.withdraw_customer_funds,
      withdraw_merchant_earnings: this.circuits.withdraw_merchant_earnings,
      register_merchant: this.circuits.register_merchant,
      create_subscription: this.circuits.create_subscription,
      pause_subscription: this.circuits.pause_subscription,
      resume_subscription: this.circuits.resume_subscription,
      cancel_subscription: this.circuits.cancel_subscription,
      process_subscription_payment: this.circuits.process_subscription_payment,
      prove_active_subscriptions_count: this.circuits.prove_active_subscriptions_count,
      update_timestamp: this.circuits.update_timestamp
    };
  }
  initialState(...args_0) {
    if (args_0.length !== 1)
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 1 argument (as invoked from Typescript), received ${args_0.length}`);
    const constructorContext_0 = args_0[0];
    if (typeof(constructorContext_0) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'constructorContext' in argument 1 (as invoked from Typescript) to be an object`);
    }
    if (!('initialPrivateState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialPrivateState' in argument 1 (as invoked from Typescript)`);
    }
    if (!('initialZswapLocalState' in constructorContext_0)) {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript)`);
    }
    if (typeof(constructorContext_0.initialZswapLocalState) !== 'object') {
      throw new __compactRuntime.CompactError(`Contract state constructor: expected 'initialZswapLocalState' in argument 1 (as invoked from Typescript) to be an object`);
    }
    const state_0 = new __compactRuntime.ContractState();
    let stateValue_0 = __compactRuntime.StateValue.newArray();
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    stateValue_0 = stateValue_0.arrayPush(__compactRuntime.StateValue.newNull());
    state_0.data = stateValue_0;
    state_0.setOperation('deposit_customer_funds', new __compactRuntime.ContractOperation());
    state_0.setOperation('withdraw_customer_funds', new __compactRuntime.ContractOperation());
    state_0.setOperation('withdraw_merchant_earnings', new __compactRuntime.ContractOperation());
    state_0.setOperation('register_merchant', new __compactRuntime.ContractOperation());
    state_0.setOperation('create_subscription', new __compactRuntime.ContractOperation());
    state_0.setOperation('pause_subscription', new __compactRuntime.ContractOperation());
    state_0.setOperation('resume_subscription', new __compactRuntime.ContractOperation());
    state_0.setOperation('cancel_subscription', new __compactRuntime.ContractOperation());
    state_0.setOperation('process_subscription_payment', new __compactRuntime.ContractOperation());
    state_0.setOperation('prove_active_subscriptions_count', new __compactRuntime.ContractOperation());
    state_0.setOperation('update_timestamp', new __compactRuntime.ContractOperation());
    const context = {
      originalState: state_0,
      currentPrivateState: constructorContext_0.initialPrivateState,
      currentZswapLocalState: constructorContext_0.initialZswapLocalState,
      transactionContext: new __compactRuntime.QueryContext(state_0.data, __compactRuntime.dummyContractAddress())
    };
    const partialProofData = {
      input: { value: [], alignment: [] },
      output: undefined,
      publicTranscript: [],
      privateTranscriptOutputs: []
    };
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(0n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(1n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(2n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(3n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(4n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newMap(
                                        new __compactRuntime.StateMap()
                                      ).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(5n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(6n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(7n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(8n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(0n),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const tmp_0 = 1000000n;
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(8n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(tmp_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const tmp_1 = 0n;
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(7n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_1),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    state_0.data = context.transactionContext.state;
    return {
      currentContractState: state_0,
      currentPrivateState: context.currentPrivateState,
      currentZswapLocalState: context.currentZswapLocalState
    }
  }
  #_persistentHash_0(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_10, value_0);
    return result_0;
  }
  #_persistentHash_1(context, partialProofData, value_0) {
    const result_0 = __compactRuntime.persistentHash(_descriptor_11, value_0);
    return result_0;
  }
  #_hash_merchant_id_0(context, partialProofData, merchant_id_0) {
    return this.#_persistentHash_0(context,
                                   partialProofData,
                                   [new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 112, 97, 121, 58, 109, 101, 114, 99, 104, 97, 110, 116, 58, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
                                    merchant_id_0]);
  }
  #_hash_subscription_id_0(context,
                           partialProofData,
                           merchant_id_0,
                           customer_id_0,
                           timestamp_0)
  {
    return this.#_persistentHash_1(context,
                                   partialProofData,
                                   [new Uint8Array([109, 105, 100, 110, 105, 103, 104, 116, 58, 112, 97, 121, 58, 115, 117, 98, 115, 99, 114, 105, 112, 116, 105, 111, 110, 58, 0, 0, 0, 0, 0, 0]),
                                    merchant_id_0,
                                    customer_id_0]);
  }
  #_calculate_merchant_tier_0(context, partialProofData, transaction_count_0) {
    if (transaction_count_0 >= 1000n) {
      return 3;
    } else {
      if (transaction_count_0 >= 100n) {
        return 2;
      } else {
        if (transaction_count_0 >= 10n) { return 1; } else { return 0; }
      }
    }
  }
  #_is_subscription_due_0(context,
                          partialProofData,
                          last_payment_0,
                          frequency_days_0,
                          current_time_0)
  {
    const next_due_0 = last_payment_0 + frequency_days_0 * 86400n;
    return current_time_0 >= next_due_0;
  }
  #_calculate_fee_basis_points_0(context, partialProofData, tier_0) {
    if (tier_0 === 3) {
      return 150n;
    } else {
      if (tier_0 === 2) {
        return 200n;
      } else {
        if (tier_0 === 1) { return 250n; } else { return 300n; }
      }
    }
  }
  #_MAX_BALANCE_0(context, partialProofData) { return 1000000000n; }
  #_MIN_DEPOSIT_0(context, partialProofData) { return 100n; }
  #_MIN_WITHDRAWAL_0(context, partialProofData) { return 100n; }
  #_validate_balance_0(context,
                       partialProofData,
                       available_balance_0,
                       required_amount_0)
  {
    return available_balance_0 >= required_amount_0;
  }
  #_calculate_deposit_0(context,
                        partialProofData,
                        current_balance_0,
                        deposit_amount_0)
  {
    const new_balance_0 = ((t1) => {
                            if (t1 > 18446744073709551615n)
                              throw new __compactRuntime.CompactError('TokenOperations.compact line 62 char 25: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                            return t1;
                          })(current_balance_0 + deposit_amount_0);
    if (new_balance_0 > this.#_MAX_BALANCE_0(context, partialProofData)) {
      return this.#_MAX_BALANCE_0(context, partialProofData);
    } else {
      return new_balance_0;
    }
  }
  #_calculate_withdrawal_0(context,
                           partialProofData,
                           current_balance_0,
                           withdrawal_amount_0)
  {
    if (withdrawal_amount_0 > current_balance_0) {
      return 0n;
    } else {
      __compactRuntime.assert(!(current_balance_0 < withdrawal_amount_0),
                              'result of subtraction would be negative');
      return current_balance_0 - withdrawal_amount_0;
    }
  }
  #_validate_deposit_amount_0(context, partialProofData, amount_0) {
    return amount_0 >= this.#_MIN_DEPOSIT_0(context, partialProofData)
           &&
           amount_0 <= this.#_MAX_BALANCE_0(context, partialProofData);
  }
  #_validate_withdrawal_amount_0(context,
                                 partialProofData,
                                 amount_0,
                                 current_balance_0)
  {
    return amount_0 >= this.#_MIN_WITHDRAWAL_0(context, partialProofData)
           &&
           amount_0 <= current_balance_0;
  }
  #_verify_fee_calculation_0(context,
                             partialProofData,
                             amount_0,
                             fee_basis_points_0,
                             calculated_fee_0)
  {
    __compactRuntime.assert(calculated_fee_0 <= amount_0,
                            'Fee cannot exceed amount');
    const expected_fee_times_10000_0 = amount_0 * fee_basis_points_0;
    const calculated_fee_times_10000_0 = ((t1) => {
                                           if (t1 > 18446744073709551615n)
                                             throw new __compactRuntime.CompactError('TokenOperations.compact line 140 char 40: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                                           return t1;
                                         })(calculated_fee_0 * 10000n);
    const upper_bound_0 = ((t1) => {
                            if (t1 > 18446744073709551615n)
                              throw new __compactRuntime.CompactError('TokenOperations.compact line 143 char 25: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                            return t1;
                          })(calculated_fee_times_10000_0 + 10000n);
    const lower_bound_0 = calculated_fee_times_10000_0;
    const verification_0 = expected_fee_times_10000_0 >= lower_bound_0
                           &&
                           expected_fee_times_10000_0 < upper_bound_0;
    __compactRuntime.assert(verification_0,
                            'Fee calculation verification failed');
    return true;
  }
  #_merchant_info_0(context, partialProofData, merchant_id_0) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.merchant_info(witnessContext_0,
                                                                        merchant_id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.merchant_id.buffer instanceof ArrayBuffer && result_0.merchant_id.BYTES_PER_ELEMENT === 1 && result_0.merchant_id.length === 32 && result_0.business_name.buffer instanceof ArrayBuffer && result_0.business_name.BYTES_PER_ELEMENT === 1 && result_0.business_name.length === 64 && typeof(result_0.tier) === 'number' && result_0.tier >= 0 && result_0.tier <= 3 && typeof(result_0.transaction_count) === 'bigint' && result_0.transaction_count >= 0 && result_0.transaction_count <= 4294967295n && typeof(result_0.total_volume) === 'bigint' && result_0.total_volume >= 0 && result_0.total_volume <= 18446744073709551615n && typeof(result_0.created_at) === 'bigint' && result_0.created_at >= 0 && result_0.created_at <= 4294967295n && typeof(result_0.is_active) === 'boolean'))
      __compactRuntime.type_error('merchant_info',
                                  'return value',
                                  'pay.compact line 22 char 1',
                                  'struct MerchantInfo<merchant_id: Bytes<32>, business_name: Bytes<64>, tier: Enum<MERCHANT_TIER, unverified, basic, verified, premium>, transaction_count: Uint<0..4294967295>, total_volume: Uint<0..18446744073709551615>, created_at: Uint<0..4294967295>, is_active: Boolean>',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_9.toValue(result_0),
      alignment: _descriptor_9.alignment()
    });
    return result_0;
  }
  #_set_merchant_info_0(context, partialProofData, merchant_id_0, info_0) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.set_merchant_info(witnessContext_0,
                                                                            merchant_id_0,
                                                                            info_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 0 ))
      __compactRuntime.type_error('set_merchant_info',
                                  'return value',
                                  'pay.compact line 23 char 1',
                                  '[]',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  #_customer_subscription_count_0(context, partialProofData, customer_id_0) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.customer_subscription_count(witnessContext_0,
                                                                                      customer_id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= 4294967295n))
      __compactRuntime.type_error('customer_subscription_count',
                                  'return value',
                                  'pay.compact line 24 char 1',
                                  'Uint<0..4294967295>',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_1.toValue(result_0),
      alignment: _descriptor_1.alignment()
    });
    return result_0;
  }
  #_set_customer_subscription_count_0(context,
                                      partialProofData,
                                      customer_id_0,
                                      count_0)
  {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.set_customer_subscription_count(witnessContext_0,
                                                                                          customer_id_0,
                                                                                          count_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 0 ))
      __compactRuntime.type_error('set_customer_subscription_count',
                                  'return value',
                                  'pay.compact line 25 char 1',
                                  '[]',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  #_subscription_info_0(context, partialProofData, subscription_id_0) {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.subscription_info(witnessContext_0,
                                                                            subscription_id_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'object' && result_0.subscription_id.buffer instanceof ArrayBuffer && result_0.subscription_id.BYTES_PER_ELEMENT === 1 && result_0.subscription_id.length === 32 && result_0.merchant_id.buffer instanceof ArrayBuffer && result_0.merchant_id.BYTES_PER_ELEMENT === 1 && result_0.merchant_id.length === 32 && result_0.customer_id.buffer instanceof ArrayBuffer && result_0.customer_id.BYTES_PER_ELEMENT === 1 && result_0.customer_id.length === 32 && typeof(result_0.amount) === 'bigint' && result_0.amount >= 0 && result_0.amount <= 18446744073709551615n && typeof(result_0.max_amount) === 'bigint' && result_0.max_amount >= 0 && result_0.max_amount <= 18446744073709551615n && typeof(result_0.frequency_days) === 'bigint' && result_0.frequency_days >= 0 && result_0.frequency_days <= 65535n && typeof(result_0.status) === 'number' && result_0.status >= 0 && result_0.status <= 3 && typeof(result_0.last_payment) === 'bigint' && result_0.last_payment >= 0 && result_0.last_payment <= 4294967295n && typeof(result_0.next_payment) === 'bigint' && result_0.next_payment >= 0 && result_0.next_payment <= 4294967295n && typeof(result_0.payment_count) === 'bigint' && result_0.payment_count >= 0 && result_0.payment_count <= 4294967295n))
      __compactRuntime.type_error('subscription_info',
                                  'return value',
                                  'pay.compact line 26 char 1',
                                  'struct Subscription<subscription_id: Bytes<32>, merchant_id: Bytes<32>, customer_id: Bytes<32>, amount: Uint<0..18446744073709551615>, max_amount: Uint<0..18446744073709551615>, frequency_days: Uint<0..65535>, status: Enum<SUBSCRIPTION_STATUS, active, paused, cancelled, expired>, last_payment: Uint<0..4294967295>, next_payment: Uint<0..4294967295>, payment_count: Uint<0..4294967295>>',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_7.toValue(result_0),
      alignment: _descriptor_7.alignment()
    });
    return result_0;
  }
  #_set_subscription_info_0(context, partialProofData, subscription_id_0, info_0)
  {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.set_subscription_info(witnessContext_0,
                                                                                subscription_id_0,
                                                                                info_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(Array.isArray(result_0) && result_0.length === 0 ))
      __compactRuntime.type_error('set_subscription_info',
                                  'return value',
                                  'pay.compact line 27 char 1',
                                  '[]',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: [],
      alignment: []
    });
    return result_0;
  }
  #_calculate_percentage_fee_0(context,
                               partialProofData,
                               amount_0,
                               fee_basis_points_0)
  {
    const witnessContext_0 = __compactRuntime.witnessContext(ledger(context.transactionContext.state), context.currentPrivateState, context.transactionContext.address);
    const [nextPrivateState_0, result_0] = this.witnesses.calculate_percentage_fee(witnessContext_0,
                                                                                   amount_0,
                                                                                   fee_basis_points_0);
    context.currentPrivateState = nextPrivateState_0;
    if (!(typeof(result_0) === 'bigint' && result_0 >= 0 && result_0 <= 18446744073709551615n))
      __compactRuntime.type_error('calculate_percentage_fee',
                                  'return value',
                                  'pay.compact line 30 char 1',
                                  'Uint<0..18446744073709551615>',
                                  result_0)
    partialProofData.privateTranscriptOutputs.push({
      value: _descriptor_3.toValue(result_0),
      alignment: _descriptor_3.alignment()
    });
    return result_0;
  }
  #_deposit_customer_funds_0(context, partialProofData, customer_id_0, amount_0)
  {
    __compactRuntime.assert(this.#_validate_deposit_amount_0(context,
                                                             partialProofData,
                                                             amount_0),
                            'Invalid deposit amount');
    const current_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_13.toValue(2n),
                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(customer_id_0),
                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value)
                              ?
                              _descriptor_3.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_13.toValue(2n),
                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_0.toValue(customer_id_0),
                                                                                                  alignment: _descriptor_0.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value)
                              :
                              0n;
    const new_balance_0 = this.#_calculate_deposit_0(context,
                                                     partialProofData,
                                                     current_balance_0,
                                                     amount_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(2n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(customer_id_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(new_balance_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_0 = ((t1) => {
                    if (t1 > 18446744073709551615n)
                      throw new __compactRuntime.CompactError('pay.compact line 58 char 27: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                    return t1;
                  })(_descriptor_3.fromValue(Contract._query(context,
                                                             partialProofData,
                                                             [
                                                              { dup: { n: 0 } },
                                                              { idx: { cached: false,
                                                                       pushPath: false,
                                                                       path: [
                                                                              { tag: 'value',
                                                                                value: { value: _descriptor_13.toValue(7n),
                                                                                         alignment: _descriptor_13.alignment() } }] } },
                                                              { popeq: { cached: false,
                                                                         result: undefined } }]).value)
                     +
                     amount_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(7n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_withdraw_customer_funds_0(context, partialProofData, customer_id_0, amount_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(2n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(customer_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Customer account not found');
    const current_balance_0 = _descriptor_3.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_13.toValue(2n),
                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_0.toValue(customer_id_0),
                                                                                                  alignment: _descriptor_0.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value);
    __compactRuntime.assert(this.#_validate_withdrawal_amount_0(context,
                                                                partialProofData,
                                                                amount_0,
                                                                current_balance_0),
                            'Invalid withdrawal amount');
    const new_balance_0 = this.#_calculate_withdrawal_0(context,
                                                        partialProofData,
                                                        current_balance_0,
                                                        amount_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(2n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(customer_id_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(new_balance_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    let t_0;
    const tmp_0 = (t_0 = _descriptor_3.fromValue(Contract._query(context,
                                                                 partialProofData,
                                                                 [
                                                                  { dup: { n: 0 } },
                                                                  { idx: { cached: false,
                                                                           pushPath: false,
                                                                           path: [
                                                                                  { tag: 'value',
                                                                                    value: { value: _descriptor_13.toValue(7n),
                                                                                             alignment: _descriptor_13.alignment() } }] } },
                                                                  { popeq: { cached: false,
                                                                             result: undefined } }]).value),
                   (__compactRuntime.assert(!(t_0 < amount_0),
                                            'result of subtraction would be negative'),
                    t_0 - amount_0));
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(7n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_withdraw_merchant_earnings_0(context,
                                 partialProofData,
                                 merchant_id_0,
                                 amount_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(0n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Merchant not found');
    const current_balance_0 = _descriptor_2.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_13.toValue(3n),
                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                       { push: { storage: false,
                                                                                 value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_id_0),
                                                                                                                              alignment: _descriptor_0.alignment() }).encode() } },
                                                                       'member',
                                                                       { popeq: { cached: true,
                                                                                  result: undefined } }]).value)
                              ?
                              _descriptor_3.fromValue(Contract._query(context,
                                                                      partialProofData,
                                                                      [
                                                                       { dup: { n: 0 } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_13.toValue(3n),
                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                       { idx: { cached: false,
                                                                                pushPath: false,
                                                                                path: [
                                                                                       { tag: 'value',
                                                                                         value: { value: _descriptor_0.toValue(merchant_id_0),
                                                                                                  alignment: _descriptor_0.alignment() } }] } },
                                                                       { popeq: { cached: false,
                                                                                  result: undefined } }]).value)
                              :
                              0n;
    __compactRuntime.assert(this.#_validate_withdrawal_amount_0(context,
                                                                partialProofData,
                                                                amount_0,
                                                                current_balance_0),
                            'Invalid withdrawal amount');
    const new_balance_0 = this.#_calculate_withdrawal_0(context,
                                                        partialProofData,
                                                        current_balance_0,
                                                        amount_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(3n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_id_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(new_balance_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    let t_0;
    const tmp_0 = (t_0 = _descriptor_3.fromValue(Contract._query(context,
                                                                 partialProofData,
                                                                 [
                                                                  { dup: { n: 0 } },
                                                                  { idx: { cached: false,
                                                                           pushPath: false,
                                                                           path: [
                                                                                  { tag: 'value',
                                                                                    value: { value: _descriptor_13.toValue(7n),
                                                                                             alignment: _descriptor_13.alignment() } }] } },
                                                                  { popeq: { cached: false,
                                                                             result: undefined } }]).value),
                   (__compactRuntime.assert(!(t_0 < amount_0),
                                            'result of subtraction would be negative'),
                    t_0 - amount_0));
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(7n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_register_merchant_0(context,
                        partialProofData,
                        merchant_id_0,
                        business_name_0)
  {
    __compactRuntime.assert(!_descriptor_2.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_13.toValue(0n),
                                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_id_0),
                                                                                                                             alignment: _descriptor_0.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value),
                            'Merchant already exists');
    const merchant_hash_0 = this.#_hash_merchant_id_0(context,
                                                      partialProofData,
                                                      merchant_id_0);
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(0n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_id_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_hash_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_0 = 1n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(5n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                            { value: _descriptor_4.toValue(tmp_0),
                                              alignment: _descriptor_4.alignment() }
                                              .value
                                          )) } },
                     { ins: { cached: true, n: 1 } }]);
    const merchant_info_0 = { merchant_id: merchant_id_0,
                              business_name: business_name_0,
                              tier: 0,
                              transaction_count: 0n,
                              total_volume: 0n,
                              created_at:
                                _descriptor_1.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_13.toValue(8n),
                                                                                                    alignment: _descriptor_13.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value),
                              is_active: true };
    this.#_set_merchant_info_0(context,
                               partialProofData,
                               merchant_id_0,
                               merchant_info_0);
    return [];
  }
  #_create_subscription_0(context,
                          partialProofData,
                          merchant_id_0,
                          customer_id_0,
                          amount_0,
                          max_amount_0,
                          frequency_days_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(0n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(merchant_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Merchant not found');
    const subscription_id_0 = this.#_hash_subscription_id_0(context,
                                                            partialProofData,
                                                            merchant_id_0,
                                                            customer_id_0,
                                                            _descriptor_1.fromValue(Contract._query(context,
                                                                                                    partialProofData,
                                                                                                    [
                                                                                                     { dup: { n: 0 } },
                                                                                                     { idx: { cached: false,
                                                                                                              pushPath: false,
                                                                                                              path: [
                                                                                                                     { tag: 'value',
                                                                                                                       value: { value: _descriptor_13.toValue(8n),
                                                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                                                     { popeq: { cached: false,
                                                                                                                result: undefined } }]).value));
    __compactRuntime.assert(!_descriptor_2.fromValue(Contract._query(context,
                                                                     partialProofData,
                                                                     [
                                                                      { dup: { n: 0 } },
                                                                      { idx: { cached: false,
                                                                               pushPath: false,
                                                                               path: [
                                                                                      { tag: 'value',
                                                                                        value: { value: _descriptor_13.toValue(1n),
                                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                                      { push: { storage: false,
                                                                                value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_id_0),
                                                                                                                             alignment: _descriptor_0.alignment() }).encode() } },
                                                                      'member',
                                                                      { popeq: { cached: true,
                                                                                 result: undefined } }]).value),
                            'Subscription already exists');
    const subscription_0 = { subscription_id: subscription_id_0,
                             merchant_id: merchant_id_0,
                             customer_id: customer_id_0,
                             amount: amount_0,
                             max_amount: max_amount_0,
                             frequency_days:
                               ((t1) => {
                                 if (t1 > 65535n)
                                   throw new __compactRuntime.CompactError('pay.compact line 161 char 30: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 65535');
                                 return t1;
                               })(frequency_days_0),
                             status: 0,
                             last_payment:
                               _descriptor_1.fromValue(Contract._query(context,
                                                                       partialProofData,
                                                                       [
                                                                        { dup: { n: 0 } },
                                                                        { idx: { cached: false,
                                                                                 pushPath: false,
                                                                                 path: [
                                                                                        { tag: 'value',
                                                                                          value: { value: _descriptor_13.toValue(8n),
                                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                                        { popeq: { cached: false,
                                                                                   result: undefined } }]).value),
                             next_payment:
                               ((t1) => {
                                 if (t1 > 4294967295n)
                                   throw new __compactRuntime.CompactError('pay.compact line 164 char 19: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                 return t1;
                               })(_descriptor_1.fromValue(Contract._query(context,
                                                                          partialProofData,
                                                                          [
                                                                           { dup: { n: 0 } },
                                                                           { idx: { cached: false,
                                                                                    pushPath: false,
                                                                                    path: [
                                                                                           { tag: 'value',
                                                                                             value: { value: _descriptor_13.toValue(8n),
                                                                                                      alignment: _descriptor_13.alignment() } }] } },
                                                                           { popeq: { cached: false,
                                                                                      result: undefined } }]).value)
                                  +
                                  ((t1) => {
                                    if (t1 > 18446744073709551615n)
                                      throw new __compactRuntime.CompactError('pay.compact line 164 char 40: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                                    return t1;
                                  })(frequency_days_0 * 86400n)),
                             payment_count: 0n };
    const subscription_hash_0 = this.#_hash_subscription_id_0(context,
                                                              partialProofData,
                                                              merchant_id_0,
                                                              customer_id_0,
                                                              _descriptor_1.fromValue(Contract._query(context,
                                                                                                      partialProofData,
                                                                                                      [
                                                                                                       { dup: { n: 0 } },
                                                                                                       { idx: { cached: false,
                                                                                                                pushPath: false,
                                                                                                                path: [
                                                                                                                       { tag: 'value',
                                                                                                                         value: { value: _descriptor_13.toValue(8n),
                                                                                                                                  alignment: _descriptor_13.alignment() } }] } },
                                                                                                       { popeq: { cached: false,
                                                                                                                  result: undefined } }]).value));
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(1n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_id_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_hash_0),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_0 = 1n;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(6n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { addi: { immediate: parseInt(__compactRuntime.valueToBigInt(
                                            { value: _descriptor_4.toValue(tmp_0),
                                              alignment: _descriptor_4.alignment() }
                                              .value
                                          )) } },
                     { ins: { cached: true, n: 1 } }]);
    this.#_set_subscription_info_0(context,
                                   partialProofData,
                                   subscription_id_0,
                                   subscription_0);
    const current_count_0 = this.#_customer_subscription_count_0(context,
                                                                 partialProofData,
                                                                 customer_id_0);
    this.#_set_customer_subscription_count_0(context,
                                             partialProofData,
                                             customer_id_0,
                                             ((t1) => {
                                               if (t1 > 4294967295n)
                                                 throw new __compactRuntime.CompactError('pay.compact line 178 char 49: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                               return t1;
                                             })(current_count_0 + 1n));
    return subscription_id_0;
  }
  #_pause_subscription_0(context,
                         partialProofData,
                         subscription_id_0,
                         customer_id_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(1n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Subscription not found');
    const subscription_0 = this.#_subscription_info_0(context,
                                                      partialProofData,
                                                      subscription_id_0);
    __compactRuntime.assert(this.#_equal_0(subscription_0.customer_id,
                                           customer_id_0),
                            'Unauthorized access');
    __compactRuntime.assert(subscription_0.status === 0,
                            'Subscription not active');
    const updated_subscription_0 = { subscription_id:
                                       subscription_0.subscription_id,
                                     merchant_id: subscription_0.merchant_id,
                                     customer_id: subscription_0.customer_id,
                                     amount: subscription_0.amount,
                                     max_amount: subscription_0.max_amount,
                                     frequency_days:
                                       subscription_0.frequency_days,
                                     status: 1,
                                     last_payment: subscription_0.last_payment,
                                     next_payment: subscription_0.next_payment,
                                     payment_count: subscription_0.payment_count };
    this.#_set_subscription_info_0(context,
                                   partialProofData,
                                   subscription_id_0,
                                   updated_subscription_0);
    const current_count_0 = this.#_customer_subscription_count_0(context,
                                                                 partialProofData,
                                                                 customer_id_0);
    let t_0;
    const new_count_0 = current_count_0 > 0n ?
                        (t_0 = current_count_0,
                         (__compactRuntime.assert(!(t_0 < 1n),
                                                  'result of subtraction would be negative'),
                          t_0 - 1n))
                        :
                        0n;
    this.#_set_customer_subscription_count_0(context,
                                             partialProofData,
                                             customer_id_0,
                                             new_count_0);
    return [];
  }
  #_resume_subscription_0(context,
                          partialProofData,
                          subscription_id_0,
                          customer_id_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(1n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Subscription not found');
    const subscription_0 = this.#_subscription_info_0(context,
                                                      partialProofData,
                                                      subscription_id_0);
    __compactRuntime.assert(this.#_equal_1(subscription_0.customer_id,
                                           customer_id_0),
                            'Unauthorized access');
    __compactRuntime.assert(subscription_0.status === 1,
                            'Subscription not paused');
    const updated_subscription_0 = { subscription_id:
                                       subscription_0.subscription_id,
                                     merchant_id: subscription_0.merchant_id,
                                     customer_id: subscription_0.customer_id,
                                     amount: subscription_0.amount,
                                     max_amount: subscription_0.max_amount,
                                     frequency_days:
                                       subscription_0.frequency_days,
                                     status: 0,
                                     last_payment: subscription_0.last_payment,
                                     next_payment: subscription_0.next_payment,
                                     payment_count: subscription_0.payment_count };
    this.#_set_subscription_info_0(context,
                                   partialProofData,
                                   subscription_id_0,
                                   updated_subscription_0);
    const current_count_0 = this.#_customer_subscription_count_0(context,
                                                                 partialProofData,
                                                                 customer_id_0);
    this.#_set_customer_subscription_count_0(context,
                                             partialProofData,
                                             customer_id_0,
                                             ((t1) => {
                                               if (t1 > 4294967295n)
                                                 throw new __compactRuntime.CompactError('pay.compact line 259 char 49: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                               return t1;
                                             })(current_count_0 + 1n));
    return [];
  }
  #_cancel_subscription_0(context,
                          partialProofData,
                          subscription_id_0,
                          customer_id_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(1n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Subscription not found');
    const subscription_0 = this.#_subscription_info_0(context,
                                                      partialProofData,
                                                      subscription_id_0);
    __compactRuntime.assert(this.#_equal_2(subscription_0.customer_id,
                                           customer_id_0),
                            'Unauthorized access');
    __compactRuntime.assert(subscription_0.status !== 2,
                            'Subscription already cancelled');
    const updated_subscription_0 = { subscription_id:
                                       subscription_0.subscription_id,
                                     merchant_id: subscription_0.merchant_id,
                                     customer_id: subscription_0.customer_id,
                                     amount: subscription_0.amount,
                                     max_amount: subscription_0.max_amount,
                                     frequency_days:
                                       subscription_0.frequency_days,
                                     status: 2,
                                     last_payment: subscription_0.last_payment,
                                     next_payment: subscription_0.next_payment,
                                     payment_count: subscription_0.payment_count };
    this.#_set_subscription_info_0(context,
                                   partialProofData,
                                   subscription_id_0,
                                   updated_subscription_0);
    const was_active_0 = subscription_0.status === 0;
    const current_count_0 = this.#_customer_subscription_count_0(context,
                                                                 partialProofData,
                                                                 customer_id_0);
    let t_0;
    const new_count_0 = was_active_0 && current_count_0 > 0n ?
                        (t_0 = current_count_0,
                         (__compactRuntime.assert(!(t_0 < 1n),
                                                  'result of subtraction would be negative'),
                          t_0 - 1n))
                        :
                        current_count_0;
    this.#_set_customer_subscription_count_0(context,
                                             partialProofData,
                                             customer_id_0,
                                             new_count_0);
    return [];
  }
  #_process_subscription_payment_0(context,
                                   partialProofData,
                                   subscription_id_0,
                                   service_proof_0)
  {
    __compactRuntime.assert(_descriptor_2.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(1n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { push: { storage: false,
                                                                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(subscription_id_0),
                                                                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                                                                     'member',
                                                                     { popeq: { cached: true,
                                                                                result: undefined } }]).value),
                            'Subscription not found');
    const subscription_0 = this.#_subscription_info_0(context,
                                                      partialProofData,
                                                      subscription_id_0);
    __compactRuntime.assert(subscription_0.status === 0,
                            'Subscription not active');
    const is_due_0 = this.#_is_subscription_due_0(context,
                                                  partialProofData,
                                                  subscription_0.last_payment,
                                                  subscription_0.frequency_days,
                                                  _descriptor_1.fromValue(Contract._query(context,
                                                                                          partialProofData,
                                                                                          [
                                                                                           { dup: { n: 0 } },
                                                                                           { idx: { cached: false,
                                                                                                    pushPath: false,
                                                                                                    path: [
                                                                                                           { tag: 'value',
                                                                                                             value: { value: _descriptor_13.toValue(8n),
                                                                                                                      alignment: _descriptor_13.alignment() } }] } },
                                                                                           { popeq: { cached: false,
                                                                                                      result: undefined } }]).value));
    __compactRuntime.assert(is_due_0, 'Payment not due yet');
    let tmp_0, tmp_1;
    const customer_balance_0 = (tmp_0 = subscription_0.customer_id,
                                _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_13.toValue(2n),
                                                                                                    alignment: _descriptor_13.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_0),
                                                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value))
                               ?
                               (tmp_1 = subscription_0.customer_id,
                                _descriptor_3.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_13.toValue(2n),
                                                                                                    alignment: _descriptor_13.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_0.toValue(tmp_1),
                                                                                                    alignment: _descriptor_0.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value))
                               :
                               0n;
    __compactRuntime.assert(this.#_validate_balance_0(context,
                                                      partialProofData,
                                                      customer_balance_0,
                                                      subscription_0.amount),
                            'Insufficient customer balance');
    let tmp_2, tmp_3;
    const merchant_balance_0 = (tmp_2 = subscription_0.merchant_id,
                                _descriptor_2.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_13.toValue(3n),
                                                                                                    alignment: _descriptor_13.alignment() } }] } },
                                                                         { push: { storage: false,
                                                                                   value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_2),
                                                                                                                                alignment: _descriptor_0.alignment() }).encode() } },
                                                                         'member',
                                                                         { popeq: { cached: true,
                                                                                    result: undefined } }]).value))
                               ?
                               (tmp_3 = subscription_0.merchant_id,
                                _descriptor_3.fromValue(Contract._query(context,
                                                                        partialProofData,
                                                                        [
                                                                         { dup: { n: 0 } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_13.toValue(3n),
                                                                                                    alignment: _descriptor_13.alignment() } }] } },
                                                                         { idx: { cached: false,
                                                                                  pushPath: false,
                                                                                  path: [
                                                                                         { tag: 'value',
                                                                                           value: { value: _descriptor_0.toValue(tmp_3),
                                                                                                    alignment: _descriptor_0.alignment() } }] } },
                                                                         { popeq: { cached: false,
                                                                                    result: undefined } }]).value))
                               :
                               0n;
    const merchant_data_0 = this.#_merchant_info_0(context,
                                                   partialProofData,
                                                   subscription_0.merchant_id);
    const fee_basis_points_0 = this.#_calculate_fee_basis_points_0(context,
                                                                   partialProofData,
                                                                   merchant_data_0.tier);
    const fee_amount_0 = this.#_calculate_percentage_fee_0(context,
                                                           partialProofData,
                                                           subscription_0.amount,
                                                           fee_basis_points_0);
    const fee_valid_0 = this.#_verify_fee_calculation_0(context,
                                                        partialProofData,
                                                        subscription_0.amount,
                                                        fee_basis_points_0,
                                                        fee_amount_0);
    __compactRuntime.assert(fee_valid_0, 'Invalid fee calculation');
    let t_0;
    const net_amount_0 = subscription_0.amount > fee_amount_0 ?
                         (t_0 = subscription_0.amount,
                          (__compactRuntime.assert(!(t_0 < fee_amount_0),
                                                   'result of subtraction would be negative'),
                           t_0 - fee_amount_0))
                         :
                         0n;
    const customer_new_balance_0 = this.#_calculate_withdrawal_0(context,
                                                                 partialProofData,
                                                                 customer_balance_0,
                                                                 subscription_0.amount);
    const merchant_new_balance_0 = this.#_calculate_deposit_0(context,
                                                              partialProofData,
                                                              merchant_balance_0,
                                                              net_amount_0);
    const tmp_4 = subscription_0.customer_id;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(2n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_4),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(customer_new_balance_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    const tmp_5 = subscription_0.merchant_id;
    Contract._query(context,
                    partialProofData,
                    [
                     { idx: { cached: false,
                              pushPath: true,
                              path: [
                                     { tag: 'value',
                                       value: { value: _descriptor_13.toValue(3n),
                                                alignment: _descriptor_13.alignment() } }] } },
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(tmp_5),
                                                                            alignment: _descriptor_0.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(merchant_new_balance_0),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } },
                     { ins: { cached: true, n: 1 } }]);
    let t_1;
    const tmp_6 = (t_1 = _descriptor_3.fromValue(Contract._query(context,
                                                                 partialProofData,
                                                                 [
                                                                  { dup: { n: 0 } },
                                                                  { idx: { cached: false,
                                                                           pushPath: false,
                                                                           path: [
                                                                                  { tag: 'value',
                                                                                    value: { value: _descriptor_13.toValue(7n),
                                                                                             alignment: _descriptor_13.alignment() } }] } },
                                                                  { popeq: { cached: false,
                                                                             result: undefined } }]).value),
                   (__compactRuntime.assert(!(t_1 < fee_amount_0),
                                            'result of subtraction would be negative'),
                    t_1 - fee_amount_0));
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(7n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(tmp_6),
                                                                            alignment: _descriptor_3.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    const updated_subscription_0 = { subscription_id:
                                       subscription_0.subscription_id,
                                     merchant_id: subscription_0.merchant_id,
                                     customer_id: subscription_0.customer_id,
                                     amount: subscription_0.amount,
                                     max_amount: subscription_0.max_amount,
                                     frequency_days:
                                       subscription_0.frequency_days,
                                     status: subscription_0.status,
                                     last_payment:
                                       _descriptor_1.fromValue(Contract._query(context,
                                                                               partialProofData,
                                                                               [
                                                                                { dup: { n: 0 } },
                                                                                { idx: { cached: false,
                                                                                         pushPath: false,
                                                                                         path: [
                                                                                                { tag: 'value',
                                                                                                  value: { value: _descriptor_13.toValue(8n),
                                                                                                           alignment: _descriptor_13.alignment() } }] } },
                                                                                { popeq: { cached: false,
                                                                                           result: undefined } }]).value),
                                     next_payment:
                                       ((t1) => {
                                         if (t1 > 4294967295n)
                                           throw new __compactRuntime.CompactError('pay.compact line 371 char 19: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                         return t1;
                                       })(_descriptor_1.fromValue(Contract._query(context,
                                                                                  partialProofData,
                                                                                  [
                                                                                   { dup: { n: 0 } },
                                                                                   { idx: { cached: false,
                                                                                            pushPath: false,
                                                                                            path: [
                                                                                                   { tag: 'value',
                                                                                                     value: { value: _descriptor_13.toValue(8n),
                                                                                                              alignment: _descriptor_13.alignment() } }] } },
                                                                                   { popeq: { cached: false,
                                                                                              result: undefined } }]).value)
                                          +
                                          ((t1) => {
                                            if (t1 > 4294967295n)
                                              throw new __compactRuntime.CompactError('pay.compact line 371 char 40: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                            return t1;
                                          })(subscription_0.frequency_days
                                             *
                                             86400n)),
                                     payment_count:
                                       ((t1) => {
                                         if (t1 > 4294967295n)
                                           throw new __compactRuntime.CompactError('pay.compact line 372 char 21: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                         return t1;
                                       })(subscription_0.payment_count + 1n) };
    this.#_set_subscription_info_0(context,
                                   partialProofData,
                                   subscription_id_0,
                                   updated_subscription_0);
    const updated_merchant_info_0 = { merchant_id: merchant_data_0.merchant_id,
                                      business_name:
                                        merchant_data_0.business_name,
                                      tier:
                                        this.#_calculate_merchant_tier_0(context,
                                                                         partialProofData,
                                                                         ((t1) => {
                                                                           if (t1 > 4294967295n)
                                                                             throw new __compactRuntime.CompactError('pay.compact line 383 char 39: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                                                           return t1;
                                                                         })(merchant_data_0.transaction_count
                                                                            +
                                                                            1n)),
                                      transaction_count:
                                        ((t1) => {
                                          if (t1 > 4294967295n)
                                            throw new __compactRuntime.CompactError('pay.compact line 384 char 25: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 4294967295');
                                          return t1;
                                        })(merchant_data_0.transaction_count
                                           +
                                           1n),
                                      total_volume:
                                        ((t1) => {
                                          if (t1 > 18446744073709551615n)
                                            throw new __compactRuntime.CompactError('pay.compact line 385 char 19: cast from unsigned value to smaller unsigned value failed: ' + t1 + ' is greater than 18446744073709551615');
                                          return t1;
                                        })(merchant_data_0.total_volume
                                           +
                                           subscription_0.amount),
                                      created_at: merchant_data_0.created_at,
                                      is_active: merchant_data_0.is_active };
    this.#_set_merchant_info_0(context,
                               partialProofData,
                               subscription_0.merchant_id,
                               updated_merchant_info_0);
    return [];
  }
  #_prove_active_subscriptions_count_0(context,
                                       partialProofData,
                                       customer_id_0,
                                       threshold_0)
  {
    const active_count_0 = this.#_customer_subscription_count_0(context,
                                                                partialProofData,
                                                                customer_id_0);
    return active_count_0 >= threshold_0;
  }
  #_update_timestamp_0(context, partialProofData, new_timestamp_0) {
    __compactRuntime.assert(new_timestamp_0
                            >
                            _descriptor_1.fromValue(Contract._query(context,
                                                                    partialProofData,
                                                                    [
                                                                     { dup: { n: 0 } },
                                                                     { idx: { cached: false,
                                                                              pushPath: false,
                                                                              path: [
                                                                                     { tag: 'value',
                                                                                       value: { value: _descriptor_13.toValue(8n),
                                                                                                alignment: _descriptor_13.alignment() } }] } },
                                                                     { popeq: { cached: false,
                                                                                result: undefined } }]).value),
                            'Timestamp must be in the future');
    Contract._query(context,
                    partialProofData,
                    [
                     { push: { storage: false,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_13.toValue(8n),
                                                                            alignment: _descriptor_13.alignment() }).encode() } },
                     { push: { storage: true,
                               value: __compactRuntime.StateValue.newCell({ value: _descriptor_1.toValue(new_timestamp_0),
                                                                            alignment: _descriptor_1.alignment() }).encode() } },
                     { ins: { cached: false, n: 1 } }]);
    return [];
  }
  #_equal_0(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_1(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  #_equal_2(x0, y0) {
    if (!x0.every((x, i) => y0[i] === x)) return false;
    return true;
  }
  static _query(context, partialProofData, prog) {
    var res;
    try {
      res = context.transactionContext.query(prog, __compactRuntime.CostModel.dummyCostModel());
    } catch (err) {
      throw new __compactRuntime.CompactError(err.toString());
    }
    context.transactionContext = res.context;
    var reads = res.events.filter((e) => e.tag === 'read');
    var i = 0;
    partialProofData.publicTranscript = partialProofData.publicTranscript.concat(prog.map((op) => {
      if(typeof(op) === 'object' && 'popeq' in op) {
        return { popeq: {
          ...op.popeq,
          result: reads[i++].content,
        } };
      } else {
        return op;
      }
    }));
    if(res.events.length == 1 && res.events[0].tag === 'read') {
      return res.events[0].content;
    } else {
      return res.events;
    }
  }
}
function ledger(state) {
  const context = {
    originalState: state,
    transactionContext: new __compactRuntime.QueryContext(state, __compactRuntime.dummyContractAddress())
  };
  const partialProofData = {
    input: { value: [], alignment: [] },
    output: undefined,
    publicTranscript: [],
    privateTranscriptOutputs: []
  };
  return {
    merchant_accounts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                               alignment: _descriptor_3.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'pay.compact line 11 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'pay.compact line 11 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(0n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_0.toValue(key_0),
                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[0];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    subscription_accounts: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(1n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                               alignment: _descriptor_3.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(1n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'pay.compact line 12 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(1n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'pay.compact line 12 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_0.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(1n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_0.toValue(key_0),
                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[1];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_0.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    customer_balances: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(2n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                               alignment: _descriptor_3.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(2n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'pay.compact line 13 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(2n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'pay.compact line 13 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(2n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_0.toValue(key_0),
                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[2];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_3.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    merchant_balances: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(3n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                               alignment: _descriptor_3.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(3n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'pay.compact line 14 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(3n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'pay.compact line 14 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(3n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_0.toValue(key_0),
                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[3];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_3.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    locked_balances: {
      isEmpty(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`isEmpty: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(4n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_3.toValue(0n),
                                                                                                               alignment: _descriptor_3.alignment() }).encode() } },
                                                        'eq',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      size(...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`size: expected 0 arguments, received ${args_0.length}`);
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(4n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        'size',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      member(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`member: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('member',
                                      'argument 1',
                                      'pay.compact line 15 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_2.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(4n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { push: { storage: false,
                                                                  value: __compactRuntime.StateValue.newCell({ value: _descriptor_0.toValue(key_0),
                                                                                                               alignment: _descriptor_0.alignment() }).encode() } },
                                                        'member',
                                                        { popeq: { cached: true,
                                                                   result: undefined } }]).value);
      },
      lookup(...args_0) {
        if (args_0.length !== 1)
          throw new __compactRuntime.CompactError(`lookup: expected 1 argument, received ${args_0.length}`);
        const key_0 = args_0[0];
        if (!(key_0.buffer instanceof ArrayBuffer && key_0.BYTES_PER_ELEMENT === 1 && key_0.length === 32))
          __compactRuntime.type_error('lookup',
                                      'argument 1',
                                      'pay.compact line 15 char 1',
                                      'Bytes<32>',
                                      key_0)
        return _descriptor_3.fromValue(Contract._query(context,
                                                       partialProofData,
                                                       [
                                                        { dup: { n: 0 } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_13.toValue(4n),
                                                                                   alignment: _descriptor_13.alignment() } }] } },
                                                        { idx: { cached: false,
                                                                 pushPath: false,
                                                                 path: [
                                                                        { tag: 'value',
                                                                          value: { value: _descriptor_0.toValue(key_0),
                                                                                   alignment: _descriptor_0.alignment() } }] } },
                                                        { popeq: { cached: false,
                                                                   result: undefined } }]).value);
      },
      [Symbol.iterator](...args_0) {
        if (args_0.length !== 0)
          throw new __compactRuntime.CompactError(`iter: expected 0 arguments, received ${args_0.length}`);
        const self_0 = state.asArray()[4];
        return self_0.asMap().keys().map(  (key) => {    const value = self_0.asMap().get(key).asCell();    return [      _descriptor_0.fromValue(key.value),      _descriptor_3.fromValue(value.value)    ];  })[Symbol.iterator]();
      }
    },
    get total_merchants() {
      return _descriptor_3.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_13.toValue(5n),
                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                      { popeq: { cached: true,
                                                                 result: undefined } }]).value);
    },
    get total_subscriptions() {
      return _descriptor_3.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_13.toValue(6n),
                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                      { popeq: { cached: true,
                                                                 result: undefined } }]).value);
    },
    get total_supply() {
      return _descriptor_3.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_13.toValue(7n),
                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    },
    get current_timestamp() {
      return _descriptor_1.fromValue(Contract._query(context,
                                                     partialProofData,
                                                     [
                                                      { dup: { n: 0 } },
                                                      { idx: { cached: false,
                                                               pushPath: false,
                                                               path: [
                                                                      { tag: 'value',
                                                                        value: { value: _descriptor_13.toValue(8n),
                                                                                 alignment: _descriptor_13.alignment() } }] } },
                                                      { popeq: { cached: false,
                                                                 result: undefined } }]).value);
    }
  };
}
const _emptyContext = {
  originalState: new __compactRuntime.ContractState(),
  transactionContext: new __compactRuntime.QueryContext(new __compactRuntime.ContractState().data, __compactRuntime.dummyContractAddress())
};
const _dummyContract = new Contract({
  merchant_info: (...args) => undefined,
  set_merchant_info: (...args) => undefined,
  customer_subscription_count: (...args) => undefined,
  set_customer_subscription_count: (...args) => undefined,
  subscription_info: (...args) => undefined,
  set_subscription_info: (...args) => undefined,
  calculate_percentage_fee: (...args) => undefined
});
const pureCircuits = { };
const contractReferenceLocations = { tag: 'publicLedgerArray', indices: { } };
exports.Contract = Contract;
exports.ledger = ledger;
exports.pureCircuits = pureCircuits;
exports.contractReferenceLocations = contractReferenceLocations;
//# sourceMappingURL=index.cjs.map
