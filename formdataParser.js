const fs = require('fs');


function getFormData(req, cb) {

    let buffer = [],
        boundary = getBoundary(req);

    req.on('data', (chunk) => buffer.push(chunk)).on('end', () => {
        cb(decodeFormData(buffer.toString(), boundary));
    });
}


function decodeFormData(data, boundary) {

    const rawDataArray = data.split(boundary);

    let result = {};

    for (let item of rawDataArray) {

        let name = getMatching(item, /(?:name=")(.+?)(?:")/)
        if (!name || !(name = name.trim())) continue

        let value = getMatching(item, /(?:\r\n\r\n)([\S\s]*)(?:\r\n--$)/)
        if (!value) continue

        let filename = getMatching(item, /(?:filename=")(.*?)(?:")/)

        if (filename && (filename = filename.trim())) 
        {
            let file = {
                filename       : `${new Date().getTime()}_${filename}`,
                "Content-Type" : getMatching(item, /(?:Content-Type:)(.*?)(?:\r\n)/)
            }     
            
            const stream = fs.createWriteStream(`./images/${file.filename}`);
            stream.write(value, 'binary');
            stream.close();


            if (!result.files) result.files = []

            result.files.push(file)
            continue;
        }

        result[name] = value
    }

    return result;
}


function getBoundary(req) {

    let contentType = req.headers['content-type']

    const contentTypeArray = contentType.split(';').map(item => item.trim())
    const boundaryPrefix = 'boundary='

    let boundary = contentTypeArray.find(item => item.startsWith(boundaryPrefix))

    if (!boundary) return null

    boundary = boundary.slice(boundaryPrefix.length)

    if (boundary) boundary = boundary.trim()

    return boundary
}


function getMatching(string, regex) {

    const matches = string.match(regex)
    if (!matches || matches.length < 2) {
        return null
    }
    return matches[1]
}


module.exports.getFormData = getFormData;