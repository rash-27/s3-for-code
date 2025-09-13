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

Build and run the containers
```bash
docker-compose up --build
```

Once the containers are running, then make the migrations from the BE container in the DB
```bash
docker exec -it <backend_container_id> bash
```
Then run the following commands inside the container
```bash
alembic upgrade head
```

## Used internals
- Postgres DB
- SQLAlchemy (ORM)
- alembic (for migrations)