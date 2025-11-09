/**
 * ZKML Verifier Service
 *
 * Main entry point for the verification service
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import verifyRoutes from './routes/verify.js';
import type { HealthResponse } from './types.js';

// Load environment variables
const PORT = parseInt(process.env.PORT || '3002', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    } : undefined
  }
});

// Register CORS
await fastify.register(cors, {
  origin: ALLOWED_ORIGINS,
  credentials: true
});

// Register routes
await fastify.register(verifyRoutes, { prefix: '/api/zkml' });

// Health check endpoint
fastify.get('/health', async (): Promise<HealthResponse> => {
  return {
    status: 'ok',
    service: 'zkml-verifier',
    timestamp: Date.now(),
    verifier_pubkey: process.env.VERIFIER_SECRET_KEY ? 'configured' : 'not-configured',
    ezkl_available: true
  };
});

// Root endpoint
fastify.get('/', async () => {
  return {
    service: 'zkSalaria ZKML Verifier',
    version: '0.1.0',
    endpoints: {
      health: 'GET /health',
      status: 'GET /api/zkml/status',
      verify: 'POST /api/zkml/verify-proof',
      generateProof: 'POST /api/zkml/generate-proof',
      createAttestation: 'POST /api/zkml/create-attestation (dev mode - no proof)'
    }
  };
});

// Graceful shutdown
const closeGracefully = async (signal: string) => {
  fastify.log.info(`Received ${signal}, closing server gracefully`);
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', () => closeGracefully('SIGINT'));
process.on('SIGTERM', () => closeGracefully('SIGTERM'));

// Start server
const start = async () => {
  try {
    await fastify.listen({
      port: PORT,
      host: '127.0.0.1'
    });

    console.log('\n' + '='.repeat(60));
    console.log('🔐 zkSalaria ZKML Verifier Service');
    console.log('='.repeat(60));
    console.log(`\n📡 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
    console.log(`\n📚 API Endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /api/zkml/status`);
    console.log(`   POST /api/zkml/verify-proof (verify existing proof)`);
    console.log(`   POST /api/zkml/generate-proof (generate ZK proof + attestation)`);
    console.log(`   POST /api/zkml/create-attestation (dev mode - attestation only)`);
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
