#!/bin/bash

bash -c "uvicorn main:app --host 0.0.0.0 --port 8080 --reload"