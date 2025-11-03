/**
 * Verification Routes
 */

import type { FastifyPluginAsync } from 'fastify';
import type { VerifyProofRequest, VerifyProofResponse, Attestation } from '../types.js';
import { EZKLVerifier } from '../services/ezkl-verifier.js';
import { AttestationSigner } from '../services/attestation-signer.js';

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
      fastify.log.info('Received proof verification request', {
        employee_id: publicInputs.employee_id,
        threshold: publicInputs.threshold,
        num_txids: publicInputs.txids.length
      });

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

      fastify.log.info('✓ Attestation created', {
        attestation_hash: attestation.attestation_hash.substring(0, 16) + '...',
        timestamp: attestation.timestamp
      });

      return {
        success: true,
        attestation
      } as VerifyProofResponse;

    } catch (error) {
      fastify.log.error('Proof verification error:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      } as VerifyProofResponse);
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
