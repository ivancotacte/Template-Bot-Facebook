import util from "util"
import fs from "fs"

export default async function ({bot, event, parameters, sender}) {
  let text = parameters.join(" ")
  let evaled = eval(text)
  if (typeof evaled !== 'string') evaled = util.inspect(evaled)
  return bot.sendMessage(evaled, event.threadID)
}
