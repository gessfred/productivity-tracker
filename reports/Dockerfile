FROM public.ecr.aws/lambda/python:3.11
ADD lambda_function.py requirements.txt ./
RUN pip install -r requirements.txt
CMD [ "lambda_function.handler" ]