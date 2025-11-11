/**
 * Verification Routes
 */

import type { FastifyPluginAsync } from 'fastify';
import type { VerifyProofRequest, VerifyProofResponse, GenerateProofRequest, GenerateProofResponse } from '../types.js';
import { ErrorCode } from '../types.js';
import { EZKLVerifier } from '../services/ezkl-verifier.js';
import { AttestationSigner } from '../services/attestation-signer.js';
import { generateIncomeProof, ProofType as ZKMLProofType } from '@zksalaria/zkml-payroll';

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
    const { proof_type, payments, threshold_min, threshold_max, employee_id, txids, history_commitment } = request.body;

    // Validate request
    if (!proof_type || !payments || threshold_min === undefined || !employee_id || !txids || !history_commitment) {
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        error_code: ErrorCode.VALIDATION_ERROR,
        message: 'Missing required fields: proof_type, payments, threshold_min, employee_id, txids, history_commitment'
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
      fastify.log.info('Generating ZKML proof', undefined, {
        proof_type,
        employee_id,
        threshold_min,
        threshold_max,
        num_payments: payments.length
      });

      // Step 1: Generate ZK proof using zkml-payroll module
      fastify.log.info('  → Generating ZK proof with EZKL...');
      const proofResult = await generateIncomeProof(
        proof_type as unknown as ZKMLProofType,
        payments,
        threshold_min,
        threshold_max
      );

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

      // Step 2: Create attestation
      fastify.log.info('  → Creating attestation...');
      const attestation = await signer.createAttestation({
        employee_id,
        threshold: threshold_min,
        txids,
        history_commitment
      });

      fastify.log.info('  ✓ Attestation created', undefined, {
        attestation_hash: attestation.attestation_hash.substring(0, 16) + '...'
      });

      const duration = Date.now() - startTime;

      fastify.log.info('✅ Proof generation complete', undefined, { total_duration: duration });

      return {
        success: true,
        proof_json: proofResult.proof.proofJson,
        attestation,
        duration
      } as GenerateProofResponse;

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
