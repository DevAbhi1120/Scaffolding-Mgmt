"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
const helmet_1 = require("helmet");
const compression = require("compression");
const swagger_1 = require("@nestjs/swagger");
const express_rate_limit_1 = require("express-rate-limit");
const nest_winston_1 = require("nest-winston");
const winston = require("winston");
const path_1 = require("path");
const cors = require("cors");
async function bootstrap() {
    const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
            }),
        ],
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: nest_winston_1.WinstonModule.createLogger({
            transports: [new winston.transports.Console()],
        }),
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.use(cookieParser());
    app.enableCors({ origin: true, credentials: true });
    app.use(cors({
        origin: "*",
    }));
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    }));
    app.use(compression());
    app.use((0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: Number(process.env.RATE_LIMIT_MAX || 100),
    }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });
    app.setGlobalPrefix('api/v1');
    if (process.env.SWAGGER_ENABLED === 'true' ||
        process.env.NODE_ENV !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('Scaffold API')
            .setDescription('Scaffolding management API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/v1/docs', app, document);
    }
    const port = process.env.PORT || 3000;
    const URL = `${process.env.APP_URL}:${port}` || `http://localhost:${port}`;
    await app.listen(port);
    logger.info(`App listening on ${URL}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map