import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    // Database Configuration
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().default(5432),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_DATABASE: Joi.string().required(),

    // JWT Configuration
    JWT_SECRET: Joi.string().required(),

    // API Configuration
    API_PORT: Joi.number().default(3000),
});
