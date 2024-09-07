import { FastifyInstance } from "fastify";

export interface Controller {
    registerRoutes(instance: FastifyInstance): void
}