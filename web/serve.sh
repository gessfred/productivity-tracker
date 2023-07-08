#!/bin/sh
serve -s /app/build -l "tcp://0.0.0.0:$HTTP_PORT"