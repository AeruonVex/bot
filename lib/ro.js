const { exec } = require('child_process')
const axios = require('axios')
const fs = require('fs')
const cheerio = require('cheerio')
const ytdl = require('ytdl-core')

const formatBytes = (bytes, decimals = 2) => {
	if (bytes == 0) {
		return '0 Bytes'
	}
	let k = 1024
	let dm = decimals < 0 ? 0 : decimals
	let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
	let i = Math.floor(Math.log(bytes) / Math.log(k))
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const instagram = (link) => {
	return new Promise((resolve, reject) => {
		axios("https://downloadgram.org/", {
			method: "POST",
			data:  new URLSearchParams(Object.entries({ url: link, submit: "" }))
		})
			.then(response => {
			const $ = cheerio.load(response.data)
			$('#downloadhere.dlsection').find('a').each((x,z) => resolve({
				status: true,
				mp4: $(z).attr('href')
			}))
		})
			.catch(e => reject({ status: false, error: String(e) }))
	})
}

const tiktok = (query) => {
	return new Promise((resolve, reject) => {
		axios("https://lovetik.com/api/ajax/search", {
			method: "POST",
			data: new URLSearchParams(Object.entries({ query }))
		})
			.then(response => resolve({
			status: true,
			title: response.data.desc,
			author: response.data.author,
			mp4: (response.data.links[0].a || "").replace("https", "http")
		}))
			.catch(e => reject({ status: false, error: String(e) }))
	})
}

const ytmp4 = (link) => {
	return new Promise((resolve, reject) => {
		ytdl.getInfo(link)
			.then(async(result) => {
			let formats = result.formats
			let object = new Array()
			for (let i = 0; i < formats.length; i++) {
				let video = (formats[i].qualityLabel == '720p') ? (formats[i].qualityLabel == '720p') : (formats[i].qualityLabel == '360p')
				if (formats[i].container == 'mp4' && formats[i].hasVideo == true && formats[i].hasAudio == true && video) {
					let vid = formats[i]
					object.push({url: vid.url, quality: vid.qualityLabel})
				}
			}
			resolve({
				status: true,
				title: result.videoDetails.title,
				quality: object[0].quality,
				mp4: object[0].url
			})
		})
	})
}

const ytmp3 = (link) => {
	return new Promise((resolve, reject) => {
		ytdl.getInfo(link)
			.then(async(result) => {
			let formats = result.formats
			let object = new Array()
			for (let i = 0; i < formats.length; i++) {
				if (formats[i].container == 'webm' && formats[i].hasVideo == false && formats[i].hasAudio == true && formats[i].codecs) {
					object.push(formats[i])
				}
			}
			resolve({
				status: true,
				title: result.videoDetails.title,
				mp3: object[0].url
			})
		})
	})
}

module.exports = { instagram, tiktok, ytmp4, ytmp3 }
