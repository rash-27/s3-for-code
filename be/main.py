from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI()

# Initial Upload
# Start Deployment
# End Deployment
# Update -> CI/CD
# Logs -> Prometheus Logs

@app.get("/")
async def root():
    return {"message": "Hello World"}