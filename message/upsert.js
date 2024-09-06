require('../config')

/*
	Libreria
*/

const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { exec } = require('child_process')
const fs = require('fs')
const P = require('pino')
const util = require('util')
const yts = require('yt-search')

/*
	Js
*/

const bj = new Array()
const xo = new Array()
const setCasino = new Set()
const setWork = new Set()

const { isEcoUser, giveMoney, removeMoney } = require('../lib/economy')
const { imageToWebp, videoToWebp, webpToMp4, writeExif } = require('../lib/exif')
const { dependence, fetchJson, formatNumber, getBuffer, getRandom, h2k, isUrl, Json, removeAccents, runtime, sleep } = require('../lib/functions')
const ro = require('../lib/ro')
const { client, sms } = require('../lib/simple')

const { addSetBJ, drawRandomCard, getHandValue, position, isBJFrom, isBJPlayer, isSpamBJ } = require('../lib/game/blackjack')

/*
	Database
*/

const setting = JSON.parse(fs.readFileSync('./database/setting.json'))

// Usuario
const ban = JSON.parse(fs.readFileSync('./database/user/ban.json'))
const vip = JSON.parse(fs.readFileSync('./database/user/vip.json'))
const owner = JSON.parse(fs.readFileSync('./database/user/owner.json'))
const staff = JSON.parse(fs.readFileSync('./database/user/staff.json'))

// Grupo
const antilink = JSON.parse(fs.readFileSync('./database/group/antilink.json'))
const mute = JSON.parse(fs.readFileSync('./database/group/mute.json'))

/*
	Otros
*/

let asd

module.exports = async(inky, m) => {
	try {
		v = m.messages[0]
		if (!v.message) return
		
		v.message = (Object.entries(v.message)[0][0] == 'ephemeralMessage') ? v.message.ephemeralMessage.message : v.message
		if (v.key && v.key.remoteJid === 'status@broadcast') return
		
		inky = client(inky)
		v = await sms(inky, v)
		if (v.isBaileys) return
		
		const prefix = global.prefix
		const isCmd = v.body.startsWith(prefix)
		const command = isCmd ? removeAccents(v.body.slice(prefix.length)).trim().split(' ').shift().toLowerCase() : ''
		const commandStik = (v.type == 'stickerMessage') ? v.msg.fileSha256.toString('base64') : ''
		
		const args = v.body.trim().split(/ +/).slice(1)
		const q = args.join(' ')
		const senderNumber = v.sender.split('@')[0]
		const botNumber = inky.user.id.split(':')[0]
		const userBal = isEcoUser(senderNumber) ? isEcoUser(senderNumber).money : '0'
		try { var bio = (await inky.fetchStatus(v.sender)).status } catch { var bio = 'Sin Bio' }
		const bal = h2k(userBal)
		
		const groupMetadata = v.isGroup ? await inky.groupMetadata(v.chat) : {}
		const groupMembers = v.isGroup ? groupMetadata.participants : []
		const groupAdmins = v.isGroup ? inky.getGroupAdmins(groupMembers) : false
		
		const isMe = (botNumber == senderNumber)
		const isBotAdmin = v.isGroup ? groupAdmins.includes(botNumber + '@s.whatsapp.net') : false
		const isOwner = owner.includes(senderNumber) || isMe
		const isStaff = staff.includes(senderNumber) || isOwner
		const isVip = vip.includes(senderNumber) || isStaff
		const isBanned = ban.includes(senderNumber)
		const isMute = v.isGroup ? mute.includes(v.chat) : false
		
		const rank = (user = senderNumber) => {
			if (owner.includes(user) || (botNumber == user)) {
				var rankS = '👑 Owner 👑'
			} else if (staff.includes(user)) {
				var rankS = '🎮 Staff 🎮'
			} else if (vip.includes(user)) {
				var rankS = '✨ Vip ✨'
			} else {
				var rankS = 'Usuario'
			}
			return rankS
		}
		
		const isMedia = (v.type === 'imageMessage' || v.type === 'videoMessage')
		const isQuotedMsg = v.quoted ? (v.quoted.type === 'conversation') : false
		const isQuotedViewOnce = v.quoted ? (v.quoted.type == 'viewOnceMessageV2') : false
		const isQuotedImage = v.quoted ? ((v.quoted.type === 'imageMessage') || (v.quoted.msg.type === 'imageMessage')) : false
		const isQuotedVideo = v.quoted ? ((v.quoted.type === 'videoMessage') || (v.quoted.msg.type === 'videoMessage')) : false
		const isQuotedSticker = v.quoted ? (v.quoted.type === 'stickerMessage') : false
		const isQuotedAudio = v.quoted ? (v.quoted.type === 'audioMessage') : false
		
		const isAntiLink = v.isGroup ? antilink.includes(v.chat) : false
		
		const quotedStatus = {
			key: {
				remoteJid: 'status@broadcast',
				participant: '0@s.whatsapp.net'
			},
			message: {
				audioMessage: {
					ptt: true,
					seconds: 2013,
					caption: fake
				}
			}
		}
		
		const spam = (number = '1', teks = fake) => new Promise(async(resolve, reject) => {
			if (!isNaN(number)) {
				for (let i = 1; Number(number) >= i; i++) {
					await v.reply(teks, { quoted: v })
				}
				resolve('Sucess.')
			} else {
				reject('No number.')
			}
		})
		
		if (isAntiLink && isBotAdmin && !v.isAdmin && v.body.includes('chat.whatsapp.com/')) {
			if (v.body.split('chat.whatsapp.com/')[1].split(' ')[0] === (await inky.groupInviteCode(v.chat))) return
			await inky.sendMessage(v.chat, { delete: v.key })
			inky.groupParticipantsUpdate(v.chat, [v.sender], 'remove')
				.then(x => v.reply('@' + senderNumber + ' ha sido eliminado por mandar link de otro grupo'))
				.catch(e => v.reply(e))
		}
		if (setting.mode == 'self') {
			if (!isStaff) return
		}
		if (isBanned) return
		if (isMute && !command.includes('mute')) return

		if (!v.body.startsWith(prefix)) {
			if (isOwner) {
				if (v.body.startsWith('x')) {
					await v.react('⏳')
					try {
						await v.reply(Json(eval(q)))
					} catch(e) {
						await v.reply(String(e))
					}
				}
				if (v.body.startsWith(':')) {
					await v.react('⏳')
					try {
						await v.reply(util.format(await eval(`(async () => { return ${q}})()`)))
					} catch(e) {
						await v.reply(util.format(e))
					}
				}
				if (v.body.startsWith('>')) {
					await v.react('⏳')
					try {
						await v.reply(util.format(await eval(`(async () => {${v.body.slice(1)}})()`)))
					} catch(e) {
						await v.reply(util.format(e))
					}
				}
				if (v.body.startsWith('$')) {
					await v.react('⏳')
					exec(v.body.slice(1), (err, stdout) => {
						if (err) return v.reply(err)
						if (stdout) return v.reply(stdout)
					})
				}
				if (v.body.includes('<3') && isQuotedViewOnce) {
					asd = v
					await asd.quoted.download(getRandom())
				}
			}

			if (isQuotedImage && v.quoted.msg.caption.includes('youtu') && (v.body.toLowerCase().includes('audio') || v.body.toLowerCase().includes('video'))) {
				let url = v.quoted.msg.caption.replace(/ /g, '_').split('_')
				await v.react('✨')
				await v.reply(mess.wait)
				let link = new Array()
				for (let i = 0; i < url.length; i++) {
					if (url[i].includes('youtu')) link.push(url[i])
				}
				if (v.body.toLowerCase().includes('audio')) {
					ro.ytmp3(link[0])
						.then(async(x) => await v.replyDoc({url: x.mp3}, {filename: x.title + '.mp3', mimetype: 'audio/mpeg'}))
						.catch(async(e) => await v.reply('Hubo un error al descargar su archivo'))
				} else if (v.body.toLowerCase().includes('video')) {
					ro.ytmp4(link[0])
						.then(async(x) => await v.replyVid({url: x.mp4}, fake))
						.catch(async(e) => await v.reply('Hubo un error al descargar su archivo'))
				}
			}
			
			if (v.body.toLowerCase().startsWith('bot')) {
				if (!q) return
				var none = await fetchJson(`https://api.simsimi.net/v2/?text=${q}&lc=es`)
				await v.reply(none.success)
			} else if (v.body.toLowerCase().includes('teta')) {
				await v.replyS(fs.readFileSync('./media/sticker/Tetas♡.webp'))
			} else if (v.body.toLowerCase() == 'que') {
				await v.reply('So')
				await v.reply('Se regalo')
			}
			
			if (v.body.toLowerCase().startsWith('hit')) {
				if (!(isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false)) return
				await v.react('✨')
				var bjPosition = bj[position(bj, v.chat, v.sender)]
				bjPosition.pHand.push(drawRandomCard())
				if (getHandValue(bjPosition.bHand) <= 10) {
					bjPosition.bHand.push(drawRandomCard())
				}
				if (getHandValue(bjPosition.pHand) > 21) {
					await v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Has perdido $${h2k(bjPosition.balance)}* 🃏`)
					bj.splice(bj.indexOf(bjPosition), 1)
					if (!isOwner) {
						addSetBJ(senderNumber)
					}
				} else {
					await v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n\n🃏 Usa *Hit* o *Stand* 🃏\n\nApuesta: *$${h2k(bjPosition.balance)}*\nBalance: *$${bal}*`)
				}
			}
			if (v.body.toLowerCase().startsWith('stand')) {
				if (!(isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false)) return
				await v.react('✨')
				var bjPosition = bj[position(bj, v.chat, v.sender)]
				bj.splice(bj.indexOf(bjPosition), 1)
				if (!isOwner) {
					addSetBJ(senderNumber)
				}
				if (getHandValue(bjPosition.pHand) < getHandValue(bjPosition.bHand)) {
					await v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Has perdido $${h2k(bjPosition.balance)}* 🃏`)
				} else if (getHandValue(bjPosition.pHand) === getHandValue(bjPosition.bHand)) {
					var result = Number(bjPosition.balance)
					giveMoney(senderNumber, result)
						await v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Ha sido un empate* 🃏`)
				} else {
					var result = Number(bjPosition.balance)*2
					giveMoney(senderNumber, result)
					await v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bjPosition.pHand)}*\n➫ Mano del bot: *${getHandValue(bjPosition.bHand)}*\n\n🃏 *Felicidades has ganado $${h2k(Number(bjPosition.balance))}* 🃏`)
				}
			}
		}
		
		switch (commandStik) {}
		
		switch (command) {

/*
	Test
*/

case 'xo':
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario para jugar al *Tic Tac Toe*')

break

/*
	End Test
*/

case 'menu':
await v.react('✨')
var dep = await dependence('baileys')
var teks = `\t\t\t𖣘✿Ⓑⓞⓣ Ⓘⓝⓕⓞ✿𖣘

│ ➼ Prefijo: *⌜ ${prefix} ⌟*
│ ➼ Modo: *${(setting.mode == 'self') ? 'Privado' : 'Publico'}*
│ ➼ Libreria: *${dep.dependence.replace('@', '')}@${dep.version.replace('^', '')}*

\t\t\t𖣘✿Ⓤⓢⓔⓡ Ⓘⓝⓕⓞ✿𖣘

│ ➼ Nombre: *${v.pushName}*
│ ➼ Tag: *@${senderNumber}*
│ ➼ Bio: *${bio}*
│ ➼ Rango: *${rank()}*
│ ➼ Balance: *$${bal}*${isNaN(bal) ? ` (${formatNumber(userBal)})` : ''}
͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏͏
\t\t\t𖣘✿🄲🄾🄼🄰🄽🄳🄾🅂✿𖣘

\t●Ⓥⓘⓟ●
➼ ${prefix}join
➼ ${prefix}kiss

\t●Ⓖⓡⓤⓟⓞⓢ●
➼ ${prefix}antilink <0/1>
➼ ${prefix}promote / ${prefix}demote
➼ ${prefix}kick
➼ ${prefix}random
➼ ${prefix}giveaway <duracion> <premio>
➼ ${prefix}delete
➼ ${prefix}hidetag
➼ ${prefix}tagall

\t●Ⓔⓒⓞⓝⓞⓜⓘⓐ●
➼ ${prefix}balance
➼ ${prefix}transferir <monto> <@usuario>
➼ ${prefix}trabajar
➼ ${prefix}tienda
➼ ${prefix}top

\t●Ⓙⓤⓔⓖⓞⓢ●
➼ ${prefix}blackjack <monto>
➼ ${prefix}casino <monto>

\t●Ⓒⓞⓝⓥⓔⓡⓣⓘⓓⓞⓡ●
➼ ${prefix}sticker
➼ ${prefix}robar <texto>
➼ ${prefix}toimg
➼ ${prefix}togif
➼ ${prefix}tomp3

\t●Ⓓⓔⓢⓒⓐⓡⓖⓐ●
➼ ${prefix}play <texto>
➼ ${prefix}tiktok <link>
➼ ${prefix}igdl <link>
➼ ${prefix}ytmp3 <link>
➼ ${prefix}ytmp4 <link>

\t●Ⓢⓣⓞⓡⓐⓖⓔ●
➼ ${prefix}storage
➼ ${prefix}send <texto>

\t●Ⓞⓣⓡⓞⓢ●
➼ ${prefix}creador
➼ ${prefix}perfil
➼ ${prefix}join <link>
${isStaff ? `
\t●Ⓢⓣⓐⓕⓕ●
➼ ${prefix}mode <public/self>
➼ ${prefix}lista
➼ ${prefix}ban / ${prefix}unban
➼ ${prefix}addvip / ${prefix}delvip
➼ ${prefix}mute / ${prefix}unmute
➼ ${prefix}save <texto>
➼ ${prefix}delfile <texto>
`: ''}${isOwner ? `
\t●Ⓞⓦⓝⓔⓡ●
➼ ${prefix}addstaff / ${prefix}delstaff
➼ ${prefix}addbal <monto> / ${prefix}delbal <monto>
` : ''}`
await v.replyImg(fs.readFileSync('./media/image/menu.jpg'), teks)
break

case 'creditos':
await v.react('✨')
var teks = `\t\t\t\t\t\t\t\t\t*ღ Creditos ღ*

\t\t\t\t\t乂 @595992526554 乂
│ ➼ Programador y creador de ${botName}
│ ➼ Instagram: https://www.instagram.com/inky.exe/

\t\t\t\t*ღ Grupo Oficial de Soporte ღ*

${groupSupport}`
await v.reply(teks)
break

case 'dueño':
case 'creador':
case 'creator':
case 'owner':
await v.react('✨')
await v.replyContact('🖤ｴɳƙყᴳᵒᵈ🖤', 'Creador de ' + botName, '595992526554')
break

case 'del':
case 'delete':
await v.react('✨')
if (!v.quoted) return v.reply('Responda a un mensaje del bot, con el comando ' + prefix + command)
if (v.isGroup && !v.isAdmin) return v.reply(mess.only.admins)
await v.quoted.delete()
break

case 'perfil':
case 'profile':
await v.react('✨')
if (v.mentionUser[0]) { var userB = v.mentionUser[0].split('@')[0] } else { var userB = senderNumber }
var uBal = isEcoUser(userB) ? isEcoUser(userB).money : '0'
try { var bio = (await inky.fetchStatus(userB + '@s.whatsapp.net')).status } catch { var bio = 'Sin Bio' }
var teks = `\t\t\t\t\t*${botName} Profile*

│ ➼ Usuario: *@${userB}*
│ ➼ Bio: *${bio}*
│ ➼ Wame: *https://wa.me/${userB}*

│ ➼ Balance: *$${h2k(uBal)}*${isNaN(h2k(uBal)) ? ` (${formatNumber(uBal)})` : ''}
│ ➼ Rango: *${rank(userB)}*`
try {
	var image = await getBuffer(await inky.profilePictureUrl(userB + '@s.whatsapp.net', 'image'))
} catch {
	var image = fs.readFileSync('./media/image/menu.jpg')
}
await v.replyImg(image, teks)
break

/*
	Vip
*/

case 'join':
await v.react('✨')
if (!isVip) return v.reply(mess.only.vip)
if (userBal < 100000) return v.reply('Necesitas *$100K* para usar este comando')
if (!q) return v.reply('Ingrese el enlace del grupo')
if (!isUrl(q) && !q.includes('whatsapp.com')) return v.reply('Link invalido')
removeMoney(senderNumber, 10000)
await v.reply(mess.wait)
inky.groupAcceptInvite(q.split('chat.whatsapp.com/')[1])
	.then(async(x) => {
	await v.reply('He ingresado exitosamente al grupo')
	await v.reply('He sido añadido al grupo por pedido de @' + senderNumber, {id: x})
})
	.catch(async(e) => await v.reply('No he podido ingresar al grupo, verifique que el enlace funcione, o no he podido ingresar por que me han eliminado el grupo.'))
break

case 'kiss':
case 'besar':
await v.react('✨')
if (!isVip) return v.reply(mess.only.vip)
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (v.mentionUser[0].split('@')[0] === senderNumber) return v.reply('No puede besarse a si mismo')
await v.reply('@' + senderNumber + ' ha besado a @' + v.mentionUser[0].split('@')[0])
await v.replyS(fs.readFileSync('./media/sticker/kiss.webp'))
break

case 'viewonce':
await v.react('✨')
if (!isVip) return v.reply(mess.only.vip)
if (!isQuotedViewOnce) return v.reply('Mencione mensaje de *vista de una vez*')
var name = getRandom()
if (v.quoted.msg.type == 'imageMessage') {
	await v.quoted.download(name)
	v.replyImg(fs.readFileSync(`${name}.jpg`))
	await fs.unlinkSync(`${name}.jpg`)
} else if (v.quoted.msg.type == 'videoMessage') {
	await v.quoted.download(name)
	v.replyVid(fs.readFileSync(`${name}.mp4`))
	await fs.unlinkSync(`${name}.mp4`)
}
break

/*
	Grupo
*/

case 'antilink':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
if (!q) return v.reply(`Use *${prefix + command} 1* para activarlo o *${prefix + command} 0* para desactivarlo`)
if (Number(q) === 1) {
	if (isAntiLink) return v.reply('El antilink ya estaba activo')
	if (!isBotAdmin) return v.reply(mess.only.badmin)
	antilink.push(v.chat)
	fs.writeFileSync('./database/group/antilink.json', Json(antilink))
	await v.reply('Se ha activado el antilink')
} else if (Number(q) === 0) {
	if (!isAntiLink) return v.reply('El antilink ya estaba desactivado')
	antilink.splice(v.chat)
	fs.writeFileSync('./database/group/antilink.json', Json(antilink))
	await v.reply('Se ha desactivado el antilink')
} else {
	await v.reply(`Use *${prefix + command} 1* para activarlo o *${prefix + command} 0* para desactivarlo`)
}
break

case 'promote':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
if (!isBotAdmin) return v.reply(mess.only.badmin)
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (v.sender === v.mentionUser[0]) return v.reply('No puede promotearse usted mismo')
if (groupAdmins.includes(v.mentionUser[0])) return v.reply(`El usuario @${v.mentionUser[0].split('@')[0]} ya es administrador`)
await inky.groupParticipantsUpdate(v.chat, [v.mentionUser[0]], 'promote')
	.then(async(x) => await v.reply(`Ha sido promovido a @${v.mentionUser[0].split('@')[0]} como administrador por @${senderNumber}`))
	.catch(async(e) => await v.reply(e))
break

case 'demote':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
if (!isBotAdmin) return v.reply(mess.only.badmin)
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (v.sender === v.mentionUser[0]) return v.reply('No puede demotearse usted mismo')
if (!groupAdmins.includes(v.mentionUser[0])) return v.reply(`El usuario @${v.mentionUser[0].split('@')[0]} no es administrador`)
await inky.groupParticipantsUpdate(v.chat, [v.mentionUser[0]], 'demote')
	.then(async(x) => await v.reply(`Ha sido removido a @${v.mentionUser[0].split('@')[0]} como administrador por @${senderNumber}`))
	.catch(async(e) => await v.reply(e))
break

case 'kick':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
if (!isBotAdmin) return v.reply(mess.only.badmin)
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (v.sender === v.mentionUser[0]) return v.reply('No puede kickearse usted mismo')
if (owner.includes(v.mentionUser[0].split('@')[0])) return v.reply('No es posible eliminar a un owner del bot')
if (groupAdmins.includes(v.mentionUser[0])) return v.reply('No es posible eliminar a un administrador')
await inky.groupParticipantsUpdate(v.chat, [v.mentionUser[0]], 'remove')
	.then(async(x) => await v.reply(`Ha sido eliminado @${v.mentionUser[0].split('@')[0]} del grupo por @${senderNumber}`))
	.catch(async(e) => await v.reply(e))
break

case 'kickall':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
if (!isBotAdmin) return v.reply(mess.only.badmin)
if (!isMe) return v.reply('Comando exclusivo para el bot')
for (let x of groupMembers.map(x => x.id)) {
	if (!(x.split('@')[0] == botNumber)) {
		await inky.groupParticipantsUpdate(v.chat, [x], 'remove')
	}
}
break

case 'linkgc':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
var code = await inky.groupInviteCode(v.chat)
await v.reply('\t\t\tLink del grupo *' + groupMetadata.subject + '*\n│ ➼ https://chat.whatsapp.com/' + code)
break

case 'random':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
var none = Math.floor(Math.random() * groupMembers.length + 0)
var user = groupMembers[none].id
await v.reply('Ha sido elegido @' + user.split('@')[0])
break

case 'tag':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
if (!v.quoted) return v.reply('Responda a un mensaje con el comando *' + prefix + command + '*')
if (v.quoted.type == 'conversation') {
	await v.reply(v.quoted.conversation, {mentions: groupMembers.map(x => x.id)})
} else {
	if (v.quoted.type == 'imageMessage') {
		var name = getRandom()
		await v.replyImg(await v.quoted.download(name), v.quoted.msg.caption ? v.quoted.msg.caption : '', {mentions: groupMembers.map(x => x.id)})
		fs.unlinkSync(name + '.jpg')
	} else if (v.quoted.type == 'videoMessage') {
		var name = getRandom()
		await v.replyVid(await v.quoted.download(name), v.quoted.msg.caption ? v.quoted.msg.caption : '', {mentions: groupMembers.map(x => x.id)})
		fs.unlinkSync(name + '.mp4')
	} else if (v.quoted.type == 'audioMessage') {
		var name = getRandom()
		await v.replyAud(await v.quoted.download(name), { ptt: true, mentions: groupMembers.map(x => x.id)})
		fs.unlinkSync(name + '.mp3')
	} else if (v.quoted.type == 'stickerMessage') {
		var name = getRandom()
		await v.replyAud(await v.quoted.download(name), {mentions: groupMembers.map(x => x.id)})
		fs.unlinkSync(name + '.webp')
	}
}
break

case 'hidetag':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
await v.reply(q, {mentions: groupMembers.map(x => x.id)})
break

case 'tagall':
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!v.isAdmin) return v.reply(mess.only.admins)
var jids = []
groupMembers.map(x => jids.push(x.id))
var teks = `\t\t\t\t\t*${groupMetadata.subject}*\n\n➫ *Total de admins:* ${groupAdmins.length}\n➫ *Total de miembros:* ${groupMembers.length}\n`
for (let x of jids) {
	teks += `\n| ➼ @${x.split('@')[0]}`
}
await v.reply(teks)
break

/*
	Economia
*/

case 'bal':
case 'balance':
case 'money':
case 'dinero':
case 'plata':
case 'guita':
await v.react('✨')
if (v.mentionUser[0]) { var userB = v.mentionUser[0].split('@')[0] } else { var userB = senderNumber }
var uBal = isEcoUser(userB) ? isEcoUser(userB).money : '0'
var teks = `\t\t\t*${botName} Balance*

│ ➼ Usuario: *@${userB}*
│ ➼ Balance: *$${h2k(uBal)}*${isNaN(h2k(uBal)) ? ` (${formatNumber(uBal)})` : ''}
│ ➼ Rango: *${rank(userB)}*`
await v.reply(teks)
break

case 'transfer':
case 'transferir':
await v.react('✨')
if (!q) return v.reply('Ingrese el monto que desea transferir')
if (isNaN(args[0])) return v.reply('El monto ingresado debe de ser un numero')
if (v.mentionUser[0] === undefined) return v.reply('Mencione al usuario que desea transferirle')
if (args[0] < 100) return v.reply('Monto minimo para transferir es de $100')
if (args[0].includes('.')) return v.reply('No se puede transferir numeros decimales')
if (userBal < args[0]) return v.reply('No tienes suficiente dinero')
giveMoney(v.mentionUser[0].split('@')[0], args[0])
removeMoney(senderNumber, args[0])
await v.reply(`\t\t\t${botName} Transfer\n\n│ ➼ Transferido de: @${senderNumber}\n│ ➼ Transferido a: @${v.mentionUser[0].split('@')[0]}\n│ ➼ Monto: *$${h2k(args[0])}*${isNaN(h2k(args[0])) ? ` (${formatNumber(args[0])})` : ''}`)
break

case 'top':
case 'baltop':
case 'topbal':
await v.react('✨')
var none = JSON.parse(fs.readFileSync('./database/user/economy.json'))
var teks = '\t\t\t\t\t*' + botName + ' Top Bal*'
none.sort((a, b) => (a.money < b.money) ? 1 : -1)
var total = 10
if (none.length < 10) total = none.length
for (let i = 0; i < total; i++) {
	teks += `\n\n${i + 1}.  @${none[i].id}\n\t\t│ ➼ Balance: *$${h2k(none[i].money)}*\n\t\t│ ➼ Rango: *${rank(none[i].id)}*`
}
await v.reply(teks)
break

case 'shop':
case 'tienda':
await v.react('✨')
var teks = `\t\t\t${botName} Shop

\t\t\t\t\t*༒ Rangos ༒*

╭───── *✨ Vip ✨* ─────
│ \t\t${isVip ? '*Ya tienes el rango ✨ Vip ✨*' : 'Usa *' + prefix + command + ' vip* para comprar el rango *✨ Vip ✨*'}
│ ➼ *Precio:* _$500K_
│ ➼ *Ventajas:*
│ \t\t- Acceso al comando *${prefix}kiss*
│ \t\t- Acceso al comando *${prefix}join*
│
│ \t\t- Limite en BlackJack en *$10k*
╰───────────────╮

│ ➼ Usuario: *@${senderNumber}*
│ ➼ Balance: *$${bal}*${isNaN(bal) ? ` (${formatNumber(userBal)})` : ''}
│ ➼ Rango: *${rank()}*

Para comprar un articulo use *${prefix + command} <articulo>*`
if (q.toLowerCase().includes('vip')) {
	if (isVip) return v.reply('Usted ya tiene el rango *✨ Vip ✨*')
	if (userBal < 500000) return v.reply('No tienes suficiente dinero para comprar el rango *✨ Vip ✨*')
	removeMoney(senderNumber, 500000)
	vip.push(senderNumber)
	fs.writeFileSync('./database/user/vip.json', Json(vip))
	await v.reply('@' + senderNumber + ' has comprado exitosamente el rango *✨ Vip ✨*, espero que lo disfrutes :D')
} else {
	await v.reply(teks)
}
break

case 'work':
case 'trabajar':
case 'laburar':
await v.react('✨')
if (setWork.has(senderNumber)) return v.reply('Espere 2 horas para volver a trabajar')
var amount = getRandom()
giveMoney(senderNumber, amount)
if (amount >= 2000) {
	await v.reply('Has hecho un trabajado *muy duro y largo* en la esquina, y te han pagado *$' + formatNumber(amount) + '* por el servicio')
} else if (amount >= 1000) {
	await v.reply('Has trabajado en el pole dance, y te han pagado *$' + formatNumber(amount) + '*')
} else if (amount >= 500) {
	await v.reply('Hiciste un buen trabajo en las diablitas, y te han pagado *$' + formatNumber(amount) + '*')
} else {
	await v.reply('Has hecho un trabajo malo en la terminal como **** y solo te pagaron *$' + formatNumber(amount) + '*')
}
if (isOwner) return
setWork.add(senderNumber)
await sleep(((1000 * 60) * 60) * 2)
setWork.delete(senderNumber)
break

/*
	Juego
*/

case 'dado':
case 'dados':
await v.react('✨')
v.replyS(fs.readFileSync('./media/dados/' + (Math.floor(Math.random() * 6) + 1) + '.webp'))
break

case 'bj':
case 'blackjack':
await v.react('✨')
if (isBJFrom(bj, v.chat) ? isBJPlayer(bj, v.sender) : false) return v.reply('Ya tienes un juego en curso')
if (isSpamBJ(senderNumber)) return v.reply('Espere 25 segundos para jugar de nuevo')
if (!q) return v.reply(`Ingrese un monto, ejemplo: ${prefix + command} <monto>`)
if (isNaN(args[0])) return v.reply('El monto tiene que ser un numero')
if (args[0] < 100) return v.reply('Monto minimo debe de ser de 100$')
if (args[0].includes('.')) return v.reply('No se puede jugar con numero decimales')
if (!isOwner) { if (isVip) { if (q > 10000) return v.reply('Maximo para apostar es de *$10K*') } else { if (q > 5000) return v.reply('Maximo para apostar es de *$5K*') } }
if (userBal < args[0]) return v.reply('No tienes suficiente dinero')
var obj = {id: v.sender, from: v.chat, balance: args[0], pHand: [(drawRandomCard() - 1), drawRandomCard()], bHand: [(drawRandomCard() - 1), drawRandomCard()]}
bj.push(obj)
removeMoney(senderNumber, args[0])
v.reply(`*♣️ BlackJack ♠️*\n\n➫ Mano de @${senderNumber}: *${getHandValue(bj[position(bj, v.chat, v.sender)].pHand)}*\n\n🃏 Usa *Hit* o *Stand* 🃏\n\nApuesta: *$${h2k(getHandValue(bj[position(bj, v.chat, v.sender)].balance).slice(1))}*\nBalance: *$${h2k(userBal-getHandValue(bj[position(bj, v.chat, v.sender)].balance))}*`)
break

case 'casino':
await v.react('✨')
if (setCasino.has(senderNumber)) return v.reply('Espere 10 segundos para jugar de nuevo')
if (!q) return v.reply(`Ingrese un monto, ejemplo: ${prefix + command} <monto>`)
if (isNaN(args[0])) return v.reply('El monto tiene que ser un numero')
if (q < 50) return v.reply('Monto minimo debe de ser de 50$')
if (q.includes('.')) return v.reply('No se puede jugar con numero decimales')
if (!isOwner) { if (args[0] > 5000) return v.reply('Maximo para apostar es de *$5K*') }
if (userBal < args[0]) return v.reply('No tienes suficiente dinero')
var deck = ['10', '5', '5', '5', '5', '5']
var ran = deck[Math.floor(Math.random() * deck.length)]
var fail = ['🍊 : 🍒 : 🍐', '🍒 : 🔔 : 🍊', '🍊 : 🍋 : 🔔', '🔔 : 🍒 : 🍐', '🔔 : 🍒 : 🍊', '🍊 : 🍋 : 🔔', '🍐 : 🍒 : 🍋', '🍊 : 🍒 : 🍒', '🔔 : 🔔 : 🍇', '🍌 : 🍒 : 🔔', '🍐 : 🔔 : 🔔', '🍊 : 🍋 : 🍒', '🍋 : 🍋 : 🍌', '🔔 : 🔔 : 🍇', '🔔 : 🍐 : 🍇']
var win = ['🍇 : 🍇 : 🍇', '🍐 : 🍐 : 🍐', '🔔 : 🔔 : 🔔', '🍒 : 🍒 : 🍒', '🍊 : 🍊 : 🍊', '🍌 : 🍌 : 🍌']
var fail1 = fail[Math.floor(Math.random() * fail.length)]
var fail2 = fail[Math.floor(Math.random() * fail.length)]
var win1 = win[Math.floor(Math.random() * win.length)]     
if (ran < 10) {
	var teks = `╭─╼┥${botName}┝╾─╮\n╽ ┌──────────┐ ┃\n\t\t\t\t\t🍋 : 🍌 : 🍍\n┃ ├──────────┤ ┃\n\t\t\t\t\t${fail1}\n┃ ├──────────┤ ┃\n\t\t\t\t\t${fail2}\n╿ └──────────┘ ╿\n╰──┥${botName}┠──╯\n\nHas perdido $${h2k(q)}`
	removeMoney(senderNumber, args[0])
} else {
	var teks = `╭─╼┥${botName}┝╾─╮\n╽ ┌──────────┐ ┃\n\t\t\t\t\t🍋 : 🍌 : 🍍\n┃ ├──────────┤ ┃\n\t\t\t\t\t${win1}\n┃ ├──────────┤ ┃\n\t\t\t\t\t${fail1}\n╿ └──────────┘ ╿\n╰──┥${botName}┠──╯\n\nFelicidades has ganado $${h2k((q * 5))}`
	giveMoney(senderNumber, args[0] * 5)
}
await v.reply(teks)
setCasino.add(senderNumber)
await sleep(5000)
setCasino.delete(senderNumber)
break

/*
	Convertidor
*/

case 's':
case 'stik':
case 'stiker':
case 'sticker':
await v.react('✨')
if (isQuotedViewOnce && !isVip) return v.reply(mess.only.vip)
if ((v.type === 'imageMessage') || isQuotedImage) {
	v.reply(mess.wait)
	var nameJpg = getRandom()
	isQuotedImage ? await v.quoted.download(nameJpg) : await v.download(nameJpg)
	var stik = await imageToWebp(nameJpg + '.jpg')
	writeExif(stik, {packname: 'ღ ' + v.pushName + ' 乂 ' + botName + ' ღ', author: ''})
		.then(async(x) => await v.replyS(x))
} else if ((v.type === 'videoMessage') || isQuotedVideo) {
	v.reply(mess.wait)
	var nameMp4 = getRandom()
	isQuotedVideo ? await v.quoted.download(nameMp4) : await v.download(nameMp4)
	var stik = await videoToWebp(nameMp4 + '.mp4')
	writeExif(stik, {packname: 'ღ ' + v.pushName + ' 乂 ' + botName + ' ღ', author: ''})
		.then(async(x) => await v.replyS(x))
} else {
	await v.reply('Responda a una imagen o video con el comando ' + prefix + command)
}
break

case 'robar':
await v.react('✨')
if (!isQuotedSticker) return v.reply('Responda a un sticker con el comando ' + prefix + command + ' <texto>')
var pack = q.split('|')[0]
var author = q.split('|')[1]
v.reply(mess.wait)
var nameWebp = getRandom()
var media = await v.quoted.download(nameWebp)
await writeExif(media, {packname: pack, author: author})
	.then(async(x) => await v.replyS(x))
fs.unlinkSync(nameWebp + '.webp')
break

case 'inkys':
await v.react('✨')
if (!isQuotedSticker) return v.reply('Responda a un sticker con el comando ' + prefix + command)
v.reply(mess.wait)
var nameWebp = getRandom()
var media = await v.quoted.download(nameWebp)
await writeExif(media)
	.then(async(x) => await v.replyS(x))
fs.unlinkSync(nameWebp + '.webp')
break

case 'nihil':
await v.react('✨')
if (!isQuotedSticker) return v.reply('Responda a un sticker con el comando ' + prefix + command)
v.reply(mess.wait)
var nameWebp = getRandom()
var media = await v.quoted.download(nameWebp)
await writeExif(media, {packname: 'nihil', author: 'Follow me on ig @mr._waflee_xd'})
	.then(async(x) => await v.replyS(x))
fs.unlinkSync(nameWebp + '.webp')
break

case 'toimg':
await v.react('✨')
if (!isQuotedSticker) return v.reply('Responda a un sticker estatico con el comando *' + prefix + command + '* o use *' + prefix + 'togif*')
if (v.quoted.msg.isAnimated) return v.reply('Responda a un sticker estatico con el comando *' + prefix + command + '* o use *' + prefix + 'togif*')
v.reply(mess.wait)
var nameWebp = getRandom()
var nameJpg = getRandom('.jpg')
await v.quoted.download(nameWebp)
exec(`ffmpeg -i ${nameWebp}.webp ${nameJpg}`, async(err) => {
	fs.unlinkSync(nameWebp + '.webp')
	if (err) return v.reply(String(err))
	await v.replyImg(fs.readFileSync(nameJpg))
	fs.unlinkSync(nameJpg)
})
break

case 'togif':
await v.react('✨')
if (!isQuotedSticker) return v.reply('Responda a un sticker animado con el comando *' + prefix + command + '* o use *' + prefix + 'toimg*')
if (!v.quoted.msg.isAnimated) return v.reply('Responda a un sticker animado con el comando *' + prefix + command + '* o use *' + prefix + 'toimg*')
v.reply(mess.wait)
var nameWebp = getRandom()
await v.quoted.download(nameWebp)
webpToMp4(nameWebp + '.webp')
	.then(async(x) => {
	await v.replyVid({url: x}, fake, {gif: true})
	fs.unlinkSync(nameWebp + '.webp')
})
break

case 'tomp3':
await v.react('✨')
if (!isQuotedVideo) return v.reply('Responda a un video con el comando ' + prefix + command)
v.reply(mess.wait)
var nameMp4 = getRandom()
var nameMp3 = getRandom('.mp3')
await v.quoted.download(nameMp4)
exec(`ffmpeg -i ${nameMp4}.mp4 ${nameMp3}`, async(e) => {
	fs.unlinkSync(nameMp4 + '.mp4')
	if (e) return v.reply(String(e))
	if (q == '-ppt') {
		await v.replyAud(fs.readFileSync(nameMp3), {ptt: true})
	} else {
		await v.replyAud(fs.readFileSync(nameMp3))
	}
	fs.unlinkSync(nameMp3)
})
break

/*
	Descarga
*/

case 'play':
await v.react('✨')
if (!q) return v.reply('Use *' + prefix + command + ' <texto>*')
var play = await yts(q)
var vid = play.videos[0]
var teks = `\t\t\t► ${botName} Youtube

ღ *Titulo:* ${vid.title}
ღ *Duracion:* ${vid.timestamp}
ღ *Visitas:* ${h2k(vid.views)}
ღ *Author:* ${vid.author.name}
ღ *Link:* ${vid.url}`
var buffer = await getBuffer(vid.image)
await v.replyImg(buffer, teks)
break

case 'tiktok':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('tiktok')) return v.reply('Comando incorrecto, use: *' + prefix + command + ' <link>*')
await v.reply(mess.wait)
ro.tiktok(q)
	.then(async(x) => await v.replyVid({url: x.mp4}, fake))
	.catch(async(e) => await v.reply('Hubo un error al descargar su archivo'))
break

case 'ig':
case 'igdl':
case 'insta':
case 'instagram':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('instagram')) return v.reply('Comando incorrecto, use: *' + prefix + command + ' <link>*')
await v.reply(mess.wait)
ro.instagram(q)
	.then(async(x) => await v.replyVid({url: x.mp4}, fake))
	.catch(async(e) => await v.reply('Hubo un error al descargar su archivo'))
break

case 'ytmp3':
await v.react('✨')
if (!q || !isUrl(q) && !q.includes('youtu')) return v.reply('Comando incorrecto, use: *' + prefix + command + ' <link>*')
await v.reply(mess.wait)
ro.ytmp3(q)
	.then(async(x) => await v.replyDoc({url: x.mp3}, {filename: x.title + '.mp3', mimetype: 'audio/mpeg'}))
	.catch(async(e) => await v.reply('Hubo un error al descargar su archivo'))
break

case 'ytmp4':
await v.react('✨')
if (!isOwner) return v.reply('Comando en mantenimiento.')
if (!q || !isUrl(q) && !q.includes('youtu')) return v.reply('Comando incorrecto, use: *' + prefix + command + ' <link>*')
await v.reply(mess.wait)
ro.ytmp4(q)
	.then(async(x) => await v.replyVid({url: x.mp4}, fake))
	.catch(async(e) => await v.reply('Hubo un error al descargar su archivo'))
break

/*
	Staff
*/

case 'reiniciar':
case 'restart':
if (!isOwner) return v.react('❌')
await v.react('✨')
await v.reply('Reiniciando ' + botName + ', por favor espere...')
await sleep(2000)
exec('pm2 restart inky.js', (err, stdout) => {
	if (err) return v.reply(err)
})
break

case 'mode':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (q.toLowerCase() === 'public') {
	if (setting.mode == 'public') return v.reply('Ya estaba activo el modo publico')
	setting.mode = 'public'
	await fs.writeFileSync('./database/setting.json', JSON.stringify(setting))
	await v.reply('Se ha activado el modo publico')
} else if (q.toLowerCase() === 'self') {
	if (setting.mode == 'self') return v.reply('Ya estaba activo el modo privado')
	setting.mode = 'self'
	await fs.writeFileSync('./database/setting.json', JSON.stringify(setting))
	await v.reply('Se ha activado el modo privado')
} else {
	await v.reply('Use *' + prefix + command + ' <public/self>*')
}
break

case 'lista':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (!q) return v.reply('Use ' + prefix + command + ' <datos>')
if (args[0].toLowerCase() == 'vip') {
	var teks = `\t\t\t*Lista ✨ Vip ✨* (${vip.length})\n`
	if (vip.length > 0) {
	for (let x of vip) teks += `\n| ➼ @${x.split('@')[0]}`
	} else teks += `\n| ➼`
	await v.reply(teks)
} else if (args[0].toLowerCase() == 'ban') {
	var teks = `\t\t\t*Lista 🚫 Ban 🚫* (${ban.length})\n`
	if (ban.length > 0) {
	for (let x of ban) teks += `\n| ➼ @${x.split('@')[0]}`
	} else teks += `\n| ➼`
	await v.reply(teks)
} else if (args[0].toLowerCase() == 'staff') {
	var teks = `\t\t\t*Lista 🎮 Staff 🎮* (${staff.length})\n`
	if (staff.length > 0) {
	for (let x of staff) teks += `\n| ➼ @${x.split('@')[0]}`
	} else teks += `\n| ➼`
	await v.reply(teks)
} else if (args[0].toLowerCase() == 'owner') {
	var teks = `\t\t\t*Lista 👑 Owner 👑* (${owner.length})\n`
	if (owner.length > 0) {
	for (let x of owner) teks += `\n| ➼ @${x.split('@')[0]}`
	} else teks += `\n| ➼`
	await v.reply(teks)
} else if (args[0].toLowerCase() == 'grupos') {
	var allG = Object.entries(await inky.groupFetchAllParticipating()).map(x => x[1])
	var teks = `\t\t\t*Lista de Grupos* (${allG.length})`
	for (let x of allG) {
		var isBotAdm = inky.getGroupAdmins(x.participants).includes(botNumber + '@s.whatsapp.net')
		if (isBotAdm) code = await inky.groupInviteCode(x.id)
		teks += `\n\n\n\t\t\t\t${x.subject}
\t│ ➼ Id: ${x.id}
\t│ ➼ Creador: ${x.owner ? '@' + x.owner.split('@')[0] : 'Sin datos'}
\t│ ➼ Miembros: ${x.participants.length}${isBotAdm ? `\n\t│ ➼ Link: https://chat.whatsapp.com/${code}` : ''}`
	}
	await v.reply(teks)
} else {
	await v.reply('No hay ninguna lista llamada ' + args[0])
}
break

case 'ban':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (ban.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario ya esta baneado')
if (staff.includes(v.mentionUser[0].split('@')[0]) || owner.includes(v.mentionUser[0].split('@')[0])) return v.reply('No se puede banear al equipo de staff')
ban.push(v.mentionUser[0].split('@')[0])
await fs.writeFileSync('./database/user/ban.json', Json(ban))
await v.reply('Ha sido baneado del bot a @' + v.mentionUser[0].split('@')[0] + ' por @' + senderNumber)
break

case 'unban':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (!ban.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario no esta baneado')
ban.splice(ban.indexOf(v.mentionUser[0].split('@')[0]), 1)
await fs.writeFileSync('./database/user/ban.json', Json(ban))
await v.reply('Ha sido desbaneado del bot a @' + v.mentionUser[0].split('@')[0] + ' por @' + senderNumber)
break

case 'mute':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (mute.includes(v.chat)) return v.reply('El grupo ya esta muteado')
mute.push(v.chat)
await fs.writeFileSync('./database/group/mute.json', Json(mute))
await v.reply('Ha sido muteado el grupo por @' + senderNumber)
break

case 'unmute':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (!v.isGroup) return v.reply(mess.only.group)
if (!mute.includes(v.chat)) return v.reply('El grupo no esta muteado')
mute.splice(mute.indexOf(v.chat), 1)
await fs.writeFileSync('./database/group/mute.json', Json(mute))
await v.reply('Ha sido desmuteado el grupo por @' + senderNumber)
break

case 'addbal':
if (!isOwner) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (isNaN(args[0])) return v.reply('El monto tiene que ser un numero')
if (args[0].includes('.')) return v.reply('No se puede depositar numeros decimales')
giveMoney(v.mentionUser[0].split('@')[0], args[0])
await v.reply(`\t\t\t*Deposito de dinero*\n\n│ ➼ Monto: *$${h2k(args[0])}*\n│ ➼ Usuario: *@${v.mentionUser[0].split('@')[0]}*`)
break

case 'delbal':
if (!isOwner) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (isNaN(args[0])) return v.reply('El monto tiene que ser un numero')
if (args[0].includes('.')) return v.reply('No se puede retirar numeros decimales')
if (isEcoUser(v.mentionUser[0].split('@')[0]).money < args[0]) return v.reply('El usuario no cuenta con esa cantidad')
removeMoney(v.mentionUser[0].split('@')[0], args[0])
await v.reply(`\t\t\t*Descuento de dinero*\n\n│ ➼ Monto: *$${h2k(args[0])}*\n│ ➼ Usuario: *@${v.mentionUser[0].split('@')[0]}*`)
break

case 'addvip':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (vip.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario ya tiene el rango *✨ Vip ✨*')
vip.push(v.mentionUser[0].split('@')[0])
await fs.writeFileSync('./database/user/vip.json', Json(vip))
await v.reply('Ha sido agregado el rango *✨ Vip ✨* a @' + v.mentionUser[0].split('@')[0])
break

case 'delvip':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (!vip.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario no es usuario *✨ Vip ✨*')
vip.splice(vip.indexOf(v.mentionUser[0].split('@')[0]), 1)
await fs.writeFileSync('./database/user/vip.json', Json(vip))
await v.reply('Ha sido removido el rango *✨ Vip ✨* de @' + v.mentionUser[0].split('@')[0])
break

case 'addowner':
if (!isMe) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (owner.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario ya tiene el rango *👑 Owner 👑*')
owner.push(v.mentionUser[0].split('@')[0])
await fs.writeFileSync('./database/user/owner.json', Json(owner))
await v.reply('Ha sido agregado el rango *👑 Owner 👑* a @' + v.mentionUser[0].split('@')[0])
break

case 'delowner':
if (!isMe) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (v.mentionUser[0].includes('595995660558')) return v.reply('No es posible sacarle *👑 Owner 👑* a Inky')
if (!owner.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario no es usuario *👑 Owner 👑*')
owner.splice(owner.indexOf(v.mentionUser[0].split('@')[0]), 1)
await fs.writeFileSync('./database/user/owner.json', Json(owner))
await v.reply('Ha sido removido el rango *👑 Owner 👑* de @' + v.mentionUser[0].split('@')[0])
break

case 'addstaff':
if (!isOwner) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (staff.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario ya tiene el rango *🎮 Staff 🎮*')
staff.push(v.mentionUser[0].split('@')[0])
await fs.writeFileSync('./database/user/staff.json', Json(staff))
await v.reply('Ha sido agregado el rango *🎮 Staff 🎮* a @' + v.mentionUser[0].split('@')[0])
break

case 'delstaff':
if (!isOwner) return v.react('❌')
await v.react('✨')
if (v.mentionUser[0] === undefined) return v.reply('Mencione a un usuario')
if (!staff.includes(v.mentionUser[0].split('@')[0])) return v.reply('El usuario no es usuario *🎮 Staff 🎮*')
staff.splice(staff.indexOf(v.mentionUser[0].split('@')[0]), 1)
await fs.writeFileSync('./database/user/staff.json', Json(staff))
await v.reply('Ha sido removido el rango *🎮 Staff 🎮* de @' + v.mentionUser[0].split('@')[0])
break

case 'save':
if (!isStaff) return v.react('❌')
await v.react('✨')
if (!q) return v.reply('Nombre para el archivo?')
if (!v.quoted) return v.reply('Responde a un archivo para guardarlo')
var sFiles = new Array({ sticker: fs.readdirSync('./media/sticker'), audio: fs.readdirSync('./media/audio'), image: fs.readdirSync('./media/image'), video: fs.readdirSync('./media/video') })
if (isQuotedSticker) {
	var nameWebp = getRandom()
	var media = await v.quoted.download(nameWebp)
	await fs.writeFileSync(`./media/sticker/${q}.webp`, media)
	fs.unlinkSync(nameWebp + '.webp')
	await v.reply('Sticker guardado exitosamente')
} else if (isQuotedAudio) {
	var nameMp3 = getRandom()
	var media = await v.quoted.download(nameMp3)
	await fs.writeFileSync(`./media/audio/${q}.mp3`, media)
	fs.unlinkSync(nameMp3 + '.mp3')
	await v.reply('Audio guardado exitosamente')
} else if (isQuotedImage) {
	var nameJpg = getRandom()
	var media = await v.quoted.download(nameJpg)
	await fs.writeFileSync(`./media/image/${q}.jpg`, media)
	fs.unlinkSync(nameJpg + '.jpg')
	await v.reply('Imagen guardado exitosamente')
} else if (isQuotedVideo) {
	var nameMp4 = getRandom()
	var media = await v.quoted.download(nameMp4)
	await fs.writeFileSync(`./media/video/${q}.mp4`, media)
	fs.unlinkSync(nameMp4 + '.mp4')
	await v.reply('Video guardado exitosamente')
} else {
	await v.reply('Responde a un archivo para guardarlo')
}
break

case 'storage':
await v.react('✨')
var sFiles = new Array({ sticker: fs.readdirSync('./media/sticker'), audio: fs.readdirSync('./media/audio'), image: fs.readdirSync('./media/image'), video: fs.readdirSync('./media/video') })
teks = `\t\t\t\t${botName} Storage\n\nღ *Stickers* (${(sFiles[0].sticker.length - 1)})\n`
if (sFiles[0].sticker.length === 1) teks += '\n│ ➼ '
for (var x of sFiles[0].sticker) {
	if (!(x === '@god_inky')) {
		teks += `\n│ ➼ ${x.replace('.webp', '')}`
	}
}
teks += `\n\nღ *Audios* (${(sFiles[0].audio.length - 1)})\n`
if (sFiles[0].audio.length === 1) teks += '\n│ ➼ '
for (var x of sFiles[0].audio) {
	if (!(x === '@god_inky')) {
		teks += `\n│ ➼ ${x.replace('.mp3', '')}`
	}
}
teks += `\n\nღ *Imagenes* (${(sFiles[0].image.length - 1)})\n`
if (sFiles[0].image.length === 1) teks += '\n│ ➼ '
for (var x of sFiles[0].image) {
	if (!(x === '@god_inky')) {
		teks += `\n│ ➼ ${x.replace('.jpg', '')}`
	}
}
teks += `\n\nღ *Videos* (${(sFiles[0].video.length - 1)})\n`
if (sFiles[0].video.length === 1) teks += '\n│ ➼ '
for (var x of sFiles[0].video) {
	if (!(x === '@god_inky')) {
		teks += `\n│ ➼ ${x.replace('.mp4', '')}`
	}
}
teks += `\n\nUse *${prefix}send <nombre del archivo>* para visualizarlo${(isStaff) ? `\n\nUse *${prefix}save <nombre>* para guardarlo\n\nUse *${prefix}delfile <nombre del archivo>* para eliminarlo` : ''}`
await v.reply(teks)
break

case 'send':
await v.react('✨')
var sFiles = new Array({ sticker: fs.readdirSync('./media/sticker'), audio: fs.readdirSync('./media/audio'), image: fs.readdirSync('./media/image'), video: fs.readdirSync('./media/video') })
if ((sFiles[0].sticker.includes(q + '.webp')) || (sFiles[0].audio.includes(q + '.mp3')) || (sFiles[0].image.includes(q + '.jpg')) || (sFiles[0].video.includes(q + '.mp4'))) {
	if (sFiles[0].sticker.includes(q + '.webp')) {
		await v.replyS(fs.readFileSync('./media/sticker/' + q + '.webp'))
	}
	if (sFiles[0].audio.includes(q + '.mp3')) {
		await v.replyAud(fs.readFileSync('./media/audio/' + q + '.mp3'), {ptt: true})
	}
	if (sFiles[0].image.includes(q + '.jpg')) {
		await v.replyImg(fs.readFileSync('./media/image/' + q + '.jpg'), fake)
	}
	if (sFiles[0].video.includes(q + '.mp4')) {
		await v.replyVid(fs.readFileSync('./media/video/' + q + '.mp4'), fake)
	}
} else {
	await v.reply('No existe ningun archivo con ese nombre')
}
break

case 'delfile':
if (!isStaff) return v.react('❌')
await v.react('✨')
var sFiles = new Array({ sticker: fs.readdirSync('./media/sticker'), audio: fs.readdirSync('./media/audio'), image: fs.readdirSync('./media/image'), video: fs.readdirSync('./media/video') })
if ((sFiles[0].sticker.includes(q + '.webp')) || (sFiles[0].audio.includes(q + '.mp3')) || (sFiles[0].image.includes(q + '.jpg')) || (sFiles[0].video.includes(q + '.mp4'))) {
	if (sFiles[0].sticker.includes(q + '.webp')) {
		await fs.unlinkSync('./media/sticker/' + q + '.webp')
		await v.reply('Sticker eliminado exitosamente')
	}
	if (sFiles[0].audio.includes(q + '.mp3')) {
		await fs.unlinkSync('./media/audio/' + q + '.mp3')
		await v.reply('Audio eliminado exitosamente')
	}
	if (sFiles[0].image.includes(q + '.jpg')) {
		await fs.unlinkSync('./media/image/' + q + '.jpg')
		await v.reply('Imagen eliminado exitosamente')
	}
	if (sFiles[0].video.includes(q + '.mp4')) {
		await fs.unlinkSync('./media/video/' + q + '.mp4')
		await v.reply('Video eliminado exitosamente')
	}
} else {
	await v.reply('No existe ningun archivo con ese nombre')
}
break

			default:

				if (isCmd) v.react('❌')
				
	}
		
	} catch (e) {
		const isError = String(e)
		
		if (isError.includes('rate-overlimit')) return
		if (isError.includes('startsWith')) return
		
		console.log(e)
	}
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(`Update ${__filename}`)
  delete require.cache[file]
  require(file)
})
