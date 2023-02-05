import {readdirSync as readdir} from 'fs'


// Listing all commands
const commands = readdir('./commands', {withFileTypes:true}).map(item=>{
  if (item.isDirectory()) {
    const group = {group:item.name, items:[]}
    readdir('./commands/'+item.name, {withFileTypes:true}).forEach(subitem=>{
      if (subitem.isDirectory()) return
      if (subitem.name.startsWith('*')) return
      if (!subitem.name.endsWith('.js')) return
      group.items.push(subitem.name.slice(0,-3))
    })
    return group
  } else {
    if (item.name.startsWith('*')) return
    if (item.name.endsWith('.js')) return item.name.slice(0,-3)
  }
}).filter(x=>x)


const settings = {}
export const setCommandsSettings = function (newSettings) {
  Object.assign(settings, newSettings)
}

export const getPrefixList = function () {
  return settings.prefix_list || []
}

export const getOwnerID = function () {
  return settings.owner_id || []
}

function getMenuText(p) {
  return [
    settings.menu_header,
    ...commands.map(item=>{
      if (typeof item === 'string') return fillFormat(settings.item_format, item, p)
      return [
        fillFormat(settings.group_format, item.group, p),
        ...item.items.map(i=>fillFormat(settings.item_format, i, p))
      ]
    }),
    settings.menu_footer,
  ].join('\n').replaceAll(/\n{3,}/g,'\n\n')
}


function fillFormat(str, name, prefix) {
  return str.replaceAll('(name)',name).replaceAll('(prefix)',prefix)
}


export default async function (bot, event, sender) {
  
  const owner = getOwnerID()
  const isOwner = owner.includes(sender)
  
  const text = event.body
  if (!text) return
  if (text.length <= 1) return
  
  const prefix = text[0]
  const {
    prefix_list, menu_command, command_not_found, show_typing, group_only_commands,
    group_only_message, admin_only_commands, admin_only_message, owner_only_commands, owner_only_message
  } = settings
  if (!prefix_list.includes(prefix)) return

  const [_, c, p] = text.match(/.[ \n]*([\S]+)(?:[ \n]+([\S\s]+))?/) || []
  const commandName = c.toLowerCase()
  
//  if (show_typing) await bot.showTyping(message.room)
  
  if (menu_command.includes(commandName)) return bot.sendMessage(getMenuText(prefix), event.threadID)
    
  if (!commandExists(commandName)) {
    if (command_not_found) await bot.sendMessage(fillFormat(command_not_found, commandName, prefix), event.threadID)
    return
  }
  
  if (owner_only_commands.includes(commandName) && !isOwner) return bot.sendMessage(owner_only_message, event.threadID)
  
  const parameters = p?.split(' ') || []
  const {default: runScript} = await import (getCommandPath(commandName))
  return runScript({bot, prefix, event, parameters, sender})
  
}

function commandExists(cmd) {
  return commands.some(item=>item===cmd||item.items?.includes(cmd))
}

function getCommandPath(cmd) {
  const cmdItem = commands.find(item=>item===cmd||item.items?.includes(cmd))
  const path = typeof cmdItem == 'string' 
    ? cmdItem + '.js' 
    : cmdItem.group + '/' + cmd + '.js'
  return '../commands/' + path
}
