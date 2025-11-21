import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    ds = moduleRef.get(DataSource);
    // optionally run migrations or reset DB here in test env
  });

  afterAll(async () => {
    await app.close();
  });

  it('/orders (POST) should create order (integration smoke)', async () => {
    const token = 'bearer-test-token'; // seed user or mock auth for e2e
    const res = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        builderId: '00000000-0000-0000-0000-000000000000',
        items: [{ productId: '11111111-1111-1111-1111-111111111111', quantity: 1 }]
      });
    expect([200, 201]).toContain(res.status);
  });
});
