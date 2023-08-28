FROM alpine
RUN apk add --no-cache python3 py3-pip
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY main.py routers/ tests/ dependencies.py models.py ./
ENTRYPOINT [ "uvicorn", "main:app" ]