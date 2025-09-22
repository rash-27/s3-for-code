# s3-for-code

## Architechture Diagram

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
(or)
```bash
uvicorn main:app --reload
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

NOTE: 
- While Deploying the function, make sure that it is formatted as per the OpenFaaS standards. (gofmt -s -w . in the src folder)

To get the Number of replicas of a function in OpenFaas cli 
```bash
kubectl get deploy -n openfaas-fn <function_name>
```

To get Pods of keda using kubectl
```bash
kubectl get pods -n keda
```

kind create cluster --config kind-config.yaml --name openfaas-cluster

kubectl create secret docker-registry docker-hub-creds  --docker-username=<docker_user_name>  --docker-password=<docker_PAT_Token> --docker-email=<docker_email>

kubectl patch serviceaccount default -p '{"imagePullSecrets": [{"name": "docker-hub-creds"}]}'

arkade install openfaas \
  --set openfaas.imagePullSecret=docker-hub-creds

kubectl port-forward svc/gateway -n openfaas 31112:8080 &

export OPENFAAS_URL=http://127.0.0.1:31112

echo -n $(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode) | faas-cli login --username admin --password-stdin   

PASSWORD=$(kubectl get secret -n openfaas basic-auth -o jsonpath="{.data.basic-auth-password}" | base64 --decode)
echo "Your OpenFaaS password is: $PASSWORD"


To watch the deployment of a function
kubectl get deploy/demo -n openfaas-fn --watch
