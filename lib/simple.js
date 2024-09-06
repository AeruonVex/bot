const { proto, downloadContentFromMessage, jidDecode } = require('@whiskeysockets/baileys')
const fs = require('fs')

const downloadMediaMessage = async(v, filename = 'undefined') => {
	if (v.type == 'viewOnceMessageV2') {
		v.type = v.msg.type
	}
	if (v.type === 'imageMessage') {
		var nameJpg = filename + '.jpg'
		const stream = await downloadContentFromMessage(v.msg, 'image')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameJpg, buffer)
		return fs.readFileSync(nameJpg)
	} else if (v.type === 'videoMessage') {
		var nameMp4 = filename + '.mp4'
		const stream = await downloadContentFromMessage(v.msg, 'video')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameMp4, buffer)
		return fs.readFileSync(nameMp4)
	} else if (v.type === 'audioMessage') {
		var nameMp3 = filename + '.mp3'
		const stream = await downloadContentFromMessage(v.msg, 'audio')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameMp3, buffer)
		return fs.readFileSync(nameMp3)
	} else if (v.type === 'stickerMessage') {
		var nameWebp = filename + '.webp'
		const stream = await downloadContentFromMessage(v.msg, 'sticker')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameWebp, buffer)
		return fs.readFileSync(nameWebp)
	} else if (v.type === 'documentMessage') {
		var ext = v.msg.fileName.split('.')[Number(v.msg.fileName.split('.').length)].toLowerCase().replace('jpeg', 'jpg').replace('png', 'jpg').replace('m4a', 'mp3')
		var nameDoc = filename + '.' + ext
		const stream = await downloadContentFromMessage(v.msg, 'document')
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		fs.writeFileSync(nameDoc, buffer)
		return fs.readFileSync(nameDoc)
	}
}

const client = (inky) => {
	inky.parseMention = (text = '') => {
		return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net')
	}
	inky.decodeJid = (jid) => {
		if (!jid) return jid
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {}
			return decode.user && decode.server && decode.user + '@' + decode.server || jid
		} else return jid
	}
	inky.getGroupAdmins = (jids) => {
		let admins = new Array()
		for (let x of jids) {
			if (x.admin == 'admin' || x.admin == 'superadmin') admins.push(x.id)
		}
		return admins
	}
	return inky
}

const sms = async(inky, v) => {
	if (v.key) {
		v.id = v.key.id
		v.isBaileys = (v.id.startsWith('3EB0') && v.id.length === 12) || (v.id.startsWith('BAE5') && v.id.length === 16)
		v.chat = v.key.remoteJid
		v.fromMe = v.key.fromMe
		v.isGroup = v.chat.endsWith('@g.us')
		v.sender = v.fromMe ? inky.decodeJid(inky.user.id) : v.isGroup ? v.key.participant : v.key.remoteJid
		v.isAdmin = v.isGroup ? inky.getGroupAdmins((await inky.groupMetadata(v.chat)).participants).includes(v.sender) : false
	}
	if (v.message) {
		v.type = Object.entries(v.message)[0][0]
		v.msg = (v.type == 'viewOnceMessageV2') ? v.message[v.type].message[Object.entries(v.message[v.type].message)[0][0]] : v.message[v.type]
		if (v.msg) {
			if (v.type == 'viewOnceMessageV2') {
				v.msg.type = Object.entries(v.message[v.type].message)[0][0]
			}
			let quotedMention = v.msg.contextInfo != null ? v.msg.contextInfo.participant : ''
			let tagMention = v.msg.contextInfo != null ? v.msg.contextInfo.mentionedJid : []
			let mention = typeof(tagMention) == 'string' ? [tagMention] : tagMention
			mention != undefined ? mention.push(quotedMention) : []
			v.mentionUser = mention != undefined ? mention.filter(x => x) : []
			v.body = (v.type == 'conversation') ? v.msg : (v.type == 'extendedTextMessage') ? v.msg.text : (v.type == 'imageMessage') && v.msg.caption ? v.msg.caption : (v.type == 'videoMessage') && v.msg.caption ? v.msg.caption : ''
			v.quoted = v.msg.contextInfo != undefined ? v.msg.contextInfo.quotedMessage : null
			if (v.quoted) {
				v.quoted.type = Object.entries(v.quoted)[0][0]
				v.quoted.id = v.msg.contextInfo.stanzaId
				v.quoted.sender = v.msg.contextInfo.participant
				v.quoted.fromMe = v.quoted.sender.split('@')[0] == inky.user.id.split(':')[0]
				v.quoted.msg = (v.quoted.type == 'viewOnceMessageV2') ? v.quoted[v.quoted.type].message[Object.entries(v.quoted[v.quoted.type].message)[0][0]] : v.quoted[v.quoted.type]
				if (v.quoted.type == 'viewOnceMessageV2') {
					v.quoted.msg.type = Object.entries(v.quoted[v.quoted.type].message)[0][0]
				}
				v.quoted.mentionUser = v.quoted.msg.contextInfo != null ? v.quoted.msg.contextInfo.mentionedJid : []
				v.quoted.fakeObj = proto.WebMessageInfo.fromObject({
					key: {
						remoteJid: v.chat,
						fromMe: v.quoted.fromMe,
						id: v.quoted.id,
						participant: v.quoted.sender
					},
					message: v.quoted
				})
				v.quoted.download = (filename) => downloadMediaMessage(v.quoted, filename)
				v.quoted.delete = () => inky.sendMessage(v.chat, { delete: v.quoted.fakeObj.key })
				v.quoted.react = (emoji) => inky.sendMessage(v.chat, { react: { text: emoji, key: v.quoted.fakeObj.key } })
			}
			v.download = (filename) => downloadMediaMessage(v, filename)
		}
	}
	
	v.react = (emoji) => inky.sendMessage(v.chat, {
		react: {
			text: emoji,
			key: v.key
		}
	})
	v.reply = (teks = '', option = { id: v.chat, mentions: inky.parseMention(teks), quoted: v }) => inky.sendMessage(option.id ? option.id : v.chat, {
		text: teks,
		mentions: option.mentions ? option.mentions : inky.parseMention(teks)
	}, {
		quoted: option.quoted ? option.quoted : v
	})
	v.replyS = (stik, option = { id: v.chat, mentions: [v.sender], quoted: v}) => inky.sendMessage(option.id ? option.id : v.chat, {
		sticker: stik,
		mentions: option.mentions ? option.mentions : [v.sender]
	}, {
		quoted: option.quoted ? option.quoted : v
	})
	v.replyImg = (img, teks = '', option = { id: v.chat, mentions: inky.parseMention(teks), quoted: v}) => inky.sendMessage(option.id ? option.id : v.chat, {
		image: img,
		caption: teks,
		mentions: option.mentions ? option.mentions : inky.parseMention(teks)
	}, {
		quoted: option.quoted ? option.quoted : v
	})
	v.replyVid = (vid, teks = '', option = { id: v.chat, mentions: inky.parseMention(teks), quoted: v}) => inky.sendMessage(option.id ? option.id : v.chat, {
		video: vid,
		caption: teks,
		mentions: option.mentions ? option.mentions : inky.parseMention(teks)
	}, {
		quoted: option.quoted ? option.quoted : v
	})
	v.replyAud = (aud, option = { id: v.chat, mentions: [v.sender], ptt: false, quoted: v }) => inky.sendMessage(option.id ? option.id : v.chat, {
		audio: aud,
		ptt: option.ptt ? option.ptt : false,
		mimetype: 'audio/mpeg',
		mentions: option.mentions ? option.mentions : [v.sender]
	}, {
		quoted: option.quoted ? option.quoted : v
	})
	v.replyDoc = (doc, option = { id: v.chat, mentions: [v.sender], filename: 'undefined.pfd', mimetype: 'application/pdf', quoted: v }) => inky.sendMessage(option.id ? option.id : v.chat, {
		document: doc,
		mimetype: option.mimetype ? option.mimetype : 'application/pdf',
		fileName: option.filename ? option.filename : 'undefined.pdf',
		mentions: option.mentions ? option.mentions : [v.sender]
	}, {
		quoted: option.quoted ? option.quoted : v
	})
	v.replyContact = (name, info, number, option = { id: v.chat, mentions: [v.sender], quoted: v }) => {
		let vcard = 'BEGIN:VCARD\nVERSION:3.0\nFN:' + name + '\nORG:' + info + ';\nTEL;type=CELL;type=VOICE;waid=' + number + ':+' + number + '\nEND:VCARD'
		return inky.sendMessage(
			option.id ? option.id : v.chat,
			{
				contacts: {
					displayName: name,
					contacts: [{ vcard }]
				},
				mentions: option.mentions ? option.mentions : [v.sender]
			}, {
				quoted: option.quoted ? option.quoted : v
			}
		)
	}
	
	return v
}

module.exports = { client, sms }
