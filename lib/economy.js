const fs = require('fs')

const economy = JSON.parse(fs.readFileSync('./database/user/economy.json'))

const isEcoUser = (jid) => {
  let i
  Object.keys(economy).forEach(x => {
    if (economy[x].id == jid) i = x
  })
  return economy[i] || false
}

const newEcoUser = (jid) => {
  if (!jid) return
  if (isEcoUser(jid)) return 'User already registered'
  economy.push({id: jid, money: 0})
  fs.writeFileSync('./database/user/economy.json', JSON.stringify(economy))
  return isEcoUser(jid)
}

const giveMoney = (jid, amount) => {
  if (!isEcoUser(jid)) newEcoUser(jid)
  let i
  Object.keys(economy).forEach(x => {
    if (economy[x].id == jid) i = x
  })
  economy[i].money += Number(amount)
  fs.writeFileSync('./database/user/economy.json', JSON.stringify(economy))
  return isEcoUser(jid)
}

const removeMoney = (jid, amount) => {
  if (!isEcoUser(jid)) return 'Unregistered user'
  let i
  Object.keys(economy).forEach(x => {
    if (economy[x].id == jid) i = x
  })
  economy[i].money -= Number(amount)
  fs.writeFileSync('./database/user/economy.json', JSON.stringify(economy))
  return isEcoUser(jid)
}

module.exports = { isEcoUser, giveMoney, removeMoney }
