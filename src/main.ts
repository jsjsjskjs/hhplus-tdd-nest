import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { ValidationPipe } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  })
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  const swaggerConfig = new DocumentBuilder()
    .setTitle("tdd-nest API")
    .setDescription("The tdd-nest API description")
    .setVersion("0.1")
    .addTag("tdd-nest")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
      "access-token",
    )
    .build()
  SwaggerModule.setup("/docs", app, SwaggerModule.createDocument(app, swaggerConfig))
  await app.listen(3000)
}
bootstrap()
