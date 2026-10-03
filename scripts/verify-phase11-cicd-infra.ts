/**
 * scripts/verify-phase11-cicd-infra.ts
 * Verification test suite for Phase 11: CI/CD, Containerization, Infrastructure & Cloud Deployment
 */

import fs from 'fs';
import path from 'path';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  FR8X PHASE 11: CI/CD & INFRASTRUCTURE ARCHITECTURE VERIFICATION');
  console.log('================================================================\n');

  const rootDir = path.resolve(__dirname, '..');

  // TEST SUITE 1: .dockerignore Isolation & Secret Leak Defense (CICD-01)
  console.log('─── TEST SUITE 1: .dockerignore Isolation & Secret Leak Defense (CICD-01) ───');
  const dockerignorePath = path.join(rootDir, '.dockerignore');
  assert(fs.existsSync(dockerignorePath), '.dockerignore file exists at workspace root');

  if (fs.existsSync(dockerignorePath)) {
    const content = fs.readFileSync(dockerignorePath, 'utf8');
    assert(content.includes('.env*.local') || content.includes('.env'), '.dockerignore strictly excludes environment and secret files (.env*.local)');
    assert(content.includes('node_modules'), '.dockerignore excludes host node_modules directory');
    assert(content.includes('.git'), '.dockerignore excludes .git repository metadata');
    assert(content.includes('.next'), '.dockerignore excludes .next build cache');
    assert(content.includes('.data'), '.dockerignore excludes local .data DBMS store');
    assert(content.includes('*.apk'), '.dockerignore excludes compiled mobile APK binaries');
  }

  // TEST SUITE 2: Dockerfile Multi-Stage Build & Standalone Runner (CICD-02 / CICD-08)
  console.log('\n─── TEST SUITE 2: Dockerfile Multi-Stage Build & Standalone Runner (CICD-02 / CICD-08) ───');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  assert(fs.existsSync(dockerfilePath), 'Dockerfile exists at workspace root');

  if (fs.existsSync(dockerfilePath)) {
    const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
    assert(dockerfile.includes('FROM node:20-alpine AS deps'), 'Dockerfile defines multi-stage deps stage using node:20-alpine');
    assert(!dockerfile.includes('--omit=dev'), 'Dockerfile installs all devDependencies in deps stage so TypeScript compiles without errors');
    assert(dockerfile.includes('COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone'), 'Dockerfile leverages Next.js standalone output tracing');
    assert(dockerfile.includes('USER nextjs'), 'Dockerfile executes container process under non-root nextjs user');
    assert(dockerfile.includes('CMD ["node", "server.js"]'), 'Dockerfile executes server.js directly without npm wrapper');
    assert(dockerfile.includes('HEALTHCHECK') && dockerfile.includes('/api/admin/health'), 'Dockerfile defines container HEALTHCHECK monitoring /api/admin/health');
  }

  // TEST SUITE 3: Kubernetes Redis Health Probe Authentication (CICD-03)
  console.log('\n─── TEST SUITE 3: Kubernetes Redis Health Probe Authentication (CICD-03) ───');
  const k8sRedisPath = path.join(rootDir, 'k8s', 'redis.yaml');
  assert(fs.existsSync(k8sRedisPath), 'k8s/redis.yaml exists in repository');

  if (fs.existsSync(k8sRedisPath)) {
    const k8sRedis = fs.readFileSync(k8sRedisPath, 'utf8');
    assert(k8sRedis.includes('--requirepass'), 'Redis deployment configures password protection');
    assert(k8sRedis.includes('redis-cli -a "$REDIS_PASSWORD" ping'), 'Redis liveness and readiness probes authenticate with -a $REDIS_PASSWORD');
    assert(!k8sRedis.includes('command: ["redis-cli", "ping"]'), 'Unauthenticated redis-cli ping probe was eliminated to prevent CrashLoopBackOff');
  }

  // TEST SUITE 4: Docker Compose Topology & Authentication (CICD-04)
  console.log('\n─── TEST SUITE 4: Docker Compose Topology & Authentication (CICD-04) ───');
  const composePath = path.join(rootDir, 'docker-compose.yml');
  assert(fs.existsSync(composePath), 'docker-compose.yml exists in repository');

  if (fs.existsSync(composePath)) {
    const compose = fs.readFileSync(composePath, 'utf8');
    assert(compose.includes('REDIS_URL=redis://:${REDIS_PASSWORD'), 'App service passes authenticated REDIS_URL with password to redis service');
    assert(compose.includes('redis-cli -a') && compose.includes('REDIS_PASSWORD'), 'Redis service healthcheck authenticates using $REDIS_PASSWORD');
    assert(compose.includes('condition: service_healthy'), 'App service depends on redis service_healthy condition');
  }

  // TEST SUITE 5: Vercel Edge CSP & Security Synchronization (CICD-05)
  console.log('\n─── TEST SUITE 5: Vercel Edge CSP & Security Synchronization (CICD-05) ───');
  const vercelPath = path.join(rootDir, 'vercel.json');
  assert(fs.existsSync(vercelPath), 'vercel.json exists in repository');

  if (fs.existsSync(vercelPath)) {
    const vercel = fs.readFileSync(vercelPath, 'utf8');
    assert(vercel.includes('https://checkout.razorpay.com'), 'vercel.json CSP includes https://checkout.razorpay.com in frame-src');
    assert(vercel.includes('Strict-Transport-Security'), 'vercel.json enforces Strict-Transport-Security');
    assert(vercel.includes('"value": "DENY"'), 'vercel.json enforces X-Frame-Options: DENY');
  }

  // TEST SUITE 6: Next.js Standalone Optimization (CICD-08)
  console.log('\n─── TEST SUITE 6: Next.js Standalone Optimization (CICD-08) ───');
  const nextConfigPath = path.join(rootDir, 'next.config.js');
  assert(fs.existsSync(nextConfigPath), 'next.config.js exists in repository');

  if (fs.existsSync(nextConfigPath)) {
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    assert(nextConfig.includes("output: 'standalone'"), 'next.config.js enables standalone build output for containerization');
    assert(nextConfig.includes('poweredByHeader: false'), 'next.config.js disables X-Powered-By header');
    assert(nextConfig.includes('https://checkout.razorpay.com'), 'next.config.js CSP includes checkout.razorpay.com');
  }

  // TEST SUITE 7: GitHub Actions CI Quality Gate Pipeline (CICD-06)
  console.log('\n─── TEST SUITE 7: GitHub Actions CI Quality Gate Pipeline (CICD-06) ───');
  const ciWorkflowPath = path.join(rootDir, '.github', 'workflows', 'ci.yml');
  assert(fs.existsSync(ciWorkflowPath), '.github/workflows/ci.yml exists');

  if (fs.existsSync(ciWorkflowPath)) {
    const ciContent = fs.readFileSync(ciWorkflowPath, 'utf8');
    assert(ciContent.includes('npm run type-check'), 'CI workflow enforces TypeScript compilation');
    assert(ciContent.includes('npm run lint'), 'CI workflow enforces Next.js ESLint inspection');
    assert(ciContent.includes('npm test'), 'CI workflow executes consolidated architectural quality gates (npm test)');
    assert(ciContent.includes('npm run build'), 'CI workflow executes full production build');
    assert(ciContent.includes('Repository Secret Leak Prevention'), 'CI workflow executes secret leak scanning');
  }

  // TEST SUITE 8: Mobile Hybrid Configuration Hardening (CICD-07)
  console.log('\n─── TEST SUITE 8: Mobile Hybrid Configuration Hardening (CICD-07) ───');
  const capacitorPath = path.join(rootDir, 'capacitor.config.json');
  assert(fs.existsSync(capacitorPath), 'capacitor.config.json exists');

  if (fs.existsSync(capacitorPath)) {
    const cap = JSON.parse(fs.readFileSync(capacitorPath, 'utf8'));
    assert(cap.server?.url === 'https://con.fr8x.in', 'capacitor.config.json server.url targets production origin (https://con.fr8x.in)');
    assert(cap.server?.cleartext === false, 'capacitor.config.json server.cleartext is strictly false');
    assert(cap.android?.allowMixedContent === false, 'capacitor.config.json android.allowMixedContent is strictly false');
  }

  // TEST SUITE 9: Unified Quality Gate Test Script
  console.log('\n─── TEST SUITE 9: Package Test Scripts & Consistency ───');
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  assert(typeof pkg.scripts?.test === 'string', 'package.json defines "test" script');
  assert(pkg.scripts.test.includes('verify-all-gates.ts'), 'package.json "test" script runs verify-all-gates.ts');

  console.log('\n================================================================');
  console.log(`  PHASE 11 VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('  >>> ALL PHASE 11 CI/CD & INFRASTRUCTURE TESTS PASSED! <<<\n');
    process.exit(0);
  } else {
    console.error(`  >>> ${totalTests - passedTests} TESTS FAILED! <<<\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
