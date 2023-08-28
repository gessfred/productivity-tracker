FROM alpine
RUN apk add --no-cache python3 py3-pip
COPY requirements.txt .
RUN pip3 install -r requirements.txt
COPY app.py main.py ./
ENTRYPOINT [ "uvicorn", "main:app" ]