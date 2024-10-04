const duckdb = require('duckdb')
const db = new duckdb.Database('hotkey.db')
const { spawn } = require('child_process')

const query = (q, res, returnType) => {
  db.all(q, function(err, qres) {
    if (err) {
      res.status(500).send(JSON.stringify(err))
    }
    let data = qres
    if(returnType === 'single') {
      data = data[0]
    }
    res.send(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v))
  })
}

const createServer = () => {
  const express = require('express')
  const cors = require('cors')
  const app = express()
  app.use(cors())
  const port = 3000

  db.all(`
      create or replace view active_sessions_by_app
      as
      with event_sequence as (
        select 
            app,
            timestamp as ts,
            lag(timestamp) over (
                partition by app
                order by timestamp asc
            ) as prev_ts,
            row_number() over (
                partition by app
                order by timestamp desc
            ) as record_rank,
            extract(epoch from ts - prev_ts) / 60 as diff_s,
            extract(epoch from now() - ts) / 60 as age_s
        from "/Users/fredericgessler/Documents/bootstrap/productivity-tracker/darwin/HotKey/data/*.csv"
    ),
    sessions_numbered as (
        select 
            ts::date as session_date,
            *,
            sum((coalesce(diff_s > 10, true))::int) over (
                partition by app
                order by ts asc
            ) as session_number
        from event_sequence
    )
    select 
        app, 
        session_date, 
        session_number,
        min(ts) as session_start, 
        max(ts) as session_end,
        extract(epoch from session_end - session_start) as duration
    from sessions_numbered
    group by all
    having duration > 0 --and session_start > now() - interval '24 hours'
    order by app, session_date desc, session_number asc
    `, ((err, res) => console.log(err)))

    db.all(`
      create or replace view active_sessions 
      as
      with event_sequence as (
        select 
            app,
            timestamp as ts,
            lag(timestamp) over (
                order by timestamp asc
            ) as prev_ts,
            row_number() over (
                partition by app
                order by timestamp desc
            ) as record_rank,
            extract(epoch from ts - prev_ts) / 60 as diff_s,
            extract(epoch from now() - ts) / 60 as age_s
        from "/Users/fredericgessler/Documents/bootstrap/productivity-tracker/darwin/HotKey/data/*.csv"
    ),
    sessions_numbered as (
        select 
            ts::date as session_date,
            *,
            sum((coalesce(diff_s > 3, true))::int) over (
                order by ts asc
            ) as session_number
        from event_sequence
    )
    select 
        session_date, 
        session_number,
        min(ts) as session_start, 
        max(ts) as session_end,
        extract(epoch from session_end - session_start) as duration
    from sessions_numbered
    group by all
    having duration > 0  and session_start > now() - interval '24 hours'
    order by session_date desc, session_number asc
    `, ((err, res) => console.log(err)))

  app.get('/eventcount', (req, res) => {
    db.all('select count(*) as event_count from "/Users/fredericgessler/Documents/bootstrap/HotKey/data/*.csv"', function(err, qres) {
      if (err) {
        console.warn(err)
        return
      }
      res.send(JSON.stringify(qres[0], (_, v) => typeof v === 'bigint' ? v.toString() : v))
    })
  })

  app.get("/activetime/byapp", (req, res) => {
    query(`
      select * from active_sessions_by_app
      where session_start > now() - interval '3 hours'
    `, res, "full")
  })

  app.get("/activetime/byapp/aggregate", (req, res) => {
    query(`
      
    select 
      app,
      sum(duration) as total_time
    from active_sessions_by_app 
    group by all
    order by total_time desc 
    `, res, "full")
  })

  app.get("/activetime/sessions", (req, res) => {
    query(`
      
    select 
      *
    from active_sessions
    `, res, "full")
  })

  app.get("/status", (req, res) => {
    query(`
        select 
          max(timestamp) as last_event,
          count(*) as event_count
        from "/Users/fredericgessler/Documents/bootstrap/productivity-tracker/darwin/HotKey/data/*.csv"
      `, res, "single")
  })

  app.get("/quack", (req, res) => {
    db.all("select 1 as test", function(err, qres) {
      res.send(JSON.stringify(qres))
    })
  })

  app.get("/cmd", (req, res) => {
    try {
      const cmd = spawn(req.query.cmd)
      let output = ""
      cmd.stdout.on("data", (data) => {output += data})
      cmd.on("close", () => {
        res.send(JSON.stringify(output))
      })
    }
    catch(e) {
        res.send(JSON.stringify(e))
    }
  })

  app.get("/duck", (req, res) => {
    try {
      db.all(req.query.sql, function(err, qres) {
        if(err) {
          res.status(500).send(err)
        }
        res.send(JSON.stringify(qres))
      })
    }
    catch(e) {
      res.send(e)
    }
  })

  app.get("/version", (req, res) => {
    res.send("0.0.1")
  })

  app.get('/context', (req, res) => {
    const ls = spawn('ls');
    const pwd = spawn('pwd');
  
    let lsOutput = ''
    let pwdOutput = ''
  
    ls.stdout.on('data', (data) => {
      lsOutput += data
    })
  
    ls.on('close', () => {
      pwd.stdout.on('data', (data) => {
        pwdOutput += data
      })
  
      pwd.on('close', () => {
        res.send(lsOutput+"\n---\n"+pwdOutput)
      })
    })
  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

//export default createServer

export { createServer }