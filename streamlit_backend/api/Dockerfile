# FastAPI ML backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY ../data ../data
COPY ../data_loader.py ../data_loader.py
COPY ../pattern_mining.py ../pattern_mining.py
COPY ../qa.py ../qa.py
COPY ../utils.py ../utils.py
COPY api/main.py ./main.py
COPY api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
