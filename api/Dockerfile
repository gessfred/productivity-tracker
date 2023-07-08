FROM ubuntu:20.04
COPY requirements.txt .
RUN apt update -y && apt install -y python3 python3-pip
RUN pip3 install -r requirements.txt
COPY app.py main.py ./

ENTRYPOINT ["python3", "main.py"]
