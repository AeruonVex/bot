/*
	Librerias
*/

const {
	default: makeWASocket,
	useMultiFileAuthState,
	DisconnectReason,
	makeCacheableSignalKeyStore,
	getContentType
} = require('@whiskeysockets/baileys')
const P = require('pino')
const { exec } = require('child_process')

const start = async() => {
	const level = P({ level: 'silent' })
	const {
		state,
		saveCreds
	} = await useMultiFileAuthState('session')
	
	const inky = makeWASocket({
		logger: level,
		printQRInTerminal: true,
		auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, level),
        },
	})
	
	inky.ev.on('connection.update', update => {
		const { connection, lastDisconnect } = update
		if(connection === 'close') {
			if (lastDisconnect.error.output.statusCode !== 401) {
                start()
            } else {
                exec('rm -rf session')
                console.error('connection closed')
                start()
            }
		} else if(connection === 'open') {
			console.log('opened connection')
		}
	})
	
	inky.ev.on('creds.update', saveCreds)
	
	inky.ev.on('messages.upsert', m => {
		require('./message/upsert')(inky, m)
	})
}

start()
