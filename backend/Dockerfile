FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./

RUN python -m pip install --upgrade pip \
  && python -c "import tomllib; from pathlib import Path; data = tomllib.loads(Path('pyproject.toml').read_text()); Path('requirements.txt').write_text('\\n'.join(data['project']['dependencies']) + '\\n')" \
  && pip install --no-cache-dir -r requirements.txt \
  && rm requirements.txt

COPY app ./app
COPY kb ./kb

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
