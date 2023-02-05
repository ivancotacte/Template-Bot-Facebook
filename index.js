import facebook from "fb-chat-api"
import fs from "fs"
import './commands-settings.js'
import processCommand, {
  getPrefixList } from './system/command-process.js'


// Connection bot
facebook({appState: JSON.parse(fs.readFileSync("./session/cookie.json"))}, async (err, api) => {
  if (err) throw console.error(err);
  
  api.listenMqtt(async (err, event) => {
    switch(event.type) {
      case "message":
        const sender = event.senderID
        const prefix = getPrefixList()
        if (prefix.includes(event.body[0])){
          await processCommand(api, event, sender).catch(async e =>{
            console.log(e)
            api.sendMessage(`0x0f1: Application error\n0x0f2: ${e}`, event.threadID)
          })
        }
    }
  })
})