import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { CanActivate, ExecutionContext } from '@nestjs/common';

// mock guard to bypass JWT in tests
class MockAuthGuard implements CanActivate {
    canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 'test-user', role: 'SUPER_ADMIN' };
        return true;
    }
}

describe('Billing (e2e)', () => {
    let app: INestApplication;
    let ds: DataSource;
    const adminToken = 'mock-token';

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(JwtAuthGuard)
            .useClass(MockAuthGuard)
            .compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        ds = moduleRef.get(DataSource);

        // run migrations (if your ts-node/typeorm CLI not available in test env, ensure migrations already applied)
        // If you need to run compiled seed script, try to require it (dist must exist)
        try {
            // run seed-superadmin if available (compiled JS in dist/scripts)
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const seed = require('../../dist/scripts/seed-superadmin.js');
            if (seed && typeof seed.run === 'function') {
                // if script exposes run(), call it
                await seed.run();
            }
        } catch (e) {
            // not fatal — continue
            // console.warn('Seed script not run:', e);
        }
    }, 120_000);

    afterAll(async () => {
        await app.close();
    });

    it('/billing/ledger/:builderId (GET) should return ledger JSON', async () => {
        // Use a fake builder id that exists in seed or use any UUID (endpoint returns 400 if builderId missing)
        const builderId = '00000000-0000-0000-0000-000000000000';
        const res = await request(app.getHttpServer())
            .get(`/billing/ledger/${builderId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        expect(res.body).toHaveProperty('builderId');
        expect(res.body).toHaveProperty('ledger');
    });

    it('/billing/payments/advance (POST) should create a payment', async () => {
        const body = { builderId: '00000000-0000-0000-0000-000000000000', amount: 10.0 };
        const res = await request(app.getHttpServer())
            .post('/billing/payments/advance')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(body)
            .expect(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('amount');
    }, 20_000);
});
