const bd = require("./base-datos-salud.js");
console.log("tos:", bd.buscarMultiplesMedicamentos("un medicamento para la tos").map(m => m.nombre_es));
console.log("dolor:", bd.buscarMultiplesMedicamentos("un medicamento para el dolor").map(m => m.nombre_es));
