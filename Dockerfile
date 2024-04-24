FROM python:3.8

WORKDIR /app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY server ./

CMD ["python", "-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8080"]

