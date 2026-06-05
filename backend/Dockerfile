# Replace the old FROM line with this correct tag format
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1

# Copy dependency mappings
COPY pyproject.toml uv.lock ./

# This will succeed perfectly with full glibc support
RUN uv sync --frozen --no-install-project

COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
