import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import rateLimit from 'express-rate-limit';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

async function bootstrap() {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.simple()
        )
      })
    ]
  });

  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [new winston.transports.Console()]
    })
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });

  // Security
  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: Number(process.env.RATE_LIMIT_MAX || 100)
    })
  );

  // ⭐ Add Global API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger (only in non-production or when SWAGGER_ENABLED=true)
  if (process.env.SWAGGER_ENABLED === 'true' || process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Scaffold API')
      .setDescription('Scaffolding management API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/docs', app, document);   // ⭐ Updated Swagger path
  }

  const port = process.env.PORT || 3000;
  const URL = `${process.env.APP_URL}:${port}` || `http://localhost:${port}`;
  await app.listen(port);

  logger.info(`App listening on ${URL}/api/v1`);
}

bootstrap();
