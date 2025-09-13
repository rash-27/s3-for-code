import os
import shutil
import uuid
from typing import Optional, List

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import engine, get_db

from models import FunctionType, SourceType, EventType

# models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Function Service API",
    description="API for managing serverless functions.",
    version="1.0.0"
)

FILE_STORE_PATH = "file_store"
FUNCTIONS_PATH = os.path.join(FILE_STORE_PATH, "functions")
IMAGES_PATH = os.path.join(FILE_STORE_PATH, "images")
os.makedirs(FUNCTIONS_PATH, exist_ok=True)
os.makedirs(IMAGES_PATH, exist_ok=True)

@app.post("/upload_function/", response_model=schemas.Function, status_code=201)
def create_function(
    db: Session = Depends(get_db),
    name: str = Form(...),
    type: FunctionType = Form(...),
    source: SourceType = Form(...),
    event_type: EventType = Form(...),
    redis_host: Optional[str] = Form(None),
    redis_queue_name: Optional[str] = Form(None),
    github_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Create a new function entry.
    """

    final_location_url = ""

    # --- Logic for STORAGE source type ---
    if source == SourceType.STORAGE:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="A file upload is required for STORAGE source type.")

        save_path_dir = FUNCTIONS_PATH if type == FunctionType.FUNCTION else IMAGES_PATH

        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        final_location_url = os.path.join(save_path_dir, unique_filename)

        try:
            with open(final_location_url, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
        finally:
            file.file.close()

    # --- Logic for GITHUB source type ---
    elif source == SourceType.GITHUB:
        if not github_url:
            raise HTTPException(status_code=400, detail="The 'github_url' field is required for GITHUB source type.")
        final_location_url = github_url

    else:
        raise HTTPException(status_code=400, detail="Invalid source type specified.")

    function_create_data = schemas.FunctionCreate(
        name=name,
        type=type,
        source=source,
        event_type=event_type,
        redis_host=redis_host,
        redis_queue_name=redis_queue_name,
        github_url=github_url 
    )

    function_data_for_db = function_create_data.model_dump(exclude_none=True)
    function_data_for_db['location_url'] = final_location_url
    
    function_data_for_db.pop('github_url', None)

    db_function = models.Function(**function_data_for_db)

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

# You can now use your cluster with:

# kubectl cluster-info --context kind-openfaas-cluster
