import plotly.express as px
import pandas as pd
import requests
from sqlalchemy import create_engine, Column, Integer, String, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import plotly.graph_objects as go
import io
import base64
import plotly
import boto3


engine = create_engine(os.getenv("DB_CONNECTION_STRING"))

SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def fig_to_base64(fig):
    buf = plotly.io.to_image(fig, format="png")
    return (base64.b64encode(buf).decode('utf-8'))

def generate_week_over_week() -> str:
    #request
    #format
    #plot
    x_user_id = 'fred'
    interval = '1 month'
    data = pd.read_sql("""
        with user_keyevents as (
        select 
            * 
        from typing_events 
        where 
            user_id=%(user_id)s 
        ),
        monthly as ( select 'Previous' as horizon, * from user_keyevents where record_time between  (now() - interval '2 weeks') and (now() - interval '1 week') ),
        weekly as ( select 'Current' as horizon, * from user_keyevents where record_time >  now() - interval '1 week' )
        select 
            horizon,
            to_char(record_time, 'Day') as day_of_week,
            min(record_time) as start_date,
            count(*) as event_count
        from (select * from monthly union select * from weekly) all_reports
        where record_time >  now() - interval '1 month'
        group by horizon, to_char(record_time, 'Day'), extract(dow from record_time)
        order by horizon, extract(dow from record_time)
    """, db.bind, params={"user_id": x_user_id, "interval": interval})#.to_dict(orient="records")
    fig = go.Figure(data=[
        go.Bar(name=f, x=data[data.horizon == f].day_of_week, y=data[data.horizon == f].event_count)
        for f in ['Current', 'Previous']
    ])
    fig.update_layout(barmode='group')
    return fig_to_base64(fig)

def generate_top_sites():
    pass

def generate_speed_plot():
    pass


def send_email(dest, subject, html):
    ses = boto3.client('ses')
    response = ses.send_email(
        Destination={
            'ToAddresses': [
                dest,
            ],
        },
        Message={
            'Body': {
                'Html': {
                    'Charset': 'UTF-8',
                    'Data': html,
                }
            },
            'Subject': {
                'Charset': 'UTF-8',
                'Data': subject,
            },
        },
        Source='bot@hotkey.gessfred.xyz'
    )

    print(response)



def handler(event, context):
    wow = generate_week_over_week()

    report = f"""
        <html>
            <body>
                <h1>Your weekly HotKey report</h1>
                <h2>Week over week</h2>
                <img src="data:image/png;base64,{wow}" />
            </body>
        </html>
    """
    send_email(
        'gessfred@protonmail.com',
        'HotKey weekly report',
        report
    )