# resource
## dicionaire de minimisation des commandes canvas
```js
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
```

