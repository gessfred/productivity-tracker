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
import datetime

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
    x_user_id = 'fred'
    interval = '1 week'
    data = pd.read_sql("""
        with keyevents as (
            select 
                (regexp_matches(source_url, '^(?:https?:\/\/)?(?:[^@\/\n]+@)?([^:\/\n]+)', 'g'))[1] as url,
                *
            from typing_events 
            where 
            user_id=%(user_id)s and 
            record_time > now() - interval %(interval)s
        )
        select 
            url, count(*) as event_count
        from keyevents
        group by url
        order by count(*) desc
        limit 10
    """, db.bind, params={"user_id": x_user_id, "interval": interval})
    fig = go.Figure(data=[go.Pie(labels=data.url, values=data.event_count, hole=.3)])
    return fig_to_base64(fig)

def generate_time_of_day():
    bucket_width = '1 hour'
    x_user_id = 'fred'
    interval = '1 week'
    data = pd.read_sql("""
    with user_keyevents as (
      select * 
      from typing_events
      where 
        user_id=%(user_id)s and 
        record_time > now() - interval %(interval)s
    ), bucketed as (
        select 
          date_bin(
              %(bucket_width)s, 
              record_time, 
              date_trunc('day', record_time) 
          ) as trunc,
          date_trunc('day', record_time) as day
        from user_keyevents 
    ), strokes_times as (
        select 
          extract('hour' from trunc)::smallint as hour,
          extract('minute' from trunc)::smallint as minute,
          day
        from bucketed
    ), final_form as (
        select
            day,
            hour,
            minute,
            count(*) as typing_count
        from strokes_times REF
        group by day, hour, minute
        order by day, hour, minute asc
    ), averaged as (
        select 
            hour, minute, avg(typing_count) as typing_count
        from final_form
        group by hour, minute
    ) select 
        lpad(hour::text, 2, '0') || ':' || lpad(minute::text, 2, '0') as time_of_day, 
        typing_count
    from averaged 
    order by hour, minute
    """, db.bind, params={"user_id": x_user_id, "interval": interval, 'bucket_width': bucket_width})
    fig = px.bar(data, x="time_of_day", y="typing_count")
    return fig_to_base64(fig)

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

def generate_report() -> str:
    wow = generate_week_over_week()
    topsites = generate_top_sites()
    time_of_day = generate_time_of_day()
    report = f"""
        <html>
            <body>
                <h1>Your weekly HotKey report</h1>
                <small>{datetime.datetime.now()}</small>
                <h2>Week over week</h2>
                <img src="data:image/png;base64,{wow}" />
                <h2>Top sites</h2>
                <img src="data:image/png;base64,{topsites}" />
                <h2>Time of day</h2>
                <img src="data:image/png;base64,{time_of_day}" />
            </body>
        </html>
    """
    return report

def handler(event, context):
    report = generate_report()
    send_email(
        'gessfred@protonmail.com',
        'HotKey weekly report',
        report
    )

if __name__ == '__main__':
    with open("index.html", "w") as fd:
        fd.write(generate_report())