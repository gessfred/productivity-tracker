/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path'
import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'
import MenuBuilder from './menu'
import { resolveHtmlPath } from './util'

const duckdb = require('duckdb')
const db = new duckdb.Database('hotkey.db')

const query = (q: string, res: any, returnType: string) => {
  db.all(q, function(err: any, qres: any) {
    if (err) {
      console.warn(err)
      return
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
      create or replace view active_sessions 
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
            sum((coalesce(diff_s > 3, true))::int) over (
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
    `, ((err: any, res: any) => console.log(err)))

  app.get('/eventcount', (req: any, res: any) => {
    db.all('select count(*) as event_count from "/Users/fredericgessler/Documents/bootstrap/HotKey/data/*.csv"', function(err: any, qres: any) {
      if (err) {
        console.warn(err)
        return
      }
      res.send(JSON.stringify(qres[0], (_, v) => typeof v === 'bigint' ? v.toString() : v))
    })
  })

  app.get("/activetime", (req: any, res: any) => {
    query(`
      select * from active_sessions
    `, res, "full")
  })

  app.get("/activetime/byapp", (req: any, res: any) => {
    query(`
      
    select 
      app,
      sum(duration) as total_time
    from active_sessions 
    group by all
    order by total_time desc 
    `, res, "full")
  })

  app.get("/status", (req: any, res: any) => {
    query(`
        select 
          max(timestamp) as last_event,
          count(*) as event_count
        from "/Users/fredericgessler/Documents/bootstrap/productivity-tracker/darwin/HotKey/data/*.csv"
      `, res, "single")
  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow()
    createServer()
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
