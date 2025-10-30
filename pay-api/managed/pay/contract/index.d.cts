import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<T> = {
  merchant_info(context: __compactRuntime.WitnessContext<Ledger, T>,
                merchant_id_0: Uint8Array): [T, { merchant_id: Uint8Array,
                                                  business_name: Uint8Array,
                                                  tier: number,
                                                  transaction_count: bigint,
                                                  total_volume: bigint,
                                                  created_at: bigint,
                                                  is_active: boolean
                                                }];
  set_merchant_info(context: __compactRuntime.WitnessContext<Ledger, T>,
                    merchant_id_0: Uint8Array,
                    info_0: { merchant_id: Uint8Array,
                              business_name: Uint8Array,
                              tier: number,
                              transaction_count: bigint,
                              total_volume: bigint,
                              created_at: bigint,
                              is_active: boolean
                            }): [T, []];
  customer_subscription_count(context: __compactRuntime.WitnessContext<Ledger, T>,
                              customer_id_0: Uint8Array): [T, bigint];
  set_customer_subscription_count(context: __compactRuntime.WitnessContext<Ledger, T>,
                                  customer_id_0: Uint8Array,
                                  count_0: bigint): [T, []];
  subscription_info(context: __compactRuntime.WitnessContext<Ledger, T>,
                    subscription_id_0: Uint8Array): [T, { subscription_id: Uint8Array,
                                                          merchant_id: Uint8Array,
                                                          customer_id: Uint8Array,
                                                          amount: bigint,
                                                          max_amount: bigint,
                                                          frequency_days: bigint,
                                                          status: number,
                                                          last_payment: bigint,
                                                          next_payment: bigint,
                                                          payment_count: bigint
                                                        }];
  set_subscription_info(context: __compactRuntime.WitnessContext<Ledger, T>,
                        subscription_id_0: Uint8Array,
                        info_0: { subscription_id: Uint8Array,
                                  merchant_id: Uint8Array,
                                  customer_id: Uint8Array,
                                  amount: bigint,
                                  max_amount: bigint,
                                  frequency_days: bigint,
                                  status: number,
                                  last_payment: bigint,
                                  next_payment: bigint,
                                  payment_count: bigint
                                }): [T, []];
  calculate_percentage_fee(context: __compactRuntime.WitnessContext<Ledger, T>,
                           amount_0: bigint,
                           fee_basis_points_0: bigint): [T, bigint];
}

export type ImpureCircuits<T> = {
  deposit_customer_funds(context: __compactRuntime.CircuitContext<T>,
                         customer_id_0: Uint8Array,
                         amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  withdraw_customer_funds(context: __compactRuntime.CircuitContext<T>,
                          customer_id_0: Uint8Array,
                          amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  withdraw_merchant_earnings(context: __compactRuntime.CircuitContext<T>,
                             merchant_id_0: Uint8Array,
                             amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  register_merchant(context: __compactRuntime.CircuitContext<T>,
                    merchant_id_0: Uint8Array,
                    business_name_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  create_subscription(context: __compactRuntime.CircuitContext<T>,
                      merchant_id_0: Uint8Array,
                      customer_id_0: Uint8Array,
                      amount_0: bigint,
                      max_amount_0: bigint,
                      frequency_days_0: bigint): __compactRuntime.CircuitResults<T, Uint8Array>;
  pause_subscription(context: __compactRuntime.CircuitContext<T>,
                     subscription_id_0: Uint8Array,
                     customer_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  resume_subscription(context: __compactRuntime.CircuitContext<T>,
                      subscription_id_0: Uint8Array,
                      customer_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  cancel_subscription(context: __compactRuntime.CircuitContext<T>,
                      subscription_id_0: Uint8Array,
                      customer_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  process_subscription_payment(context: __compactRuntime.CircuitContext<T>,
                               subscription_id_0: Uint8Array,
                               service_proof_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  prove_active_subscriptions_count(context: __compactRuntime.CircuitContext<T>,
                                   customer_id_0: Uint8Array,
                                   threshold_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  update_timestamp(context: __compactRuntime.CircuitContext<T>,
                   new_timestamp_0: bigint): __compactRuntime.CircuitResults<T, []>;
}

export type PureCircuits = {
}

export type Circuits<T> = {
  deposit_customer_funds(context: __compactRuntime.CircuitContext<T>,
                         customer_id_0: Uint8Array,
                         amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  withdraw_customer_funds(context: __compactRuntime.CircuitContext<T>,
                          customer_id_0: Uint8Array,
                          amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  withdraw_merchant_earnings(context: __compactRuntime.CircuitContext<T>,
                             merchant_id_0: Uint8Array,
                             amount_0: bigint): __compactRuntime.CircuitResults<T, []>;
  register_merchant(context: __compactRuntime.CircuitContext<T>,
                    merchant_id_0: Uint8Array,
                    business_name_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  create_subscription(context: __compactRuntime.CircuitContext<T>,
                      merchant_id_0: Uint8Array,
                      customer_id_0: Uint8Array,
                      amount_0: bigint,
                      max_amount_0: bigint,
                      frequency_days_0: bigint): __compactRuntime.CircuitResults<T, Uint8Array>;
  pause_subscription(context: __compactRuntime.CircuitContext<T>,
                     subscription_id_0: Uint8Array,
                     customer_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  resume_subscription(context: __compactRuntime.CircuitContext<T>,
                      subscription_id_0: Uint8Array,
                      customer_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  cancel_subscription(context: __compactRuntime.CircuitContext<T>,
                      subscription_id_0: Uint8Array,
                      customer_id_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  process_subscription_payment(context: __compactRuntime.CircuitContext<T>,
                               subscription_id_0: Uint8Array,
                               service_proof_0: Uint8Array): __compactRuntime.CircuitResults<T, []>;
  prove_active_subscriptions_count(context: __compactRuntime.CircuitContext<T>,
                                   customer_id_0: Uint8Array,
                                   threshold_0: bigint): __compactRuntime.CircuitResults<T, boolean>;
  update_timestamp(context: __compactRuntime.CircuitContext<T>,
                   new_timestamp_0: bigint): __compactRuntime.CircuitResults<T, []>;
}

export type Ledger = {
  merchant_accounts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  subscription_accounts: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
  customer_balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  merchant_balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  locked_balances: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): bigint;
    [Symbol.iterator](): Iterator<[Uint8Array, bigint]>
  };
  readonly total_merchants: bigint;
  readonly total_subscriptions: bigint;
  readonly total_supply: bigint;
  readonly current_timestamp: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<T, W extends Witnesses<T> = Witnesses<T>> {
  witnesses: W;
  circuits: Circuits<T>;
  impureCircuits: ImpureCircuits<T>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<T>): __compactRuntime.ConstructorResult<T>;
}

export declare function ledger(state: __compactRuntime.StateValue): Ledger;
export declare const pureCircuits: PureCircuits;
