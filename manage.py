#!/usr/bin/env python

"""
Django's command-line utility for administrative tasks.
"""

import os
import sys
from pathlib import Path


# Project root
ROOT_DIR = Path(__file__).resolve().parent

# Backend directory
BACKEND_DIR = ROOT_DIR / "backend"

# Add backend to Python path
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def main():
    """Run administrative tasks."""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "import Django. Make sure Django is installed "
            "and your virtual environment is activated."
        ) from exc

    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()

