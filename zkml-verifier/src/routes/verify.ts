/**
 * Verification Routes
 */

import type { FastifyPluginAsync } from 'fastify';
import type { VerifyProofRequest, VerifyProofResponse, GenerateProofRequest, GenerateProofResponse } from '../types.js';
import { ErrorCode } from '../types.js';
import { EZKLVerifier } from '../services/ezkl-verifier.js';
import { AttestationSigner } from '../services/attestation-signer.js';
import { ProviderService, loadVerifierConfig } from '../services/providers.js';
import { generateIncomeProof, ProofType as ZKMLProofType } from '@zksalaria/zkml-payroll';
import { Logger } from 'pino';

const verifyRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize services
  const verifier = new EZKLVerifier({
    vkPath: process.env.VK_PATH || '../zkml/examples/01-simple-threshold/vk.key',
    settingsPath: process.env.SETTINGS_PATH || '../zkml/examples/01-simple-threshold/settings.json',
    ezklPath: process.env.EZKL_PATH
  });

  const signer = new AttestationSigner(
    process.env.VERIFIER_SECRET_KEY || 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  );

  // Contract service will be initialized per-request when blockchain submission is enabled
  fastify.log.info('Blockchain submission will be attempted per-request if ENABLE_BLOCKCHAIN_SUBMISSION=true');

  fastify.log.info("Is blockchain enabled: " +  process.env.ENABLE_BLOCKCHAIN_SUBMISSION)
  // POST /verify-proof
  fastify.post<{
    Body: VerifyProofRequest;
  }>('/verify-proof', async (request, reply) => {
    const { proof, publicInputs } = request.body;

    if (!proof || !publicInputs) {
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        message: 'Missing proof or publicInputs'
      } as VerifyProofResponse);
    }

    try {
      fastify.log.info('Received proof verification request', undefined, {
        employee_id: publicInputs.employee_id,
        threshold: publicInputs.threshold,
        num_txids: publicInputs.txids.length
      })

      // Step 1: Verify EZKL proof
      fastify.log.info('Verifying EZKL proof...');
      const isValid = await verifier.verify(proof);

      if (!isValid) {
        fastify.log.warn('EZKL proof verification failed');
        return reply.code(400).send({
          success: false,
          error: 'Invalid Proof',
          message: 'ZK proof verification failed'
        } as VerifyProofResponse);
      }

      fastify.log.info('✓ EZKL proof verified successfully');

      // Step 2: Create attestation
      fastify.log.info('Creating attestation...');
      const attestation = await signer.createAttestation(publicInputs);

      fastify.log.info('✓ Attestation created', undefined, {
        attestation_hash: attestation.attestation_hash.substring(0, 16) + '...',
        timestamp: attestation.timestamp
      });

      return {
        success: true,
        attestation
      } as VerifyProofResponse;

    } catch (error) {
      fastify.log.error('Proof verification error:', undefined, error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      } as VerifyProofResponse);
    }
  });

  // POST /create-attestation (for development - no EZKL verification)
  fastify.post<{
    Body: { publicInputs: any };
  }>('/create-attestation', async (request, reply) => {
    const { publicInputs } = request.body;

    if (!publicInputs) {
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        message: 'Missing publicInputs'
      });
    }

    try {
      fastify.log.info('Creating attestation (dev mode - no proof verification)');
      const attestation = await signer.createAttestation(publicInputs);

      return {
        success: true,
        attestation
      };
    } catch (error) {
      fastify.log.error('Attestation creation error:', undefined, error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /generate-proof (FULL ZKML proof generation + attestation)
  fastify.post<{
    Body: GenerateProofRequest;
  }>('/generate-proof', async (request, reply) => {
    const startTime = Date.now();
    const { proof_type, payments, threshold_min, threshold_max, employee_id, txids, contract_address } = request.body;

    // Validate request
    const missingFields = [];
    if (!proof_type) missingFields.push('proof_type');
    if (!payments) missingFields.push('payments');
    if (threshold_min === undefined) missingFields.push('threshold_min');
    if (!employee_id) missingFields.push('employee_id');
    if (!txids) missingFields.push('txids');
    // history_commitment will be computed by verifier
    if (!contract_address) missingFields.push('contract_address');

    if (missingFields.length > 0) {
      fastify.log.error('Validation failed - missing fields:', undefined, { missingFields, body: request.body });
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        error_code: ErrorCode.VALIDATION_ERROR,
        message: `Missing required fields: ${missingFields.join(', ')}`
      } as GenerateProofResponse);
    }

    if (payments.length !== 6) {
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        error_code: ErrorCode.VALIDATION_ERROR,
        message: 'Exactly 6 monthly payments required'
      } as GenerateProofResponse);
    }

    try {
      fastify.log.info({
        proof_type,
        employee_id,
        threshold_min,
        threshold_max,
        num_payments: payments.length,
        payments: payments
      }, 'Generating ZKML proof');

      // Step 1: Generate ZK proof using zkml-payroll module
      // NOTE: payments and thresholds must be ALREADY NORMALIZED by caller
      fastify.log.info({
        payments: payments,
        threshold_min: threshold_min,
        threshold_max: threshold_max
      }, '  → Generating ZK proof with EZKL...');

      let proofResult;
      try {
        fastify.log.info('  → Calling generateIncomeProof...');
        proofResult = await generateIncomeProof(
          proof_type as unknown as ZKMLProofType,
          payments,
          threshold_min,
          threshold_max
        );
        fastify.log.info({
          success: proofResult.success,
          hasProof: !!proofResult.proof,
          error: proofResult.error
        }, '  → generateIncomeProof returned');
      } catch (err) {
        fastify.log.error({ err }, '  ❌ Exception in generateIncomeProof');
        throw err;
      }

      if (!proofResult.success || !proofResult.proof) {
        const errorMsg = proofResult.error || 'Unknown error - no error message returned';

        // Check if this is a legitimate threshold failure (not a technical error)
        const isThresholdFailure = errorMsg.toLowerCase().includes('does not meet') ||
                                    errorMsg.toLowerCase().includes('threshold');

        if (isThresholdFailure) {
          // Threshold failure is a valid result, return 200 OK
          fastify.log.info(`Threshold not met: ${errorMsg}`);
          return reply.code(200).send({
            success: false,
            error_code: ErrorCode.THRESHOLD_NOT_MET,
            message: errorMsg,
            duration: Date.now() - startTime
          } as GenerateProofResponse);
        } else {
          // Technical error, return 500
          fastify.log.error(`ZK proof generation failed: ${errorMsg}`);
          fastify.log.error('Proof generation details:', undefined, {
            proof_type,
            num_payments: payments.length,
            threshold_min,
            threshold_max,
            proofResult: JSON.stringify(proofResult)
          });
          return reply.code(500).send({
            success: false,
            error: 'Proof Generation Failed',
            error_code: ErrorCode.PROOF_GENERATION_FAILED,
            message: errorMsg,
            duration: Date.now() - startTime
          } as GenerateProofResponse);
        }
      }

      fastify.log.info('  ✓ ZK proof generated', undefined, { duration: proofResult.duration });

      // Step 2: Pre-flight validation (before blockchain submission)
      // Validate all circuit requirements to provide clear error messages
      fastify.log.info('  → Running pre-flight validation...');

      if (!contract_address || process.env.ENABLE_BLOCKCHAIN_SUBMISSION !== 'true') {
        fastify.log.error('  ❌ contract_address and ENABLE_BLOCKCHAIN_SUBMISSION required');
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          error_code: ErrorCode.VALIDATION_ERROR,
          message: 'contract_address required for proof generation',
          duration: Date.now() - startTime
        } as GenerateProofResponse);
      }

      // Validation 1: Proof type must be 1-5
      if (proof_type < 1 || proof_type > 5) {
        fastify.log.error(`  ❌ Invalid proof type: ${proof_type} (must be 1-5)`);
        return reply.code(400).send({
          success: false,
          error: 'Validation Error',
          error_code: ErrorCode.VALIDATION_ERROR,
          message: `Invalid proof type: ${proof_type}. Must be 1 (INCOME_ABOVE_THRESHOLD), 2 (INCOME_RANGE), 3 (AVERAGE_INCOME), 4 (CREDIT_SCORE), or 5 (TAX_BRACKET)`,
          duration: Date.now() - startTime
        } as GenerateProofResponse);
      }

      // Validation 2: Denormalize thresholds and validate ranges
      const NORMALIZATION_FACTOR = 10000;
      const denormalizedMin = Math.round(threshold_min * NORMALIZATION_FACTOR);
      const denormalizedMax = threshold_max ? Math.round(threshold_max * NORMALIZATION_FACTOR) : 0;

      fastify.log.info({
        normalized: { min: threshold_min, max: threshold_max },
        denormalized: { min: denormalizedMin, max: denormalizedMax }
      }, '  → Denormalized thresholds');

      // Validation 3: For INCOME_RANGE (type 2), threshold_max must be > threshold_min
      if (proof_type === 2) {
        if (denormalizedMax <= denormalizedMin) {
          fastify.log.error(`  ❌ Invalid INCOME_RANGE: max (${denormalizedMax}) must be > min (${denormalizedMin})`);
          return reply.code(400).send({
            success: false,
            error: 'Validation Error',
            error_code: ErrorCode.VALIDATION_ERROR,
            message: `Invalid INCOME_RANGE: threshold_max (${denormalizedMax}) must be greater than threshold_min (${denormalizedMin})`,
            duration: Date.now() - startTime
          } as GenerateProofResponse);
        }
      }

      // Validation 4: For TAX_BRACKET (type 5), validate it matches one of 7 US federal brackets
      if (proof_type === 5) {
        const validBrackets = [
          { min: 0, max: 11600, name: '10% bracket ($0 - $11,600)' },
          { min: 11601, max: 47150, name: '12% bracket ($11,601 - $47,150)' },
          { min: 47151, max: 100525, name: '22% bracket ($47,151 - $100,525)' },
          { min: 100526, max: 191950, name: '24% bracket ($100,526 - $191,950)' },
          { min: 191951, max: 243725, name: '32% bracket ($191,951 - $243,725)' },
          { min: 243726, max: 609350, name: '35% bracket ($243,726 - $609,350)' },
          { min: 609351, max: 999999999, name: '37% bracket ($609,351+)' },
        ];

        const isValidBracket = validBrackets.some(
          b => b.min === denormalizedMin && b.max === denormalizedMax
        );

        if (!isValidBracket) {
          const bracketNames = validBrackets.map(b => b.name).join(', ');
          fastify.log.error(`  ❌ Invalid TAX_BRACKET: min=${denormalizedMin}, max=${denormalizedMax} does not match any US federal tax bracket`);
          return reply.code(400).send({
            success: false,
            error: 'Validation Error',
            error_code: ErrorCode.VALIDATION_ERROR,
            message: `Invalid TAX_BRACKET: (${denormalizedMin}, ${denormalizedMax}) does not match any of the 7 US federal tax brackets. Valid brackets: ${bracketNames}`,
            duration: Date.now() - startTime
          } as GenerateProofResponse);
        }
        fastify.log.info(`  ✓ Valid TAX_BRACKET: ${validBrackets.find(b => b.min === denormalizedMin)?.name}`);
      }

      fastify.log.info('  ✓ Pre-flight validation passed');

      try {
        fastify.log.info('  → Initializing PayrollAPI for contract state checks...');

        // Initialize provider service with contract address
        const config = loadVerifierConfig(contract_address);
        const providerSvc = new ProviderService(fastify.log as unknown as Logger, config);
        const api = await providerSvc.initialize();

        // Pre-flight check 1: Verify that this verifier is trusted
        fastify.log.info('  → Checking if verifier is trusted...');
        const verifierPubkey = signer.getPublicKey();
        const isTrusted = await api.isTrustedVerifier(verifierPubkey);

        if (!isTrusted) {
          fastify.log.error(`  ❌ Verifier not trusted: ${verifierPubkey}`);
          await providerSvc.shutdown();
          return reply.code(403).send({
            success: false,
            error: 'Forbidden',
            error_code: ErrorCode.VALIDATION_ERROR,
            message: `Verifier ${verifierPubkey.substring(0, 16)}... is not registered as a trusted verifier for this contract`,
            duration: Date.now() - startTime
          } as GenerateProofResponse);
        }
        fastify.log.info(`  ✓ Verifier is trusted: ${verifierPubkey.substring(0, 16)}...`);

        // Pre-flight check 2: Compute and verify history commitment
        fastify.log.info('  → Computing history commitment...');
        const history_commitment = await api.computeHistoryCommitment(employee_id);
        fastify.log.info(`  ✓ History commitment computed: ${history_commitment.substring(0, 16)}...`);

        // Step 3: Create attestation WITH DENORMALIZED THRESHOLDS (already computed in pre-flight validation)
        // This ensures the attestation hash matches what the circuit will reconstruct
        fastify.log.info('  → Creating attestation...');
        const attestation = await signer.createAttestation({
          employee_id,
          proof_type,
          threshold: denormalizedMin,
          threshold_max: denormalizedMax,
          txids,
          history_commitment
        });

        fastify.log.info('  ✓ Attestation created', undefined, {
          attestation_hash: attestation.attestation_hash.substring(0, 16) + '...'
        });

        // Step 4: Submit proof to blockchain
        fastify.log.info('  → Submitting proof to blockchain...');

        // Submit income proof via PayrollAPI
        const success = await api.submitIncomeProof(
          employee_id,
          BigInt(proof_type),
          denormalizedMin.toString(),
          denormalizedMax.toString(),
          txids,
          history_commitment,
          attestation.attestation_hash,
          BigInt(attestation.timestamp),
          30 * 24 * 60 * 60 // 30 days
        );

        if (!success) {
          fastify.log.error('  ❌ Failed to submit proof to blockchain');
          await providerSvc.shutdown();
          return reply.code(500).send({
            success: false,
            error: 'Blockchain Submission Failed',
            error_code: ErrorCode.INTERNAL_ERROR,
            message: 'Failed to submit proof to blockchain',
            duration: Date.now() - startTime
          } as GenerateProofResponse);
        }

        fastify.log.info('  ✅ Proof submitted to blockchain successfully');

        // Cleanup
        await providerSvc.shutdown();

        const duration = Date.now() - startTime;
        fastify.log.info('✅ Proof generation complete', undefined, { total_duration: duration });

        return {
          success: true,
          proof_json: proofResult.proof.proofJson,
          attestation,
          duration
        } as GenerateProofResponse;

      } catch (error) {
        fastify.log.error({
          error,
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : 'Unknown',
          errorStack: error instanceof Error ? error.stack : undefined,
          errorDetails: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
        }, '  ❌ Error in proof generation/submission');
        return reply.code(500).send({
          success: false,
          error: 'Proof Generation Failed',
          error_code: ErrorCode.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
          duration: Date.now() - startTime
        } as GenerateProofResponse);
      }

    } catch (error) {
      fastify.log.error('Proof generation error:', undefined, error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        error_code: ErrorCode.INTERNAL_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      } as GenerateProofResponse);
    }
  });

  // GET /status
  fastify.get('/status', async () => {
    const ezklAvailable = await verifier.checkAvailability();

    return {
      service: 'zkml-verifier',
      verifier_pubkey: signer.getPublicKey(),
      ezkl_available: ezklAvailable,
      timestamp: Date.now()
    };
  });
};

export default verifyRoutes;
