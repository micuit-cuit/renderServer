const { createCanvas } = require('canvas');
const express = require('express');
const app = express();
const port = 5500;
const LZString = require('lz-string');
const crypto = require('crypto');
require('dotenv').config();
const fs = require('fs');
const cssColorNames = ["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","green","greenyellow","grey","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"]

const blocklist = [
    "doubleclick.net",
    "googlesyndication.com",
    "google-analytics.com",
    "adservice.google.com",
    "facebook.net",
    "facebook.com",
    "connect.facebook.net",
    "trackingpixel.net",
    "iplogger.org",
    "grabify.link",
    "2no.co",
    "yip.su",
    "iplogger.com",
    "iplogger.ru",
    "blackhatworld.com",
    "pixel.wp.com",
    "stats.wp.com",
    "statcounter.com",
    "matomo.org",
    "mixpanel.com",
    "segment.com",
    "heap.io",
    "newrelic.com"
]
const minimizeList= {
    "fs": "fillStyle",
    "ss": "strokeStyle",
    "lw": "lineWidth",
    "lc": "lineCap",
    "lj": "lineJoin",
    "ml": "miterLimit",
    "ga": "globalAlpha",
    "gco": "globalCompositeOperation",
    "ft": "font",
    "ta": "textAlign",
    "tb": "textBaseline",
    "sc": "shadowColor",
    "sb": "shadowBlur",
    "sox": "shadowOffsetX",
    "soy": "shadowOffsetY",
    "r": "rect",
    "fr": "fillRect",
    "sr": "strokeRect",
    "cr": "clearRect",
    "bp": "beginPath",
    "cp": "closePath",
    "mt": "moveTo",
    "lt": "lineTo",
    "a": "arc",
    "at": "arcTo",
    "qc": "quadraticCurveTo",
    "bc": "bezierCurveTo",
    "f": "fill",
    "s": "stroke",
    "cl": "clip",
    "di": "drawImage",
    "ftx": "fillText",
    "stx": "strokeText",
    "sv": "save",
    "rs": "restore",
    "tr": "translate",
    "rt": "rotate",
    "scal": "scale",
    "stf": "setTransform",
    "rst": "resetTransform",
    "fsp": "fillStylePattern",
    "ssp": "strokeStylePattern"
}
const reverseMinimizeList = Object.fromEntries(Object.entries(minimizeList).map(([k, v]) => [v, k]));

const regex = {
    number: "(\\d+(?:[.,]\\d+)?)",
    color: (color) => {
        if (color.startsWith('#')) {
            return new RegExp(`^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})|([0-9a-fA-F]{8})$`);
        } else if (color.startsWith('rgb')) {
            return new RegExp(`^rgb\\(\\s*(${regex.number}),\\s*(${regex.number}),\\s*(${regex.number})\\s*\\)$`);
        } else if (color.startsWith('rgba')) {
            return new RegExp(`^rgba\\(\\s*(${regex.number}),\\s*(${regex.number}),\\s*(${regex.number}),\\s*(${regex.number})\\s*\\)$`);
        } else if (color.startsWith('hsl')) {
            return new RegExp(`^hsl\\(\\s*(${regex.number}),\\s*(${regex.number})%,\\s*(${regex.number})%\\s*\\)$`);
        } else if (color.startsWith('hsla')) {
            return new RegExp(`^hsla\\(\\s*(${regex.number}),\\s*(${regex.number})%,\\s*(${regex.number})%,\\s*(${regex.number})\\s*\\)$`);
        } else if (cssColorNames[color]) {
            return new RegExp(`^${cssColorNames[color]}$`);
        } else if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
            // Pour les gradients, on peut vérifier la structure basique
            return new RegExp(`.*`)
        }
        return new RegExp(`(?=a)b`);
    },
    cap: "butt|round|square",
    join: "bevel|round|miter",
    globalCompositeOperation: "source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|lighter|copy|xor",
    stringVerify: ".*",
    textAlign: "start|end|left|right|center",
    baseline: "top|hanging|middle|alphabetic|ideographic|bottom",
    bool: "true|false",
    url : '^https:\\\/\\\/(?!(?:localhost|(?:\\d{1,3}\\.){3}\\d{1,3}|[^\\\/\\s]+\\.local\\b|[^\\\/\\s]+\\.lan\\b))([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})(:\\d+)?\\\/[^\\s]*$'
}
const log = (...args) => {
    if (process.env.DEBUG) {
        console.log(...args);
    }
};
const ParserTable = {
    [`fillStyle:color:*color`]: (ctx, color, ...arg) => {
        log("Setting fillStyle to", color);
        if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
            color = gradientColorToCanvas(ctx, color, arg)
        }
        ctx.fillStyle = color;
    },
    [`strokeStyle:color:*color`]: (ctx, color, ...arg) => {
        log("Setting strokeStyle to", color);
        if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
            color = gradientColorToCanvas(ctx, color, arg)
        }
        ctx.strokeStyle = color;
    },
    [`lineWidth:number`]: (ctx, width) => {
        log("Setting lineWidth to", width);
        ctx.lineWidth = parseFloat(width);
    },
    [`lineCap:cap`]: (ctx, cap) => {
        log("Setting lineCap to", cap);
        ctx.lineCap = cap;
    },
    [`lineJoin:join`]: (ctx, join) => {
        log("Setting lineJoin to", join);
        ctx.lineJoin = join;
    },
    [`miterLimit:number`]: (ctx, limit) => {
        log("Setting miterLimit to", limit);
        ctx.miterLimit = parseFloat(limit);
    },
    [`globalAlpha:number`]: (ctx, alpha) => {
        log("Setting globalAlpha to", alpha);
        ctx.globalAlpha = parseFloat(alpha);
    },
    [`globalCompositeOperation:globalCompositeOperation`]: (ctx, operation) => {
        log("Setting globalCompositeOperation to", operation);
        ctx.globalCompositeOperation = operation;
    },
    [`font:stringVerify`]: (ctx, font) => {
        log("Setting font to", font);
        ctx.font = font;
    },
    [`textAlign:align`]: (ctx, align) => {
        log("Setting textAlign to", align);
        ctx.textAlign = align;
    },
    [`textBaseline:baseline`]: (ctx, baseline) => {
        log("Setting textBaseline to", baseline);
        ctx.textBaseline = baseline;
    },
    [`shadowColor:color:*color`]: (ctx, color, ...arg) => {
        log("Setting shadowColor to", color);
        if (color.startsWith('linear-gradient') || color.startsWith('radial-gradient')) {
            color = gradientColorToCanvas(ctx, color, arg)
        }
        ctx.shadowColor = color;
    },
    [`shadowBlur:number`]: (ctx, blur) => {
        log("Setting shadowBlur to", blur);
        ctx.shadowBlur = parseFloat(blur);
    },
    [`shadowOffsetX:number`]: (ctx, offsetX) => {
        log("Setting shadowOffsetX to", offsetX);
        ctx.shadowOffsetX = parseFloat(offsetX);
    },
    [`shadowOffsetY:number`]: (ctx, offsetY) => {
        log("Setting shadowOffsetY to", offsetY);
        ctx.shadowOffsetY = parseFloat(offsetY);
    },
    [`rect:number:number:number:number`]: (ctx, x, y, width, height) => {
        log("Drawing rect at", x, y, "with size", width, height);
        ctx.rect(parseFloat(x), parseFloat(y), parseFloat(width), parseFloat(height));
    },
    [`fillRect:number:number:number:number`]: (ctx, x, y, width, height) => {
        log("Filling rect at", x, y, "with size", width, height);
        ctx.fillRect(parseFloat(x), parseFloat(y), parseFloat(width), parseFloat(height));
    },
    [`strokeRect:number:number:number:number`]: (ctx, x, y, width, height) => {
        log("Stroking rect at", x, y, "with size", width, height);
        ctx.strokeRect(parseFloat(x), parseFloat(y), parseFloat(width), parseFloat(height));
    },
    [`clearRect:number:number:number:number`]: (ctx, x, y, width, height) => {
        log("Clearing rect at", x, y, "with size", width, height);
        ctx.clearRect(parseFloat(x), parseFloat(y), parseFloat(width), parseFloat(height));
    },
    [`beginPath:`]: (ctx) => {
        log("Beginning path");
        ctx.beginPath();
    },
    [`closePath:`]: (ctx) => {
        log("Closing path");
        ctx.closePath();
    },
    [`moveTo:number:number`]: (ctx, x, y) => {
        log("Moving to", x, y);
        ctx.moveTo(parseFloat(x), parseFloat(y));
    },
    [`lineTo:number:number`]: (ctx, x, y) => {
        log("Line to", x, y);
        ctx.lineTo(parseFloat(x), parseFloat(y));
    },
    [`arc:number:number:number:number:number:bool=true`]: (ctx, x, y, radius, startAngle, endAngle, anticlockwise) => {
        log("Drawing arc at", x, y, "radius", radius, "start", startAngle, "end", endAngle, "anticlockwise", anticlockwise);
        ctx.arc(parseFloat(x), parseFloat(y), parseFloat(radius), parseFloat(startAngle), parseFloat(endAngle), anticlockwise === 'true');
    },
    [`arcTo:number:number:number:number:number`]: (ctx, x1, y1, x2, y2, radius) => {
        log("Drawing arcTo from", x1, y1, "to", x2, y2, "with radius", radius);
        ctx.arcTo(parseFloat(x1), parseFloat(y1), parseFloat(x2), parseFloat(y2), parseFloat(radius));
    },
    [`quadraticCurveTo:number:number:number:number`]: (ctx, cpX, cpY, x, y) => {
        log("Drawing quadraticCurveTo control", cpX, cpY, "to", x, y);
        ctx.quadraticCurveTo(parseFloat(cpX), parseFloat(cpY), parseFloat(x), parseFloat(y));
    },
    [`bezierCurveTo:number:number:number:number:number:number`]: (ctx, cp1X, cp1Y, cp2X, cp2Y, x, y) => {
        log("Drawing bezierCurveTo controls", cp1X, cp1Y, cp2X, cp2Y, "to", x, y);
        ctx.bezierCurveTo(parseFloat(cp1X), parseFloat(cp1Y), parseFloat(cp2X), parseFloat(cp2Y), parseFloat(x), parseFloat(y));
    },
    [`fill:`]: (ctx) => {
        log("Filling path");
        ctx.fill();
    },
    [`stroke:`]: (ctx) => {
        log("Stroking path");
        ctx.stroke();
    },
    [`clip:`]: (ctx) => {
        log("Clipping path");
        ctx.clip();
    },
    [`drawImage:url`]: (ctx, imagePath) => {
        log("Drawing image from", imagePath);
        const img = new Image();
        img.src = fs.readFileSync(imagePath);
        ctx.drawImage(img, 0, 0);
    },
    [`fillText:number:number:stringVerify`]: (ctx, text, x, y) => {
        log("Filling text", text, "at", x, y);
        ctx.fillText(text, parseFloat(x), parseFloat(y));
    },
    [`strokeText:number:number:stringVerify`]: (ctx, text, x, y) => {
        log("Stroking text", text, "at", x, y);
        ctx.strokeText(text, parseFloat(x), parseFloat(y));
    },
    [`save:`]: (ctx) => {
        log("Saving context state");
        ctx.save();
    },
    [`restore:`]: (ctx) => {
        log("Restoring context state");
        ctx.restore();
    },
    [`translate:number:number`]: (ctx, x, y) => {
        log("Translating context by", x, y);
        ctx.translate(parseFloat(x), parseFloat(y));
    },
    [`rotate:number`]: (ctx, angle) => {
        log("Rotating context by", angle);
        ctx.rotate(parseFloat(angle));
    },
    [`scale:number:number`]: (ctx, scaleX, scaleY) => {
        log("Scaling context by", scaleX, scaleY);
        ctx.scale(parseFloat(scaleX), parseFloat(scaleY));
    },
    [`setTransform:number:number:number:number:number:number`]: (ctx, a, b, c, d, e, f) => {
        log("Setting transform matrix to", a, b, c, d, e, f);
        ctx.setTransform(parseFloat(a), parseFloat(b), parseFloat(c), parseFloat(d), parseFloat(e), parseFloat(f));
    },
    [`resetTransform:`]: (ctx) => {
        log("Resetting transform");
        ctx.resetTransform();
    },
    [`fillStylePattern:url`]: (ctx, patternUrl) => {
        log("Setting fillStyle pattern from", patternUrl);
        const img = new Image();
        img.src = fs.readFileSync(patternUrl);
        const pattern = ctx.createPattern(img, 'repeat');
        ctx.fillStyle = pattern;
    },
    [`strokeStylePattern:url`]: (ctx, patternUrl) => {
        log("Setting strokeStyle pattern from", patternUrl);
        const img = new Image();
        img.src = fs.readFileSync(patternUrl);
        const pattern = ctx.createPattern(img, 'repeat');
        ctx.strokeStyle = pattern;
    }
};

function findMatchingKey(obj) {
    for (const key2 of Object.keys(ParserTable)) {
        const searchParts = key2.split(':');
        const key = obj.split(':')[0].trim();
        if (searchParts[0] === key) {
            return { key: key2 };
        }
    
    }
    return null;
}

function validateArg(type, arg) {
    log("Validating argument:", type, arg);
    const patterns = {
        number: regex.number,
        color: regex.color,
        bool: regex.bool,
        url: regex.url,
        stringVerify: regex.stringVerify,
        align: regex.textAlign,
        baseline: regex.baseline,
        cap: regex.cap,
        join: regex.join,
        globalCompositeOperation: regex.globalCompositeOperation,
    };
    if (type === "" && arg === "") {
        return null; // Pas d'argument à valider
    }
    if (type.startsWith('*') && arg) {
        // Si le type commence par '*', on recupère les arguments suivants
        type = type.slice(1).trim(); // Enlever le '*'
        if (!(type in patterns)) {
            console.error("Type non reconnu:", type);
            return null;
        }
        if (arg === undefined || arg === null || arg.trim() === '') {
            console.error("Argument manquant pour le type:", type);
            return null;
        }
        const args = arg.split(':').map(a => a.trim());
        if (args.length === 0) {
            console.error("Aucun argument fourni pour le type:", type);
            return null;
        }
        // Valider chaque argument individuellement
        const validatedArgs = args.map(a => validateArg(type, a));
        // Filtrer les arguments invalides
        return validatedArgs.filter(a => a !== null);
    }
    if (!type || !arg) {
        console.error("Type ou argument manquant: \""+ type+"\" \""+ arg+"\"");
        return null;
    }
    if (type.includes('=')) {
        // Si le type contient '=', on le sépare en deux parties
        const parts = type.split('=');
        type = parts[0].trim();
        const defaultValue = parts[1].trim();
        if (arg === undefined || arg === null || arg.trim() === '') {
            // Si l'argument est vide, on retourne la valeur par défaut
            return defaultValue;
        }
        // Sinon, on valide l'argument
        arg = arg.trim();
    }


    if (!(type in patterns)) {
        // Pas de validation spécifique, retourner arg tel quel
        return arg;
    }
    if (typeof patterns[type] == 'function') {
        if (!arg.match(patterns[type](arg))) {
            console.error(`Argument ${type} non valide:`, arg);
            return null;
        }
    } else { 
        if (!arg.match(new RegExp(patterns[type]))) {
            console.error(`Argument ${type} non valide:`, arg);
            return null;
        }
    }

    if (type === 'number') {
        return parseFloat(arg.replace(',', '.'));
    }

    if (type === 'bool') {
        return arg === 'true';
    }

    if (type === 'url') {
        try {
            const url = new URL(arg);
            if (blocklist.includes(url.hostname)) {
                console.error("URL bloquée:", arg);
                return null;
            }
        } catch (e) {
            console.error("URL mal formée:", arg);
            return null;
        }
    }

    // Pour tous les autres types validés, retourner arg tel quel
    return arg;
}
function interpret(ctx, text) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
        log("Interpreting line:", line);
        const match = findMatchingKey(line);
        if (!match) {
            log("Commande inconnue :", line);
            continue;
        }
        // Extraire la clé et les arguments
        const key = match.key;
        const parts = key.split(':').slice(1); // Enlever le préfixe 
        log("arguments attendus pour la commande:", key, "sont:", parts);
        log("arguments fournis:", line.split(':').slice(1));
        const args = [];
        const lineArgs = line.split(':').slice(1);
        for (let index = 0; index < lineArgs.length; index++) {
            const arg = lineArgs[index];
            let validated = null;
            if (parts[index].startsWith('*')) {
                // on envois tous les arguments restants
                const remainingArgs = lineArgs.slice(index).join(':').trim();
                log("Argument spécial trouvé, envoi de tous les arguments restants:", remainingArgs);
                validated = validateArg(parts[index], remainingArgs);
                log("Arguments validés:", validated);
                index = lineArgs.length; // On sort de la boucle
            }else{
                validated = validateArg(parts[index], arg);
            }
            if (validated !== null) {
                if (Array.isArray(validated)) {
                    args.push(...validated);
                } else {
                    args.push(validated);
                }
            }
        }
        log("Exécution de la commande:", key, "avec arguments:", args);
        // Appeler la fonction dans ParserTable
        try {
            ParserTable[key](ctx, ...args);
        } catch (e) {
            console.error("Erreur exécution commande:", line, e);
        }
    }
}
app.get('/image.:ext', (req, res) => {
    const ext = req.params.ext;
    if (!['png', 'jpeg', 'webp'].includes(ext)) {
        console.error("Format non supporté:", ext);
        return res.status(400).send('Format non supporté');
    }
    // Vérification de la signature
    const signature = req.query.signature;
    if (!signature || !verifySignature(req.query, signature)) {
        console.error("Signature invalide pour les paramètres:", req.query);
        return res.status(403).send('Signature invalide');
    }

    const commands = minimizeCommands(LZString.decompressFromEncodedURIComponent(req.query.commands), false);
    if (!commands) {
        console.error("Aucune commande fournie ou décompressée");
        return res.status(400).send('Aucune commande fournie');
    }
    const size = req.query.size || '400x400';
    const [width, height] = size.split('x').map(Number);
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        console.error("Taille invalide:", size);
        return res.status(400).send('Taille invalide doit être au format WIDTHxHEIGHT');
    }
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    try {
        interpret(ctx, commands);
    } catch (e) {
        console.error("Erreur lors de l'interprétation des commandes:", e);
        return res.status(500).send('Erreur lors de l\'interprétation des commandes');
    }
    const buffer = canvas.toBuffer('image/' + ext);
    res.setHeader('Content-Type', 'image/' + ext);
    res.send(buffer);
    //sauvegarder l'image pour debug
})
function verifySignature(params, signature) {
	const paramsCopy = { ...params };
	delete paramsCopy.signature;

	const data = Object.keys(paramsCopy).sort().map(k => paramsCopy[k]).join('&');
	const expected = crypto.createHmac('md5', process.env.secret).update(data).digest('hex');

	return signature === expected;
}


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

function gradientColorToCanvas(ctx, arg, colors){
    let gradient 
    if (arg.startsWith('linear-gradient')) {
        const parts = arg.match(/linear-gradient\(([^)]+)\)/)[1].split(',');
        const [x0, y0, x1, y1] = parts.map(p => parseFloat(p.trim()));
        gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    }
    else if (arg.startsWith('radial-gradient')) {
        const parts = arg.match(/radial-gradient\(([^)]+)\)/)[1].split(',');
        const [cx, cy, radius] = parts.map(p => parseFloat(p.trim()));
        gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    } else {
        console.error("Type de gradient non supporté:", arg);
        return null;
    }
    colors.forEach((color, index) => {
        gradient.addColorStop(index / (colors.length - 1), color);
    });
    return gradient;
}
function minimizeCommands(commands, compression = true) {
    const DICTIONARY = compression ? reverseMinimizeList: minimizeList;
    return commands.split('\n').map(line => {
        const parts = line.split(':');
        const command = parts[0].trim();
        const args = parts.slice(1).map(arg => arg.trim());
        const minimizedCommand = DICTIONARY[command] || command;
        return [minimizedCommand, ...args].join(':');
    }).join('\n');
}