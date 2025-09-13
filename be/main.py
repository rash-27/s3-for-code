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
import git

from models import FunctionType, SourceType, EventType

# models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Function Service API",
    description="API for managing serverless functions.",
    version="1.0.0"
)

FILE_STORE_PATH = "file_store"
SRC_STORE_PATH_NAME = "src"
CONFIG_STORE_PATH_NAME = "config"
FUNCTIONS_PATH = os.path.join(FILE_STORE_PATH, "functions")
IMAGES_PATH = os.path.join(FILE_STORE_PATH, "images")
TEMP_PATH = os.path.join(FILE_STORE_PATH, "temp")
os.makedirs(FUNCTIONS_PATH, exist_ok=True)
os.makedirs(IMAGES_PATH, exist_ok=True)
os.makedirs(TEMP_PATH, exist_ok=True)
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
    image_name: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """
    Create a new function entry.
    """

    final_location_url = ""
    generated_uuid = str(uuid.uuid4())
    if source == SourceType.STORAGE:
        final_location_url = None

        try:
            if type == FunctionType.FUNCTION:
                # For this storing the file in /src and .yaml file in /config directory
                if source != SourceType.STORAGE or not file or not file.filename:
                    raise HTTPException(status_code=400, detail="A file upload is required for FunctionType.FUNCTION.")

                function_uuid = generated_uuid
                function_dir = os.path.join(FUNCTIONS_PATH, function_uuid)
                os.makedirs(function_dir, exist_ok=True)
                src_dir = os.path.join(function_dir, SRC_STORE_PATH_NAME)
                config_dir = os.path.join(function_dir, CONFIG_STORE_PATH_NAME)

                os.makedirs(src_dir, exist_ok=True)
                os.makedirs(config_dir, exist_ok=True)

                final_file_path = os.path.join(src_dir, file.filename)
                with open(final_file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                yaml_template = f"""version: 1.0
        provider:
        name: openfaas
        gateway: http://127.0.0.1:31112
        functions:
        {function_uuid}:
            lang: golang-http
            handler: ../{SRC_STORE_PATH_NAME}
            image: rash27/{function_uuid}:latest
        """
                yaml_file_path = os.path.join(config_dir, "stack.yml")
                with open(yaml_file_path, "w") as yaml_file:
                    yaml_file.write(yaml_template)

                final_location_url = function_dir

            elif type == FunctionType.IMAGE: # For this we only create yaml file (as the image is already deployed)
                if not image_name:
                    raise HTTPException(status_code=400, detail="An 'image_name' is required for FunctionType.IMAGE.")

                deployment_uuid = generated_uuid
                deployment_dir = os.path.join(IMAGES_PATH, deployment_uuid)
                os.makedirs(deployment_dir, exist_ok=True)

                yaml_template = f"""version: 1.0
        provider:
        name: openfaas
        gateway: http://127.0.0.1:31112
        functions:
        {deployment_uuid}:
            image: {image_name}
            skip_build: true
        """
                yaml_file_path = os.path.join(deployment_dir, "stack.yml")
                with open(yaml_file_path, "w") as yaml_file:
                    yaml_file.write(yaml_template)
                    
                final_location_url = deployment_dir

        except Exception as e:
            # A general exception handler can be useful
            raise HTTPException(status_code=500, detail=f"An error occurred: {e}")
        finally:
            # Ensure the file is closed only if it was opened
            if file and file.file and not file.file.closed:
                file.file.close()


    elif source == SourceType.GITHUB:
        # Same as STORAGE of FUNCTION
        if not github_url:
            raise HTTPException(status_code=400, detail="The 'github_url' field is required for GITHUB source type.")

        function_uuid = generated_uuid
        
        temp_clone_dir = os.path.join(TEMP_PATH, function_uuid)
        os.makedirs(temp_clone_dir, exist_ok=True)
        final_function_dir = os.path.join(FUNCTIONS_PATH, function_uuid)
        os.makedirs(final_function_dir, exist_ok=True)
        final_function_src_dir = os.path.join(final_function_dir, SRC_STORE_PATH_NAME)
        os.makedirs(final_function_src_dir, exist_ok=True)
        final_function_config_dir = os.path.join(final_function_dir, CONFIG_STORE_PATH_NAME)
        os.makedirs(final_function_config_dir, exist_ok=True)
        
        try:
            print(f"Cloning {github_url} to {temp_clone_dir}...")
            git.Repo.clone_from(github_url, temp_clone_dir)

            handler_path = None
            for root, dirs, files in os.walk(temp_clone_dir):
                if "handler.go" in files:
                    handler_path = os.path.join(root, "handler.go")
                    break

            if not handler_path:
                raise HTTPException(status_code=404, detail="'handler.go' not found in the provided repository.")

            os.makedirs(final_function_src_dir, exist_ok=True)

            shutil.copy(handler_path, os.path.join(final_function_src_dir, "handler.go"))

            yaml_template = f"""version: 1.0
    provider:
    name: openfaas
    gateway: http://127.0.0.1:31112
    functions:
    {function_uuid}:
        lang: golang-http
        handler: ../{SRC_STORE_PATH_NAME}
        image: rash27/{function_uuid}:latest
    """
            yaml_file_path = os.path.join(final_function_config_dir, "stack.yml")
            with open(yaml_file_path, "w") as yaml_file:
                yaml_file.write(yaml_template)

            final_location_url = github_url

        except git.GitCommandError as e:
            # Handle errors like repository not found, access denied, etc.
            raise HTTPException(status_code=400, detail=f"Failed to clone repository: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
        finally:
            # 7. IMPORTANT: Clean up the temporary clone directory regardless of success or failure
            if os.path.exists(temp_clone_dir):
                shutil.rmtree(temp_clone_dir)

    else:
        raise HTTPException(status_code=400, detail="Invalid source type specified.")

    function_create_data = schemas.FunctionCreate(
        id= generated_uuid,
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
@app.post("/deploy_function/{function_id}", response_model=schemas.Function)
def deploy_function(function_id: str, db: Session = Depends(get_db)):
    """
    Deploy a function by its ID.
    """
    function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if not function:
        raise HTTPException(status_code=404, detail="Function not found")

    if function.status == models.StatusType.DEPLOYED:
        raise HTTPException(status_code=400, detail="Function is already deployed")

    # Here you would add the logic to deploy the function using OpenFaaS CLI or API
    # For example, using subprocess to call `faas-cli deploy -f <stack.yml>`
    import subprocess

    try:
        stack_file_path = os.path.join(function.location_url, "stack.yml")
        if not os.path.exists(stack_file_path):
            raise HTTPException(status_code=500, detail="stack.yml not found in the function directory")

        # Call faas-cli to deploy the function
        result = subprocess.run(["faas-cli", "deploy", "-f", stack_file_path], capture_output=True, text=True)
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Deployment failed: {result.stderr}")

        # Update function status in the database
        function.status = models.StatusType.DEPLOYED
        db.commit()
        db.refresh(function)

        return function

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred during deployment: {e}")
# stop deployment
# logs

# You can now use your cluster with:

# kubectl cluster-info --context kind-openfaas-cluster
