"""
Application-wide logging utilities.
"""

import logging
from logging.config import dictConfig

from .config import Settings


def configure_logging(settings: Settings) -> None:
    """Configure structured logging once per process."""
    log_level = settings.log_level.upper()
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "default": {
                    "format": "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
                }
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "level": log_level,
                }
            },
            "root": {"handlers": ["default"], "level": log_level},
        }
    )


def get_logger(name: str) -> logging.Logger:
    """Helper to fetch a named logger."""
    return logging.getLogger(name)
