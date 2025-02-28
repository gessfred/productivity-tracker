const { app, BrowserWindow, Notification } = require('electron');
const path = require('node:path')

const notify = (text) => {
  const notif = new Notification({title: 'HotKey', body: text})
  notif.show()
}

//import { createServer } from './server'
const createServer = async() => {
  try {
    /*const express = require('express')
    //const cors = require('cors')
    const app = express()
    //app.use(cors())
    const port = 3000

    app.get("/version", (req, res) => {
      res.send("0.0.1")
    })*/

    /*app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })*/
  }
  catch(e) {
    return e
  }
}


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  //mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  notify("creating server")
  createServer().then(r => {
    notify("created server")
    createWindow()
  }).catch((err) => notify(`couldn't create server ${err}`))
  

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})
