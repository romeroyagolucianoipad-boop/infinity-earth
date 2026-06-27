/* ================================================
   INFINITY EARTH — script.js  v2.0
   IA Tutora integrada con Claude API
   ================================================ */

/* ── ESTADO GLOBAL ── */
const estado = {
  usuarioActual: null,
  apuntes: [
    { id:1, titulo:"Reacciones Ácido-Base: Guía completa", materia:"quimica", tipo:"PDF", nivel:"preparatoria", autor:"María G.", fecha:"15 jun 2026", descripcion:"Resumen detallado con ejemplos y ejercicios resueltos de neutralización.", valoracion:4, numValoraciones:24, descargas:87 },
    { id:2, titulo:"Leyes de Newton: Aplicaciones prácticas", materia:"fisica", tipo:"PDF", nivel:"universidad", autor:"Carlos R.", fecha:"10 jun 2026", descripcion:"Notas de clase con diagramas de cuerpo libre y problemas resueltos.", valoracion:5, numValoraciones:38, descargas:142 },
    { id:3, titulo:"La célula eucariota: estructura y función", materia:"biologia", tipo:"Presentación", nivel:"secundaria", autor:"Lucía M.", fecha:"5 jun 2026", descripcion:"Presentación visual con imágenes de cada orgánulo y sus funciones.", valoracion:4, numValoraciones:17, descargas:64 },
    { id:4, titulo:"Tabla periódica comentada", materia:"quimica", tipo:"PDF", nivel:"preparatoria", autor:"Ana P.", fecha:"20 jun 2026", descripcion:"Tabla periódica con notas sobre cada grupo y período.", valoracion:5, numValoraciones:51, descargas:210 },
    { id:5, titulo:"Electromagnetismo: campo eléctrico y magnético", materia:"fisica", tipo:"Word", nivel:"universidad", autor:"Jorge L.", fecha:"18 jun 2026", descripcion:"Apuntes completos con fórmulas y ejemplos resueltos.", valoracion:3, numValoraciones:9, descargas:33 },
    { id:6, titulo:"Genética mendeliana", materia:"biologia", tipo:"Presentación", nivel:"preparatoria", autor:"Sofía M.", fecha:"12 jun 2026", descripcion:"Leyes de Mendel con cruces monohíbridos y dihíbridos resueltos.", valoracion:4, numValoraciones:22, descargas:79 }
  ],
  apuntesGuardados: [],
  historialIA: [],
  apunteContextoIA: null,
  paginaActual: 1,
  apuntesPorPagina: 6,
  filtros: { materia:"", tipo:"", nivel:"", orden:"recientes" }
};

/* ── UTILS ── */
const $ = id => document.getElementById(id);
const mostrar = el => el && el.classList.remove("oculto");
const ocultar = el => el && el.classList.add("oculto");
const estrellasHTML = v => "★".repeat(v) + "☆".repeat(5 - v);
const nombreMateria = k => ({ quimica:"Química", fisica:"Física", biologia:"Biología" }[k] || k);

function toast(msg, duracion = 2800) {
  const t = $("toast");
  t.textContent = msg;
  mostrar(t);
  clearTimeout(t._timer);
  t._timer = setTimeout(() => ocultar(t), duracion);
}

function horaActual() {
  return new Date().toLocaleTimeString("es-MX", { hour:"2-digit", minute:"2-digit" });
}

/* ── LOADER ── */
window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = $("loader");
    loader.classList.add("fade-out");
    setTimeout(() => ocultar(loader), 500);
    iniciarEstadisticas();
    renderizarApuntes(estado.apuntes);
    actualizarHeader();
    recuperarSesion();
  }, 1500);
});

/* ── ESTADÍSTICAS ANIMADAS ── */
function animarContador(el, destino, duracion = 1400) {
  let v = 0;
  const timer = setInterval(() => {
    v += Math.ceil(destino / (duracion / 30));
    if (v >= destino) { v = destino; clearInterval(timer); }
    el.textContent = v.toLocaleString();
  }, 30);
}
function iniciarEstadisticas() {
  animarContador($("stat-apuntes"), estado.apuntes.length);
  animarContador($("stat-usuarios"), 128);
  animarContador($("stat-descargas"), 1034);
}

/* ── SESIÓN PERSISTENTE ── */
function recuperarSesion() {
  try {
    const u = localStorage.getItem("ie_usuario");
    if (u) {
      estado.usuarioActual = JSON.parse(u);
      actualizarHeader();
    }
    const g = localStorage.getItem("ie_guardados");
    if (g) estado.apuntesGuardados = JSON.parse(g);
  } catch(e) {}
}
function guardarSesion() {
  if (estado.usuarioActual) localStorage.setItem("ie_usuario", JSON.stringify(estado.usuarioActual));
  localStorage.setItem("ie_guardados", JSON.stringify(estado.apuntesGuardados));
}

/* ── HEADER ── */
function actualizarHeader() {
  const u = estado.usuarioActual;
  if (u) {
    ocultar($("acciones-invitado"));
    mostrar($("acciones-usuario"));
    $("header-nombre-usuario").textContent = u.nombre.split(" ")[0];
    $("menu-nombre-usuario").textContent   = u.nombre;
    $("menu-email-usuario").textContent    = u.email;
    if (u.avatar) {
      $("header-avatar-img").src = u.avatar;
      $("menu-avatar-img").src   = u.avatar;
      mostrar($("header-avatar-img")); ocultar($("header-avatar-placeholder"));
      mostrar($("menu-avatar-img"));   ocultar($("menu-avatar-placeholder"));
    } else {
      ocultar($("header-avatar-img")); mostrar($("header-avatar-placeholder"));
      ocultar($("menu-avatar-img"));   mostrar($("menu-avatar-placeholder"));
    }
  } else {
    mostrar($("acciones-invitado"));
    ocultar($("acciones-usuario"));
    ocultar($("menu-usuario"));
  }
}

/* ── MENÚ USUARIO ── */
$("btn-perfil-avatar").addEventListener("click", e => {
  e.stopPropagation();
  const m = $("menu-usuario");
  m.classList.contains("oculto") ? mostrar(m) : ocultar(m);
});
document.addEventListener("click", () => ocultar($("menu-usuario")));
$("btn-cerrar-sesion").addEventListener("click", () => {
  estado.usuarioActual = null;
  localStorage.removeItem("ie_usuario");
  actualizarHeader();
  ocultar($("menu-usuario"));
  toast("Sesión cerrada correctamente.");
});

/* ── BÚSQUEDA ── */
$("btn-buscar").addEventListener("click", () => { mostrar($("barra-busqueda")); $("input-busqueda").focus(); });
$("btn-busqueda-cerrar").addEventListener("click", () => { ocultar($("barra-busqueda")); $("input-busqueda").value = ""; });
$("btn-busqueda-ejecutar").addEventListener("click", ejecutarBusqueda);
$("input-busqueda").addEventListener("keydown", e => {
  if (e.key === "Enter") ejecutarBusqueda();
  if (e.key === "Escape") { ocultar($("barra-busqueda")); }
});
function ejecutarBusqueda() {
  const q = $("input-busqueda").value.trim().toLowerCase();
  if (!q) return;
  const r = estado.apuntes.filter(a =>
    a.titulo.toLowerCase().includes(q) || a.descripcion.toLowerCase().includes(q) || a.materia.toLowerCase().includes(q)
  );
  renderizarApuntes(r);
  document.querySelector("#apuntes").scrollIntoView({ behavior:"smooth" });
  toast(`${r.length} resultado(s) para "${q}"`);
}

/* ── FILTROS ── */
["filtro-materia","filtro-tipo","filtro-nivel","filtro-orden"].forEach(id => $(id).addEventListener("change", aplicarFiltros));
$("btn-limpiar-filtros").addEventListener("click", () => {
  ["filtro-materia","filtro-tipo","filtro-nivel"].forEach(id => $(id).value = "");
  $("filtro-orden").value = "recientes";
  estado.filtros = { materia:"", tipo:"", nivel:"", orden:"recientes" };
  estado.paginaActual = 1;
  renderizarApuntes(estado.apuntes);
});
function aplicarFiltros() {
  estado.filtros.materia = $("filtro-materia").value;
  estado.filtros.tipo    = $("filtro-tipo").value;
  estado.filtros.nivel   = $("filtro-nivel").value;
  estado.filtros.orden   = $("filtro-orden").value;
  estado.paginaActual    = 1;
  let lista = [...estado.apuntes];
  if (estado.filtros.materia) lista = lista.filter(a => a.materia === estado.filtros.materia);
  if (estado.filtros.tipo)    lista = lista.filter(a => a.tipo.toLowerCase() === estado.filtros.tipo);
  if (estado.filtros.nivel)   lista = lista.filter(a => a.nivel === estado.filtros.nivel);
  if (estado.filtros.orden === "valorados")    lista.sort((a,b) => b.valoracion - a.valoracion);
  else if (estado.filtros.orden === "descargados") lista.sort((a,b) => b.descargas - a.descargas);
  else lista.sort((a,b) => b.id - a.id);
  renderizarApuntes(lista);
}

/* ── RENDER APUNTES ── */
function renderizarApuntes(lista) {
  const grid = $("grid-apuntes");
  const inicio = (estado.paginaActual - 1) * estado.apuntesPorPagina;
  const pagina = lista.slice(inicio, inicio + estado.apuntesPorPagina);
  const total  = Math.max(1, Math.ceil(lista.length / estado.apuntesPorPagina));
  const guardadoSet = new Set(estado.apuntesGuardados);

  if (!pagina.length) {
    grid.innerHTML = `<p style="color:#888;grid-column:1/-1;text-align:center;padding:3rem;">No se encontraron apuntes con estos filtros.</p>`;
  } else {
    grid.innerHTML = pagina.map(a => `
      <article class="tarjeta-apunte" data-id="${a.id}">
        <div class="apunte-encabezado">
          <span class="apunte-materia ${a.materia}">${nombreMateria(a.materia)}</span>
          <span class="apunte-tipo">${a.tipo}</span>
        </div>
        <h4 class="apunte-titulo">${a.titulo}</h4>
        <p class="apunte-descripcion">${a.descripcion}</p>
        <div class="apunte-meta">
          <span class="apunte-autor">👤 ${a.autor}</span>
          <span class="apunte-fecha">📅 ${a.fecha}</span>
          <span class="apunte-nivel">🎓 ${a.nivel.charAt(0).toUpperCase()+a.nivel.slice(1)}</span>
        </div>
        <div class="apunte-valoracion">
          <span class="estrellas">${estrellasHTML(a.valoracion)}</span>
          <span class="num-valoraciones">(${a.numValoraciones})</span>
        </div>
        <div class="apunte-acciones">
          <button class="btn-vista-previa" data-id="${a.id}">👁 Ver</button>
          <button class="btn-descargar"    data-id="${a.id}">⬇ Descargar</button>
          <button class="btn-guardar ${guardadoSet.has(a.id) ? 'guardado-activo' : ''}" data-id="${a.id}">${guardadoSet.has(a.id) ? '✅ Guardado' : '🔖 Guardar'}</button>
          <button class="btn-ia-apunte"    data-id="${a.id}">✨ IA</button>
        </div>
      </article>`).join("");
  }

  $("pag-info").textContent = `Página ${estado.paginaActual} de ${total}`;
  $("btn-pag-anterior").disabled = estado.paginaActual === 1;
  $("btn-pag-siguiente").disabled = estado.paginaActual === total;

  grid.querySelectorAll(".btn-vista-previa").forEach(b => b.addEventListener("click", () => abrirPreview(+b.dataset.id)));
  grid.querySelectorAll(".btn-descargar").forEach(b => b.addEventListener("click", () => descargarApunte(+b.dataset.id)));
  grid.querySelectorAll(".btn-guardar").forEach(b => b.addEventListener("click", () => guardarApunte(+b.dataset.id, b)));
  grid.querySelectorAll(".btn-ia-apunte").forEach(b => b.addEventListener("click", () => preguntarIASobreApunte(+b.dataset.id)));
}

$("btn-pag-anterior").addEventListener("click", () => { if(estado.paginaActual>1){estado.paginaActual--;aplicarFiltros();} });
$("btn-pag-siguiente").addEventListener("click", () => { estado.paginaActual++;aplicarFiltros(); });

function descargarApunte(id) {
  if (!estado.usuarioActual) { abrirModal($("modal-login")); return; }
  const a = estado.apuntes.find(x=>x.id===id);
  if (a) { a.descargas++; toast(`⬇ Descargando "${a.titulo}"...`); }
}
function guardarApunte(id, btn) {
  if (!estado.usuarioActual) { abrirModal($("modal-login")); return; }
  const s = new Set(estado.apuntesGuardados);
  if (s.has(id)) { s.delete(id); toast("🔖 Apunte eliminado de guardados."); }
  else           { s.add(id);    toast("✅ Apunte guardado."); }
  estado.apuntesGuardados = [...s];
  guardarSesion();
  aplicarFiltros();
}

/* ── BOTONES HERO / MATERIAS ── */
$("btn-explorar").addEventListener("click", () => document.querySelector("#apuntes").scrollIntoView({behavior:"smooth"}));
$("btn-subir-hero").addEventListener("click", () => estado.usuarioActual ? abrirModal($("modal-subir")) : abrirModal($("modal-login")));
$("btn-subir-apunte").addEventListener("click", () => estado.usuarioActual ? abrirModal($("modal-subir")) : abrirModal($("modal-login")));
$("btn-hero-ia").addEventListener("click", abrirIA);
$("nav-ia").addEventListener("click", e => { e.preventDefault(); abrirIA(); });
$("btn-abrir-ia-menu").addEventListener("click", () => { ocultar($("menu-usuario")); abrirIA(); });
$("footer-login").addEventListener("click", e => { e.preventDefault(); abrirModal($("modal-login")); });
$("footer-registro").addEventListener("click", e => { e.preventDefault(); abrirModal($("modal-registro")); });

document.querySelectorAll(".btn-ver-materia").forEach(b => {
  b.addEventListener("click", e => {
    $("filtro-materia").value = e.target.closest(".tarjeta-materia").dataset.materia;
    aplicarFiltros();
    document.querySelector("#apuntes").scrollIntoView({behavior:"smooth"});
  });
});
document.querySelectorAll(".tarjeta-materia").forEach(c => {
  c.addEventListener("click", e => {
    if (e.target.classList.contains("btn-ver-materia")) return;
    $("filtro-materia").value = c.dataset.materia;
    aplicarFiltros();
    document.querySelector("#apuntes").scrollIntoView({behavior:"smooth"});
  });
});

/* ── MODALES UTILS ── */
function abrirModal(m) { mostrar(m); document.body.style.overflow="hidden"; }
function cerrarModal(m) { ocultar(m); document.body.style.overflow=""; }
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".modal:not(.oculto)").forEach(m => cerrarModal(m));
});
document.querySelectorAll(".modal-fondo").forEach(f => f.addEventListener("click", () => cerrarModal(f.closest(".modal"))));

/* ── MODAL LOGIN ── */
$("btn-login").addEventListener("click", () => abrirModal($("modal-login")));
$("btn-cerrar-login").addEventListener("click", () => cerrarModal($("modal-login")));
$("btn-confirmar-login").addEventListener("click", () => {
  const email = $("login-email").value.trim();
  const pass  = $("login-password").value;
  const err   = $("login-error");
  if (!email || !pass) { mostrar(err); err.textContent="Completa todos los campos."; return; }
  if (!email.includes("@")) { mostrar(err); err.textContent="Correo inválido."; return; }
  estado.usuarioActual = {
    nombre: email.split("@")[0].replace(/[._]/g," ").replace(/\b\w/g,l=>l.toUpperCase()),
    email, avatar:"", nivel:"", bio:"", usuario:email.split("@")[0]
  };
  ocultar(err); cerrarModal($("modal-login")); actualizarHeader(); guardarSesion();
  toast(`¡Bienvenido, ${estado.usuarioActual.nombre.split(" ")[0]}! 👋`);
  $("login-email").value=""; $("login-password").value="";
});
$("btn-ir-registro").addEventListener("click", () => { cerrarModal($("modal-login")); abrirModal($("modal-registro")); });

/* ── MODAL REGISTRO ── */
$("btn-registro").addEventListener("click", () => abrirModal($("modal-registro")));
$("btn-cerrar-registro").addEventListener("click", () => cerrarModal($("modal-registro")));
$("btn-confirmar-registro").addEventListener("click", () => {
  const nombre  = $("reg-nombre").value.trim();
  const email   = $("reg-email").value.trim();
  const pass1   = $("reg-password").value;
  const pass2   = $("reg-password2").value;
  const terminos = $("reg-terminos").checked;
  const err = $("registro-error");
  if (!nombre||!email||!pass1||!pass2){mostrar(err);err.textContent="Completa todos los campos.";return;}
  if (!email.includes("@")){mostrar(err);err.textContent="Correo inválido.";return;}
  if (pass1.length<8){mostrar(err);err.textContent="La contraseña debe tener mínimo 8 caracteres.";return;}
  if (pass1!==pass2){mostrar(err);err.textContent="Las contraseñas no coinciden.";return;}
  if (!terminos){mostrar(err);err.textContent="Acepta los términos y condiciones.";return;}
  estado.usuarioActual = { nombre, email, avatar:"", nivel:$("reg-nivel").value, bio:"", usuario:email.split("@")[0] };
  ocultar(err); cerrarModal($("modal-registro")); actualizarHeader(); guardarSesion();
  toast(`¡Cuenta creada exitosamente! Bienvenido, ${nombre.split(" ")[0]} 🎉`);
  ["reg-nombre","reg-email","reg-password","reg-password2"].forEach(id=>$(id).value="");
  $("reg-terminos").checked=false;
});
$("btn-ir-login").addEventListener("click", () => { cerrarModal($("modal-registro")); abrirModal($("modal-login")); });

/* ── MODAL PERFIL ── */
$("btn-ir-perfil").addEventListener("click", () => { ocultar($("menu-usuario")); cargarPerfil(); abrirModal($("modal-perfil")); });
$("btn-cerrar-perfil").addEventListener("click", () => cerrarModal($("modal-perfil")));
$("btn-cancelar-perfil").addEventListener("click", () => cerrarModal($("modal-perfil")));

function cargarPerfil() {
  const u = estado.usuarioActual; if(!u) return;
  $("perfil-nombre").value      = u.nombre||"";
  $("perfil-email").value       = u.email||"";
  $("perfil-bio").value         = u.bio||"";
  $("perfil-nivel").value       = u.nivel||"";
  $("perfil-usuario").value     = u.usuario||"";
  $("perfil-institucion").value = u.institucion||"";
  if (u.avatar) {
    $("perfil-avatar-preview").src = u.avatar;
    mostrar($("perfil-avatar-preview")); ocultar($("perfil-avatar-placeholder"));
  } else {
    ocultar($("perfil-avatar-preview")); mostrar($("perfil-avatar-placeholder"));
  }
  const misApuntes = estado.apuntes.filter(a=>a.autor===u.nombre.split(" ")[0]+".");
  $("stat-mis-apuntes").textContent   = misApuntes.length || 0;
  $("stat-mis-descargas").textContent = misApuntes.reduce((s,a)=>s+a.descargas,0) || 0;
  $("stat-mis-guardados").textContent = estado.apuntesGuardados.length;
}
$("btn-guardar-perfil").addEventListener("click", () => {
  const u=estado.usuarioActual, err=$("perfil-error"), ok=$("perfil-exito");
  const nombre=$("perfil-nombre").value.trim(), email=$("perfil-email").value.trim();
  ocultar(err); ocultar(ok);
  if(!nombre||!email){mostrar(err);err.textContent="Nombre y correo son obligatorios.";return;}
  const pn=$("perfil-pass-nueva").value, pc=$("perfil-pass-confirmar").value, pa=$("perfil-pass-actual").value;
  if(pn||pc){
    if(!pa){mostrar(err);err.textContent="Ingresa tu contraseña actual.";return;}
    if(pn.length<8){mostrar(err);err.textContent="La nueva contraseña debe tener mínimo 8 caracteres.";return;}
    if(pn!==pc){mostrar(err);err.textContent="Las contraseñas nuevas no coinciden.";return;}
  }
  Object.assign(u,{nombre,email,bio:$("perfil-bio").value.trim(),nivel:$("perfil-nivel").value,usuario:$("perfil-usuario").value.trim(),institucion:$("perfil-institucion").value.trim()});
  guardarSesion(); actualizarHeader();
  mostrar(ok); ok.textContent="✅ Perfil guardado correctamente.";
  setTimeout(()=>ocultar(ok),3000);
  ["perfil-pass-actual","perfil-pass-nueva","perfil-pass-confirmar"].forEach(id=>$(id).value="");
});
$("btn-cambiar-avatar").addEventListener("click", () => $("input-avatar").click());
$("input-avatar").addEventListener("change", e => {
  const f=e.target.files[0]; if(!f) return;
  if(f.size>2*1024*1024){toast("⚠ La imagen no debe superar 2 MB.");return;}
  const r=new FileReader();
  r.onload=ev=>{
    const src=ev.target.result;
    $("perfil-avatar-preview").src=src;
    mostrar($("perfil-avatar-preview")); ocultar($("perfil-avatar-placeholder"));
    if(estado.usuarioActual){ estado.usuarioActual.avatar=src; guardarSesion(); actualizarHeader(); }
  };
  r.readAsDataURL(f);
});

/* ── MODAL SUBIR ── */
$("btn-cerrar-modal").addEventListener("click", () => cerrarModal($("modal-subir")));
$("btn-cancelar-subida").addEventListener("click", () => cerrarModal($("modal-subir")));
$("zona-carga").addEventListener("click", () => $("input-archivo").click());
$("zona-carga").addEventListener("keydown", e => { if(e.key==="Enter"||e.key===" ") $("input-archivo").click(); });
$("zona-carga").addEventListener("dragover", e => { e.preventDefault(); $("zona-carga").style.background="var(--verde-claro)"; });
$("zona-carga").addEventListener("dragleave", () => { $("zona-carga").style.background=""; });
$("zona-carga").addEventListener("drop", e => { e.preventDefault(); $("zona-carga").style.background=""; const f=e.dataTransfer.files[0]; if(f) setArchivo(f); });
$("input-archivo").addEventListener("change", e => { const f=e.target.files[0]; if(f) setArchivo(f); });
function setArchivo(f) {
  $("nombre-archivo").textContent=f.name;
  mostrar($("archivo-seleccionado")); ocultar($("zona-carga"));
}
$("btn-quitar-archivo").addEventListener("click", () => {
  $("input-archivo").value=""; ocultar($("archivo-seleccionado")); mostrar($("zona-carga"));
});
$("btn-confirmar-subida").addEventListener("click", () => {
  const titulo=$("apunte-titulo-input").value.trim(), materia=$("apunte-materia-select").value, nivel=$("apunte-nivel-select").value;
  const archivo=$("input-archivo").files[0];
  if(!titulo||!materia||!nivel){toast("⚠ Completa título, materia y nivel.");return;}
  if(!archivo){toast("⚠ Selecciona un archivo.");return;}

  // Simular progreso de subida
  const prog=$("progreso-subida"), relleno=$("progreso-relleno"), texto=$("progreso-texto");
  mostrar(prog); ocultar($("archivo-seleccionado"));
  let pct=0;
  const timer=setInterval(()=>{
    pct+=Math.random()*15+5;
    if(pct>=100){ pct=100; clearInterval(timer);
      setTimeout(()=>{
        estado.apuntes.unshift({
          id:Date.now(), titulo, materia,
          tipo:archivo.name.split(".").pop().toUpperCase(), nivel,
          autor:estado.usuarioActual?.nombre.split(" ")[0]+"." || "Tú",
          fecha:new Date().toLocaleDateString("es-MX",{day:"numeric",month:"short",year:"numeric"}),
          descripcion:$("apunte-descripcion-input").value.trim()||"Sin descripción.",
          valoracion:0, numValoraciones:0, descargas:0
        });
        cerrarModal($("modal-subir")); aplicarFiltros();
        ["apunte-titulo-input","apunte-subtema-input","apunte-descripcion-input","apunte-etiquetas-input"].forEach(id=>$(id).value="");
        $("apunte-materia-select").value=""; $("apunte-nivel-select").value="";
        $("input-archivo").value=""; ocultar($("archivo-seleccionado")); ocultar(prog);
        mostrar($("zona-carga")); relleno.style.width="0";
        toast(`✅ "${titulo}" publicado exitosamente.`);
      },500);
    }
    relleno.style.width=pct+"%";
    texto.textContent=`Subiendo... ${Math.round(pct)}%`;
  },120);
});

/* ── MODAL PREVIEW ── */
let apuntePreviewActual = null;
function abrirPreview(id) {
  const a=estado.apuntes.find(x=>x.id===id); if(!a) return;
  apuntePreviewActual=a;
  $("preview-titulo").textContent=a.titulo;
  $("preview-area").innerHTML=`
    <div style="text-align:center;padding:2rem">
      <div style="font-size:4rem;margin-bottom:1rem">${a.tipo==="PDF"?"📄":a.tipo==="Word"?"📝":"📊"}</div>
      <p style="font-weight:700;color:var(--pizarron);font-family:Georgia,serif;font-size:1.1rem;margin-bottom:.5rem">${a.titulo}</p>
      <p style="color:#888;font-size:.85rem">${a.tipo} · ${nombreMateria(a.materia)} · ${a.nivel}</p>
      <p style="color:#bbb;font-size:.8rem;margin-top:1rem">Por ${a.autor} · ${a.fecha}</p>
      <div style="margin-top:1.5rem;display:flex;align-items:center;gap:.5rem;justify-content:center">
        <span style="color:#d4a520;font-size:1.1rem">${estrellasHTML(a.valoracion)}</span>
        <span style="color:#888;font-size:.82rem">(${a.numValoraciones} valoraciones · ${a.descargas} descargas)</span>
      </div>
    </div>`;
  abrirModal($("modal-preview"));
}
$("btn-cerrar-preview").addEventListener("click", () => { cerrarModal($("modal-preview")); apuntePreviewActual=null; });
$("btn-valorar").addEventListener("click", () => {
  if(!estado.usuarioActual){cerrarModal($("modal-preview"));abrirModal($("modal-login"));return;}
  toast("⭐ ¡Gracias por tu valoración!");
});
$("btn-comentar").addEventListener("click", () => {
  if(!estado.usuarioActual){cerrarModal($("modal-preview"));abrirModal($("modal-login"));return;}
  toast("💬 Comentarios próximamente.");
});
$("btn-descargar-preview").addEventListener("click", () => {
  if(!estado.usuarioActual){cerrarModal($("modal-preview"));abrirModal($("modal-login"));return;}
  if(apuntePreviewActual){ apuntePreviewActual.descargas++; toast(`⬇ Descargando "${apuntePreviewActual.titulo}"...`); }
});
$("btn-preguntar-ia").addEventListener("click", () => {
  if(apuntePreviewActual) preguntarIASobreApunte(apuntePreviewActual.id);
  cerrarModal($("modal-preview"));
});

/* ── TOGGLE PASSWORD ── */
document.querySelectorAll(".btn-toggle-password").forEach(b => {
  b.addEventListener("click", () => {
    const inp=$(b.dataset.target); if(!inp) return;
    inp.type=inp.type==="password"?"text":"password";
    b.textContent=inp.type==="password"?"👁":"🙈";
  });
});

/* ── MENÚ MÓVIL ── */
$("btn-menu-movil").addEventListener("click", () => {
  const nav=$("nav-principal"), abierto=nav.style.display==="flex";
  if(abierto){ nav.removeAttribute("style"); }
  else { Object.assign(nav.style,{display:"flex",flexDirection:"column",position:"absolute",top:"100%",left:"0",right:"0",background:"var(--pizarron)",padding:"1rem 2rem",gap:"1rem",zIndex:"99"}); }
});
document.querySelectorAll("#nav-principal a").forEach(a => a.addEventListener("click", () => $("nav-principal").removeAttribute("style")));

/* ── MIS APUNTES ── */
$("btn-mis-apuntes-menu").addEventListener("click", () => {
  ocultar($("menu-usuario"));
  if(!estado.usuarioActual) return;
  $("filtro-materia").value=""; $("filtro-tipo").value=""; $("filtro-nivel").value=""; $("filtro-orden").value="recientes";
  estado.filtros={ materia:"",tipo:"",nivel:"",orden:"recientes" };
  estado.paginaActual=1;
  const misApuntes=estado.apuntes.filter(a=>a.autor.startsWith(estado.usuarioActual.nombre.split(" ")[0]));
  renderizarApuntes(misApuntes.length ? misApuntes : estado.apuntes);
  document.querySelector("#apuntes").scrollIntoView({behavior:"smooth"});
  toast("Mostrando tus apuntes.");
});
$("btn-guardados").addEventListener("click", () => {
  ocultar($("menu-usuario"));
  if(!estado.usuarioActual){abrirModal($("modal-login"));return;}
  const guardados=estado.apuntes.filter(a=>estado.apuntesGuardados.includes(a.id));
  renderizarApuntes(guardados.length ? guardados : estado.apuntes);
  document.querySelector("#apuntes").scrollIntoView({behavior:"smooth"});
  toast(guardados.length ? `${guardados.length} apunte(s) guardado(s).` : "No tienes apuntes guardados aún.");
});

/* ================================================
   IA TUTORA — Powered by Claude API
   ================================================ */
function abrirIA() {
  const panel=$("panel-ia");
  if(panel.classList.contains("oculto")){
    mostrar(panel);
    ocultar($("btn-flotante-ia"));
    if($("ia-mensajes").children.length===0) mensajeBienvenidaIA();
    $("ia-input").focus();
  }
}
function cerrarIA() {
  ocultar($("panel-ia"));
  mostrar($("btn-flotante-ia"));
}

$("btn-flotante-ia").addEventListener("click", abrirIA);
$("btn-cerrar-ia").addEventListener("click", cerrarIA);
$("btn-limpiar-chat").addEventListener("click", () => {
  $("ia-mensajes").innerHTML="";
  estado.historialIA=[];
  estado.apunteContextoIA=null;
  mensajeBienvenidaIA();
  mostrar($("ia-sugerencias"));
});

function mensajeBienvenidaIA() {
  agregarMensajeIA(`¡Hola! 👋 Soy tu **IA Tutora** de Infinity Earth.\n\nPuedo ayudarte a:\n- 🧪 Explicar temas de Química, Física y Biología\n- 📚 Recomendar apuntes según tu nivel\n- 💡 Resolver tus dudas científicas\n- 📖 Analizar contenido de apuntes\n\n¿Sobre qué tema quieres aprender hoy?`, "ia");
}

function agregarMensajeUsuario(texto) {
  const cont=$("ia-mensajes");
  ocultar($("ia-sugerencias"));
  const div=document.createElement("div");
  div.className="ia-msg usuario";
  div.innerHTML=`${escapeHTML(texto)}<div class="ia-msg-tiempo">${horaActual()}</div>`;
  cont.appendChild(div);
  cont.scrollTop=cont.scrollHeight;
}

function agregarMensajeIA(texto, tipo="ia", cargando=false) {
  const cont=$("ia-mensajes");
  const div=document.createElement("div");
  div.className=`ia-msg ia${cargando?" cargando":""}`;
  div.innerHTML=formatearMensajeIA(texto)+(!cargando?`<div class="ia-msg-tiempo">${horaActual()}</div>`:"");
  cont.appendChild(div);
  cont.scrollTop=cont.scrollHeight;
  return div;
}

function formatearMensajeIA(texto) {
  return texto
    .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
    .replace(/\*(.*?)\*/g,"<em>$1</em>")
    .replace(/\n/g,"<br>")
    .replace(/- (.*?)(<br>|$)/g,"• $1$2");
}

function escapeHTML(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function enviarMensajeIA(mensajeUsuario) {
  if(!mensajeUsuario.trim()) return;

  agregarMensajeUsuario(mensajeUsuario);
  estado.historialIA.push({ role:"user", content:mensajeUsuario });

  const divCargando=agregarMensajeIA("✨ Pensando...", "ia", true);
  $("btn-enviar-ia").disabled=true;
  $("ia-input").disabled=true;

  // Construir contexto de apuntes disponibles
  const listaApuntes=estado.apuntes.slice(0,8).map(a=>`- "${a.titulo}" (${nombreMateria(a.materia)}, ${a.nivel}, valoración: ${a.valoracion}/5)`).join("\n");
  const contextoApunte=estado.apunteContextoIA
    ? `\n\nEl usuario está preguntando específicamente sobre el apunte: "${estado.apunteContextoIA.titulo}" de ${nombreMateria(estado.apunteContextoIA.materia)}.`
    : "";

  const sistemaPrompt=`Eres la IA Tutora de Infinity Earth, una plataforma de apuntes científicos para estudiantes hispanohablantes. Tu rol es:

1. TUTOR CIENTÍFICO: Explicar temas de Química, Física y Biología de forma clara, precisa y motivadora. Adapta el nivel según el estudiante.
2. RECOMENDADOR: Sugiere apuntes de la plataforma cuando sea relevante.
3. ANALIZADOR: Si el usuario pregunta sobre un apunte específico, ayúdalo a entender el contenido.

Apuntes disponibles en la plataforma:
${listaApuntes}${contextoApunte}

Usuario actual: ${estado.usuarioActual ? `${estado.usuarioActual.nombre}, nivel: ${estado.usuarioActual.nivel||"no especificado"}` : "visitante"}

Instrucciones:
- Responde siempre en español
- Sé conciso pero completo (máximo 300 palabras por respuesta)
- Usa emojis con moderación para hacer la respuesta más visual
- Cuando recomiendes un apunte, menciona su título exacto entre comillas
- Si no sabes algo, dilo honestamente
- Anima al estudiante a seguir aprendiendo`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({
        model:"claude-sonnet-4-6",
        max_tokens:1000,
        system:sistemaPrompt,
        messages:estado.historialIA
      })
    });

    const data=await response.json();

    if(data.error) throw new Error(data.error.message || "Error de API");

    const respuesta=data.content?.[0]?.text || "No pude generar una respuesta.";
    divCargando.className="ia-msg ia";
    divCargando.innerHTML=formatearMensajeIA(respuesta)+`<div class="ia-msg-tiempo">${horaActual()}</div>`;
    estado.historialIA.push({ role:"assistant", content:respuesta });

    // Limitar historial a 20 mensajes para no agotar tokens
    if(estado.historialIA.length>20) estado.historialIA=estado.historialIA.slice(-20);

  } catch(err) {
    divCargando.className="ia-msg ia";
    divCargando.innerHTML=formatearMensajeIA(
      `Lo siento, hubo un error al conectar con la IA. 😔\n\nPor favor verifica tu conexión e inténtalo de nuevo.\n\n*Error: ${err.message}*`
    )+`<div class="ia-msg-tiempo">${horaActual()}</div>`;
  } finally {
    $("btn-enviar-ia").disabled=false;
    $("ia-input").disabled=false;
    $("ia-input").focus();
    $("ia-mensajes").scrollTop=$("ia-mensajes").scrollHeight;
    estado.apunteContextoIA=null;
  }
}

function preguntarIASobreApunte(id) {
  const a=estado.apuntes.find(x=>x.id===id); if(!a) return;
  estado.apunteContextoIA=a;
  abrirIA();
  const msg=`Tengo dudas sobre el apunte "${a.titulo}" de ${nombreMateria(a.materia)}. ¿Me puedes explicar el tema principal y sus conceptos clave?`;
  $("ia-input").value=msg;
  $("ia-input").focus();
}

// Enviar mensaje
$("btn-enviar-ia").addEventListener("click", () => {
  const msg=$("ia-input").value.trim();
  if(!msg) return;
  $("ia-input").value="";
  enviarMensajeIA(msg);
});
$("ia-input").addEventListener("keydown", e => {
  if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); $("btn-enviar-ia").click(); }
});

// Chips de sugerencias
document.querySelectorAll(".ia-chip").forEach(c => {
  c.addEventListener("click", () => {
    const msg=c.dataset.msg;
    enviarMensajeIA(msg);
  });
});
