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

## Setting up the BE (using Docker)

Change the Directory
```bash
cd be
```

Create and update .env file
```
cp .env.example .env
```

### Setting up the Database 
Run a postgres image and create a database in it with name in the .env file
```bash
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password -d postgres
```

### Setting up the Backend
Build backend image
```bash
docker build -t fastapi-backend .
```
Run backend container
```bash
docker run -d -p 8000:8000 --name backend_container fastapi-backend
```

## Used internals
- Postgres DB
- SQLAlchemy (ORM)
- alembic (for migrations)