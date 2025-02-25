const axios = require('axios')
const fetch = require('node-fetch')
const fs = require('fs')

const dependence = (dependence) => new Promise((resolve, reject) => {
	let obj = JSON.parse(fs.readFileSync('./package.json')).dependencies
	let x = false
	
	for (let i = 0; Object.entries(obj)[i][0].includes(dependence); i++) x = i
	if (x) return reject({ error: 'Dependency not found' })
	resolve({ dependence: Object.entries(obj)[x][0], version: Object.entries(obj)[x][1] })
})

const fetchJson = (url, options) => new Promise(async (resolve, reject) => {
	fetch(url, options)
		.then(response => response.json())
		.then(x => {
		resolve(x)
	})
		.catch(e => {
		reject(e)
	})
})

const formatNumber = (num) => Number(num).toLocaleString().replace(/,/g, '.')

const getBuffer = async(url, options) => {
	try {
		options ? options : {}
		var res = await axios({
			method: 'get',
			url,
			headers: {
				'DNT': 1,
				'Upgrade-Insecure-Request': 1
			},
			...options,
			responseType: 'arraybuffer'
		})
		return res.data
	} catch (e) {
		console.log(e)
	}
}

const getRandom = (ext = '') => `${Math.floor(Math.random() * 2500)}${ext}`

const h2k = (eco) => {
	var lyrik = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
	var ma = Math.log10(Math.abs(eco)) / 3 | 0
	if (ma == 0) return eco
	var ppo = lyrik[ma]
	var scale = Math.pow(10, ma * 3)
	var scaled = eco / scale
	var formatt = scaled.toFixed(1)
	if (/\.0$/.test(formatt)) formatt = formatt.substr(0, formatt.length - 2)
	return formatt + ppo
}

const isUrl = (url) => url.match(
	new RegExp(
		/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
		'gi'
	)
)

const Json = (string) => JSON.stringify(string, null, 2)

const removeAccents = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

const runtime = (seconds) => {
	seconds = Number(seconds)
	var d = Math.floor(seconds / (3600 * 24))
	var h = Math.floor(seconds % (3600 * 24) / 3600)
	var m = Math.floor(seconds % 3600 / 60)
	var s = Math.floor(seconds % 60)
	var dDisplay = d > 0 ? d + (d == 1 ? ' dia, ' : ' dias, ') : ''
	var hDisplay = h > 0 ? h + (h == 1 ? ' hora, ' : ' horas, ') : ''
	var mDisplay = m > 0 ? m + (m == 1 ? ' minuto, ' : ' minutos, ') : ''
	var sDisplay = s > 0 ? s + (s == 1 ? ' segundo' : ' segundos') : ''
	return dDisplay + hDisplay + mDisplay + sDisplay;
}

const sleep = async(ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = { dependence, fetchJson, formatNumber, getBuffer, getRandom, h2k, isUrl, Json, removeAccents, runtime, sleep }
