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
import subprocess

from models import FunctionType, SourceType, EventType, StatusType

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

# Create a new function entry
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
            image: rash27/func-{function_uuid}:latest
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
        image: rash27/func-{function_uuid}:latest
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


# Update function entry
@app.post("/update/{function_id}") # We only update STORAGE type and FUNCTION category
def update_function(
    function_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Updates the source code (handler.go) for a given function.
    - Rejects the update if the function is being deployed or is sourced from GitHub.
    - Replaces the existing handler file with the newly uploaded one.
    - Sets the function status to 'updated' to signify it needs redeployment.
    """

    # 1. Fetch the function and perform initial checks
    db_function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if not db_function:
        raise HTTPException(status_code=404, detail="Function not found")

    # 2. Raise exception if the function is currently under deployment
    if db_function.status == StatusType.DEPLOYED:
        # 409 Conflict is an appropriate status code for a temporary state conflict
        raise HTTPException(status_code=409, detail="Function is currently under deployment.")

    # 3. Raise exception if the source is GitHub, as its code is managed via git
    if db_function.source == SourceType.GITHUB:
        raise HTTPException(
            status_code=400,
            detail="Cannot update source file directly for a function sourced from GitHub. Use the deploy endpoint to re-fetch."
        )
    
    if db_function.type != FunctionType.FUNCTION:
        raise HTTPException(
            status_code=400,
            detail="Can only update source files for functions of type 'FUNCTION'."
        )
    
    # Ensure a file was actually uploaded
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="A file upload is required.")

    _update_source_file(db_function, file)
    # 6. Return a success response
    #    Instead of just 'true', a JSON object provides more context.
    #    An exception is raised on failure, so a successful return always means it was updated.
    return {"updated": True, "function_id": function_id, "new_status": "updated"}


# Get all functions
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
    Deploys a function by its ID.
    - For GitHub-sourced functions, it re-fetches the latest code.
    - For all buildable functions, it formats the code before deploying.
    - Updates the function's status to 'deployed' upon success.
    """

    # 1. Fetch the function from the database
    db_function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if not db_function:
        raise HTTPException(status_code=404, detail="Function not found")

    # 2. Check if the function is already deployed
    if db_function.status == StatusType.DEPLOYED:
        raise HTTPException(status_code=400, detail="Function is already deployed.")

    # For Images the config file will not be changed

    # 3. Handle the special case for GITHUB source: re-fetch the code
    if db_function.source == SourceType.GITHUB:
        print(f"Re-fetching source for GitHub function: {db_function.id}")
        _refetch_from_github(db_function)
    
    if db_function.type == FunctionType.FUNCTION:
        # 4. Format the code if it's a buildable function
        _format_go_code(db_function)

    # 5. Execute the deployment using 'faas-cli up'
    #    This works for both FUNCTION and IMAGE types, as it just uses the stack.yml
    _deploy_with_faas_cli(db_function)
    
    # 6. Update the function status in the database if deployment was successful
    db_function.status = StatusType.DEPLOYED
    db.commit()
    db.refresh(db_function)

    return db_function


# Update deployment
@app.post("/update_deployment/{function_id}", response_model=schemas.Function)
def update_deployment(
    function_id: str,
    db: Session = Depends(get_db),
    file: Optional[UploadFile] = File(None)
):
    """
    Updates and redeploys a function. The behavior depends on the function's source and type.

    1.  **GITHUB Source**: Re-fetches the latest code from the repo, formats it, and redeploys.
    2.  **STORAGE Source (FUNCTION Type)**: If a file is provided, it replaces the handler.
        Then, it formats the code and redeploys.
    3.  **STORAGE Source (IMAGE Type)**: Re-triggers the deployment to pull the latest image from the registry.
    """

    # 1. Fetch the function and validate its state
    db_function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if not db_function:
        raise HTTPException(status_code=404, detail="Function not found")

    if db_function.status == StatusType.PENDING:
        raise HTTPException(status_code=409, detail="Function is not deployed.")

    db_function.status = StatusType.PENDING
    db.commit()
    try:
        # Scenario 1: Source is GITHUB
        if db_function.source == SourceType.GITHUB:
            _refetch_from_github(db_function)

        # Scenario 2: Source is STORAGE and Type is FUNCTION
        elif db_function.source == SourceType.STORAGE and db_function.type == FunctionType.FUNCTION:
            if file and file.filename:
                _update_source_file(db_function, file)

        # Scenario 3: Source is STORAGE and Type is IMAGE
        # No file operations are needed here; we proceed directly to deployment.

        # Format code if it's a buildable function
        if db_function.type == FunctionType.FUNCTION:
            _format_go_code(db_function)

        # Trigger the deployment for all scenarios
        _deploy_with_faas_cli(db_function)

        # If all steps succeed, update the status to 'deployed'
        db_function.status = StatusType.DEPLOYED
        db.commit()
        db.refresh(db_function)
        return db_function

    except HTTPException as e:
        # If a known error occurs, update status and re-raise
        db_function.status = StatusType.PENDING
        db.commit()
        raise e
    except Exception as e:
        # For unexpected errors
        db_function.status = StatusType.UPDATE_FAILED
        db.commit()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")



def _refetch_from_github(db_function: models.Function):
    """Cleans old source and re-clones the repo."""
    print(f"Re-fetching source for GitHub function: {db_function.id}")
    function_dir = os.path.join(FUNCTIONS_PATH, str(db_function.id))
    
    if os.path.exists(function_dir):
        shutil.rmtree(function_dir)
    
    temp_clone_dir = os.path.join(TEMP_PATH, str(db_function.id))
    
    try:
        git.Repo.clone_from(db_function.location_url, temp_clone_dir)
        
        handler_path = next((os.path.join(root, "handler.go") for root, _, files in os.walk(temp_clone_dir) if "handler.go" in files), None)
        if not handler_path:
            raise HTTPException(status_code=404, detail="'handler.go' not found in the repository.")
        
        src_dir = os.path.join(function_dir, SRC_STORE_PATH_NAME)
        config_dir = os.path.join(function_dir, CONFIG_STORE_PATH_NAME)
        os.makedirs(src_dir, exist_ok=True)
        os.makedirs(config_dir, exist_ok=True)

        shutil.copy(handler_path, os.path.join(src_dir, "handler.go"))
        
        yaml_template = f"""version: 1.0
provider:
  name: openfaas
  gateway: http://127.0.0.1:31112
functions:
  {str(db_function.id)}:
    lang: golang-http
    handler: ../{SRC_STORE_PATH_NAME}
    image: rash27/func-{str(db_function.id)}:latest
"""
        with open(os.path.join(config_dir, "stack.yml"), "w") as f:
            f.write(yaml_template)
    finally:
        if os.path.exists(temp_clone_dir):
            shutil.rmtree(temp_clone_dir)

def _update_source_file(db_function: models.Function, file: UploadFile):
    """Replaces the handler.go file with the uploaded one."""
    print(f"Updating source file for function: {db_function.id}")
    src_dir = os.path.join(db_function.location_url, SRC_STORE_PATH_NAME)
    if db_function.source == SourceType.GITHUB:
        src_dir = os.path.join(FUNCTIONS_PATH, str(db_function.id), SRC_STORE_PATH_NAME)
    
    if db_function.type != FunctionType.FUNCTION and db_function.source != SourceType.GITHUB:
        return  # No file update needed for non-buildable functions

    if not os.path.isdir(src_dir):
        raise HTTPException(status_code=404, detail=f"Source directory not found at: {src_dir}")
    
    # Remove old .go file(s)
    for filename in os.listdir(src_dir):
        if filename.endswith(".go"):
            os.remove(os.path.join(src_dir, filename))
    
    try:
        with open(os.path.join(src_dir, "handler.go"), "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

def _format_go_code(db_function: models.Function):
    """Runs gofmt on the function's source directory."""
    src_path = os.path.join(db_function.location_url, SRC_STORE_PATH_NAME)
    if db_function.source == SourceType.GITHUB:
        src_path = os.path.join(FUNCTIONS_PATH, str(db_function.id), SRC_STORE_PATH_NAME)
    if db_function.type != FunctionType.FUNCTION and db_function.source != SourceType.GITHUB:
        return  # No formatting needed for non-buildable functions
    print(f"Formatting Go code in: {src_path}")
    try:
        subprocess.run(
            ["gofmt", "-s", "-w", "."],
            cwd=src_path, check=True, capture_output=True, text=True
        )
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Failed to format Go code: {e.stderr}")

def _deploy_with_faas_cli(db_function: models.Function):
    """Runs 'faas-cli up' using the function's stack.yml."""
    config_path = db_function.location_url
    if db_function.source == SourceType.GITHUB:
        config_path = os.path.join(FUNCTIONS_PATH, str(db_function.id), CONFIG_STORE_PATH_NAME)
    else: 
        if db_function.type == FunctionType.FUNCTION:
            config_path = os.path.join(db_function.location_url, CONFIG_STORE_PATH_NAME)        
    
    print(f"Deploying function from: {config_path}")
    try:
        subprocess.run(["faas-cli", "template", "store", "pull", "golang-http"], cwd=config_path, check=True, capture_output=True, text=True)
        subprocess.run(
            ["faas-cli", "up", "-f", "stack.yml"],
            cwd=config_path, check=True, text=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Deployment failed: {e}")
        raise HTTPException(status_code=500, detail=f"Deployment failed: {e.stderr}")


# Undeploy
@app.post("/undeploy_function/{function_id}")
def undeploy_function(function_id: str, db: Session = Depends(get_db)):
    """
    Undeploys a function by its ID.
    - Rejects the request if the function is not in a 'deployed' state.
    - Updates the function's status to 'undeployed' upon success.
    """

    # 1. Fetch the function from the database
    db_function = db.query(models.Function).filter(models.Function.id == function_id).first()
    if not db_function:
        raise HTTPException(status_code=404, detail="Function not found")

    # 2. Check if the function is in a state that can be undeployed
    if db_function.status != StatusType.DEPLOYED:
        raise HTTPException(
            status_code=400,
            detail=f"Function is not deployed. Current status: '{db_function.status}'"
        )

    # 3. Determine the path to the configuration file
    file_path  = db_function.location_url
    # For buildable functions, the stack.yml is in the 'config' subdirectory
    if db_function.source == SourceType.GITHUB:
        folder_path = os.path.join(FUNCTIONS_PATH, str(db_function.id))
        config_path = os.path.join(folder_path, CONFIG_STORE_PATH_NAME)
    else:
        if db_function.type == FunctionType.FUNCTION:
            file_path = os.path.join(db_function.location_url, CONFIG_STORE_PATH_NAME)
    

    stack_file = os.path.join(file_path, "stack.yml")
    if not os.path.exists(stack_file):
        raise HTTPException(status_code=404, detail=f"stack.yml not found in {config_path}")

    # 4. Execute the undeployment using 'faas-cli remove'
    print(f"Undeploying function from: {config_path}")
    try:
        # Run 'faas-cli remove -f stack.yml' from the directory containing the file
        undeploy_process = subprocess.run(
            ["faas-cli", "remove", "-f", "stack.yml"],
            cwd=config_path,
            check=True,
            capture_output=True,
            text=True
        )
        print("Undeployment successful:", undeploy_process.stdout)

    except subprocess.CalledProcessError as e:
        # Raise an exception with the actual error from the faas-cli
        raise HTTPException(status_code=500, detail=f"Undeployment failed: {e.stderr}")

    # 5. Update the function status in the database
    db_function.status = StatusType.PENDING
    db.commit()
    db.refresh(db_function)

    # 6. Return a success response
    return {"undeployed": True, "function_id": function_id, "new_status": "pending"}

# logs

# You can now use your cluster with:

# kubectl cluster-info --context kind-openfaas-cluster
