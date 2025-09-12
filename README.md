# s3-for-code

## Setting up the BE (Manual)

Change the Directory
```bash
cd be
```

Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate
```

Install dependencies
```bash
pip install -r requirements.txt
```

Run the server
```bash
fastapi dev main.py
```

## Setting up the BE (Docker)

Change the Directory
```bash
cd be
```

Build and Run both postgres and backend image
```bash
docker-compose up --build
```

## Used internals
- Postgres DB
- SQLAlchemy (ORM)
- asyncpg (async driver for PostgreSQL)