from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import engine, get_db

from models import Function 

app = FastAPI(
    title="Function Service API",
    description="API for managing serverless functions.",
    version="1.0.0"
)

@app.post("/upload_function/", response_model=schemas.Function, status_code=201)
def create_function(function: schemas.FunctionCreate, db: Session = Depends(get_db)):
    """
    Create a function entry in the database.
    TODO: Need to exactly store the file and then do this 
    """
    db_function = models.Function(**function.model_dump())
    db.add(db_function)
    db.commit()
    db.refresh(db_function)
    return db_function


@app.get("/functions/", response_model=List[schemas.Function])
def read_functions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all functions with pagination.
    """
    functions = db.query(models.Function).offset(skip).limit(limit).all()
    return functions

# start deployment
# stop deployment
# logs