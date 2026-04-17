const fs = require('fs');
const content = fs.readFileSync('base-datos-salud.js', 'utf8');

let MEDICAMENTOS;
eval(content);

function test_buscarMultiplesMedicamentos(nombre) {
  const lower = normalizar(nombre);
  console.log("normalizado:", lower);
  if (lower.length < 3) return [];
  return MEDICAMENTOS.filter(m => {
    const n_es = normalizar(m.nombre_es);
    const n_en = normalizar(m.nombre_en);
    return n_es.includes(lower) || lower.includes(n_es) ||
           n_en.includes(lower) || lower.includes(n_en) ||
           m.nombres_comerciales.some(n => {
             const c = normalizar(n);
             return c.includes(lower) || lower.includes(c);
           }) ||
           (m.sinonimos && m.sinonimos.some(s => {
             const sn = normalizar(s);
             return sn.includes(lower) || lower.includes(sn);
           }));
  });
}

const res = buscarMultiplesMedicamentos('Me duele la cabeza, me tomo un paracetamol y un ibuprofeno?');
console.log(res.length, "medications found");
res.forEach(m => console.log(m.nombre_es));
