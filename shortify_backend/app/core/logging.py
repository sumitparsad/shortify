"""
Structured logging using structlog.

WHY STRUCTURED LOGGING?
- JSON log output can be ingested by Datadog, Splunk, CloudWatch, etc.
- Searchable by field (user_id, request_id, slug) — not just text
- In production, you need to correlate logs across 100+ instances
  → A request_id thread-local makes this trivial

INTERVIEW: "How do you debug production issues in a distributed system?"
Answer: Structured logs with a correlation/request ID. Each request gets a UUID
at the load balancer level. Every log line emitted during that request includes
the same ID — you can grep all logs from all instances for a single request.
"""

import logging
import sys

import structlog


def configure_logging(environment: str = "development") -> None:
    """
    Configure structlog for JSON (production) or pretty-print (development).
    Call once at application startup.
    """
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
    ]

    if environment == "production":
        renderer = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    formatter = structlog.stdlib.ProcessorFormatter(
        processor=renderer,
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO if environment == "production" else logging.DEBUG)

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if environment != "production" else logging.WARNING
    )


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    return structlog.get_logger(name)
