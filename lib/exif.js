const axios = require('axios')
const BodyForm = require('form-data')
const cheerio = require('cheerio')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const WebP = require('node-webpmux')

const { getRandom } = require('./functions')

const imageToWebp = (media) => {
    var nameWebp = getRandom('.webp')
    return new Promise((resolve, reject) => {
        ffmpeg(media)
            .on('error', (e) => {
            fs.unlinkSync(media)
            reject(e)
        })
            .on('end', async() => {
            fs.unlinkSync(media)
            resolve(fs.readFileSync(nameWebp))
            fs.unlinkSync(nameWebp)
        })
            .addOutputOptions([
            "-vcodec",
            "libwebp",
            "-vf",
            "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
        ])
            .toFormat('webp')
            .save(nameWebp)
    })
}

const videoToWebp = (media) => {
    var nameWebp = getRandom('.webp')
    return new Promise((resolve, reject) => {
        ffmpeg(media)
            .on('error', (e) => {
            fs.unlinkSync(media)
            reject(e)
        })
            .on('end', () => {
            fs.unlinkSync(media)
            resolve(fs.readFileSync(nameWebp))
            fs.unlinkSync(nameWebp)
        })
            .addOutputOptions([
                "-vcodec",
                "libwebp",
                "-vf",
                "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                "-loop",
                "0",
                "-ss",
                "00:00:00",
                "-t",
                "00:00:05",
                "-preset",
                "default",
                "-an",
                "-vsync",
                "0"
            ])
            .toFormat('webp')
            .save(nameWebp)
    })
}

const webpToMp4 = (path) => {
	return new Promise((resolve, reject) => {
		 const form = new BodyForm()
		 form.append('new-image-url', '')
		 form.append('new-image', fs.createReadStream(path))
		 axios({
			  method: 'post',
			  url: 'https://s6.ezgif.com/webp-to-mp4',
			  data: form,
			  headers: {
				   'Content-Type': `multipart/form-data; boundary=${form._boundary}`
			  }
		 }).then(({ data }) => {
			  const bodyFormThen = new BodyForm()
			  const $ = cheerio.load(data)
			  const file = $('input[name="file"]').attr('value')
			  bodyFormThen.append('file', file)
			  bodyFormThen.append('convert', 'Convert WebP to MP4!')
			  axios({
				   method: 'post',
				   url: 'https://ezgif.com/webp-to-mp4/' + file,
				   data: bodyFormThen,
				   headers: {
						'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}`
				   }
			  }).then(({ data }) => {
				   const $ = cheerio.load(data)
				   const result = 'https:' + $('div#output > p.outfile > video > source').attr('src')
				   resolve(result)
			  }).catch(reject)
		 }).catch(reject)
	})
}

const writeExif = async(media, metadata) => {
    var nameWebp = getRandom('.webp')
    return new Promise(async(resolve, reject) => {
        let img = new WebP.Image()
        var json = {
            'sticker-pack-id': 'https://github.com/godinky',
            'sticker-pack-name': metadata ? metadata.packname : 'ღ ｴɳƙყ 乂 ᴳᵒᵈ ღ',
            'sticker-pack-publisher': metadata ? metadata.author : '',
            'emojis': ['']
        }
        var exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
        var jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8')
        var exif = Buffer.concat([exifAttr, jsonBuff])
        exif.writeUIntLE(jsonBuff.length, 14, 4)
        await img.load(media)
        img.exif = exif
        await img.save(nameWebp)
        resolve(fs.readFileSync(nameWebp))
        await fs.unlinkSync(nameWebp)
    })
}

module.exports = { imageToWebp, videoToWebp, webpToMp4, writeExif }
