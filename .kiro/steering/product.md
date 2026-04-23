# Product Overview

An ASP.NET Core microservices e-commerce platform. The system handles product catalog management, customer management, shopping basket/cart operations, order processing, and inventory tracking.

Services communicate asynchronously via RabbitMQ. An Ocelot API Gateway provides a unified entry point. Infrastructure is containerized with Docker Compose.

## Domain Concepts

- **Product**: Catalog items stored in MySQL
- **Customer**: User accounts stored in PostgreSQL
- **Basket/Cart**: Shopping cart sessions cached in Redis
- **Order**: Purchase orders stored in SQL Server, processed via CQRS/MediatR
- **Inventory**: Product stock tracking stored in MongoDB
- **Scheduled Jobs**: Background tasks managed by Hangfire
