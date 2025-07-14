pour générez une image utiluser cette url:
`/image.{ext}?commands={commands}&size={size}`
#### ext
l'extension de l'image, c'est le format de l'image. les formats supportés sont `png`, `jpg` et `webp`
#### commands
les commands sont une liste de commandes séparées par des sauts de ligne. pour les ecrire, c'est la même syntaxe que canvas mais les arguments sont séparés par des `:`. exemple:
```
fillStyle:#00ff00
fillRect:50:50:100:100
strokeStyle:#0000ff
lineWidth:5
strokeRect:50:50:100:100
```
puis il est préférable de minimiser les commandes pour réduire la taille de l'url. pour cela, on utilise un dictionnaire de minimisation. (voir resource.md pour le dictionnaire)
et on le passe dans LZString
```js
const LZString = require('lz-string');
const original = `fillStyle:#00ff00
fillRect:50:50:100:100
strokeStyle:#0000ff
lineWidth:5
strokeRect:50:50:100:100`;
const compressed = LZString.compressToEncodedURIComponent(original);
console.log(compressed, compressed.length);
```
une fonction pour minimiser et deMinimiser les commandes est disponible dans `resource.md` 
#### size
la taille de l'image, c'est la taille de l'image en pixels. sous forme `WIDTHxHEIGHT`, exemple `800x600`. si la taille n'est pas spécifiée, la taille par défaut est `800x600`. si la taille est invalide, une erreur 400 sera renvoyée.