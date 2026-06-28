const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const os = require('os')

const dataDir = path.join(os.homedir(), '.ltt-swiss')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

contextBridge.exposeInMainWorld('lttStorage', {
  save: (filename, data) => {
    fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2))
  },
  load: (filename) => {
    const file = path.join(dataDir, filename)
    if (!fs.existsSync(file)) return null
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  },
  list: () => {
    return fs.readdirSync(dataDir).filter(f => f.endsWith('.json'))
  },
  delete: (filename) => {
    const file = path.join(dataDir, filename)
    if (fs.existsSync(file)) fs.unlinkSync(file)
  },
})