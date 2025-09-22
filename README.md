# s3-for-code

## Architechture Diagram
<img width="1740" height="1451" alt="architechture-diagram" src="https://github.com/user-attachments/assets/627eab8a-ee27-4371-98cc-2ada220ad101" />

## Backend 

### Setting up the BE (Manual)

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
(or)
```bash
uvicorn main:app --reload
```

### Setting up the BE (using Docker)

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

Once the Backend is set up you can see the swagger docs at 
```bash
http://localhost:8000/docs
```

### Used internals For Backend
- FastAPI
- Postgres DB
- SQLAlchemy (ORM)
- alembic (for migrations)

## Frontend 

### Setting up the FE

Change the Directory
```bash
cd fe
```

Create and update .env file
```
cp .env.example .env
```

Install Dependencies (Make sure node version is above 21)
```bash
npm install
```

Run development Server
```
npm run dev
```

After the server is running you can see the FE at
```
http://localhost:5173
```

### Used internals For Frontend
- ReactJS

## Setting up environment for OpenFaaS

### Prerequisites
- Docker
- kubectl
- kind
- arkade
- faas-cli

### Setting up kubernetes cluster 

Change the Directory
```bash
cd be
```

Create a kubernetes cluster using kind
```bash
kind create cluster --config kind-config.yaml --name openfaas-cluster
```

Give the default service account access to pull images from docker hub
```bash
kubectl create secret docker-registry docker-hub-creds  --docker-username=<docker_user_name>  --docker-password=<docker_PAT_Token> --docker-email=<docker_email>
```

Patch the default service account to use the image pull secret
```bash
kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "docker-hub-creds"}]}'
```

### Setting up OpenFaaS using arkade

Install openfaas in cluster using arkade
```bash
arkade install openfaas \
  --set openfaas.imagePullSecret=docker-hub-creds
```

Forward the gateway port to localhost (Then you can access the OpenFaaS UI at http://127.0.0.1:31112/ui)
```bash
kubectl port-forward svc/gateway -n openfaas 31112:8080 &
```

Login to OpenFaaS using faas-cli
```bash
export OPENFAAS_URL=http://127.0.0.1:31112
echo -n $(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode) | faas-cli login --username admin --password-stdin   
```

To get the password to login to OpenFaaS UI (username: admin)
```bash
PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)
echo "Your OpenFaaS password is: $PASSWORD"
```

Once the openFaas setup is done you can use the API's to create functions and deploy them.

### Some other useful commands

To get the Number of replicas of a function in OpenFaas cli 
```bash
kubectl get deploy -n openfaas-fn <function_name>
```
To watch the deployment of a function
```bash
kubectl get deploy/<function-name> -n openfaas-fn --watch
```
