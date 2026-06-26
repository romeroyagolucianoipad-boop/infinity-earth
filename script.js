/* ================================================
   INFINITY EARTH — script.js
   ================================================ */

/* ── ESTADO GLOBAL ── */
const estado = {
  usuarioActual: null,   // null = no autenticado
  apuntes: [
    {
      id: 1, titulo: "Reacciones Ácido-Base: Guía completa",
      materia: "quimica", tipo: "PDF", nivel: "preparatoria",
      autor: "María G.", fecha: "15 jun 2026",
      descripcion: "Resumen detallado con ejemplos y ejercicios resueltos de neutralización.",
      valoracion: 4, numValoraciones: 24
    },
    {
      id: 2, titulo: "Leyes de Newton: Aplicaciones prácticas",
      materia: "fisica", tipo: "PDF", nivel: "universidad",
      autor: "Carlos R.", fecha: "10 jun 2026",
      descripcion: "Notas de clase con diagramas de cuerpo libre y problemas resueltos.",
      valoracion: 5, numValoraciones: 38
    },
    {
      id: 3, titulo: "La célula eucariota: estructura y función",
      materia: "biologia", tipo: "Presentación", nivel: "secundaria",
      autor: "Lucía M.", fecha: "5 jun 2026",
      descripcion: "Presentación visual con imágenes de cada orgánulo y sus funciones.",
      valoracion: 4, numValoraciones: 17
    },
    {
      id: 4, titulo: "Tabla periódica comentada",
      materia: "quimica", tipo: "PDF", nivel: "preparatoria",
      autor: "Ana P.", fecha: "20 jun 2026",
      descripcion: "Tabla periódica con notas sobre cada grupo y período.",
      valoracion: 5, numValoraciones: 51
    },
    {
      id: 5, titulo: "Electromagnetismo: campo eléctrico y magnético",
      materia: "fisica", tipo: "Word", nivel: "universidad",
      autor: "Jorge L.", fecha: "18 jun 2026",
      descripcion: "Apuntes completos de electromagnetismo con fórmulas y ejemplos.",
      valoracion: 3, numValoraciones: 9
    },
    {
      id: 6, titulo: "Genética mendeliana",
      materia: "biologia", tipo: "Presentación", nivel: "preparatoria",
      autor: "Sofía M.", fecha: "12 jun 2026",
      descripcion: "Leyes de Mendel con cruces monohíbridos y dihíbridos resueltos.",
      valoracion: 4, numValoraciones: 22
    }
  ],
  paginaActual: 1,
  apuntesPorPagina: 6,
  filtros: { materia: "", tipo: "", nivel: "", orden: "recientes" }
};

/* ================================================
   UTILIDADES
   ================================================ */
const $ = id => document.getElementById(id);
const mostrar = el => el && el.classList.remove("oculto");
const ocultar = el => el && el.classList.add("oculto");

function estrellasHTML(valor) {
  return "★".repeat(valor) + "☆".repeat(5 - valor);
}

function nombreMateria(clave) {
  return { quimica: "Química", fisica: "Física", biologia: "Biología" }[clave] || clave;
}

/* ================================================
   ESTADÍSTICAS DEL HERO (contador animado)
   ================================================ */
function animarContador(el, destino, duracion = 1200) {
  let inicio = 0;
  const paso = duracion / destino;
  const timer = setInterval(() => {
    inicio += Math.ceil(destino / (duracion / 30));
    if (inicio >= destino) { inicio = destino; clearInterval(timer); }
    el.textContent = inicio.toLocaleString();
  }, 30);
}

function iniciarEstadisticas() {
  animarContador($("stat-apuntes"),   estado.apuntes.length);
  animarContador($("stat-usuarios"),  128);
  animarContador($("stat-descargas"), 1034);
}

/* ================================================
   HEADER / SESIÓN
   ================================================ */
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
    }
  } else {
    mostrar($("acciones-invitado"));
    ocultar($("acciones-usuario"));
    ocultar($("menu-usuario"));
  }
}

/* Menú desplegable del avatar */
$("btn-perfil-avatar").addEventListener("click", e => {
  e.stopPropagation();
  const menu = $("menu-usuario");
  const abierto = !menu.classList.contains("oculto");
  abierto ? ocultar(menu) : mostrar(menu);
  $("btn-perfil-avatar").setAttribute("aria-expanded", String(!abierto));
});

document.addEventListener("click", () => ocultar($("menu-usuario")));

$("btn-cerrar-sesion").addEventListener("click", () => {
  estado.usuarioActual = null;
  actualizarHeader();
  ocultar($("menu-usuario"));
});

/* ================================================
   BÚSQUEDA
   ================================================ */
$("btn-buscar").addEventListener("click", () => {
  mostrar($("barra-busqueda"));
  $("input-busqueda").focus();
});
$("btn-busqueda-cerrar").addEventListener("click", () => {
  ocultar($("barra-busqueda"));
  $("input-busqueda").value = "";
});
$("btn-busqueda-ejecutar").addEventListener("click", ejecutarBusqueda);
$("input-busqueda").addEventListener("keydown", e => {
  if (e.key === "Enter") ejecutarBusqueda();
  if (e.key === "Escape") { ocultar($("barra-busqueda")); }
});

function ejecutarBusqueda() {
  const q = $("input-busqueda").value.trim().toLowerCase();
  if (!q) return;
  const resultados = estado.apuntes.filter(a =>
    a.titulo.toLowerCase().includes(q) ||
    a.descripcion.toLowerCase().includes(q) ||
    a.materia.toLowerCase().includes(q)
  );
  renderizarApuntes(resultados);
  document.querySelector("#apuntes").scrollIntoView({ behavior: "smooth" });
}

/* ================================================
   FILTROS
   ================================================ */
["filtro-materia", "filtro-tipo", "filtro-nivel", "filtro-orden"].forEach(id => {
  $(id).addEventListener("change", aplicarFiltros);
});

$("btn-limpiar-filtros").addEventListener("click", () => {
  $("filtro-materia").value = "";
  $("filtro-tipo").value    = "";
  $("filtro-nivel").value   = "";
  $("filtro-orden").value   = "recientes";
  estado.filtros = { materia: "", tipo: "", nivel: "", orden: "recientes" };
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

  if (estado.filtros.materia)
    lista = lista.filter(a => a.materia === estado.filtros.materia);
  if (estado.filtros.tipo)
    lista = lista.filter(a => a.tipo.toLowerCase() === estado.filtros.tipo);
  if (estado.filtros.nivel)
    lista = lista.filter(a => a.nivel === estado.filtros.nivel);

  if (estado.filtros.orden === "valorados")
    lista.sort((a, b) => b.valoracion - a.valoracion);
  else if (estado.filtros.orden === "descargados")
    lista.sort((a, b) => b.numValoraciones - a.numValoraciones);
  else
    lista.sort((a, b) => b.id - a.id);

  renderizarApuntes(lista);
}

/* ================================================
   RENDER DE TARJETAS DE APUNTES
   ================================================ */
function renderizarApuntes(lista) {
  const grid = $("grid-apuntes");
  const inicio = (estado.paginaActual - 1) * estado.apuntesPorPagina;
  const pagina = lista.slice(inicio, inicio + estado.apuntesPorPagina);
  const totalPaginas = Math.max(1, Math.ceil(lista.length / estado.apuntesPorPagina));

  if (pagina.length === 0) {
    grid.innerHTML = `<p style="color:#888;grid-column:1/-1;text-align:center;padding:2rem;">
      No se encontraron apuntes con estos filtros.</p>`;
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
          <span class="apunte-nivel">🎓 ${a.nivel.charAt(0).toUpperCase() + a.nivel.slice(1)}</span>
        </div>
        <div class="apunte-valoracion">
          <span class="estrellas">${estrellasHTML(a.valoracion)}</span>
          <span class="num-valoraciones">(${a.numValoraciones} valoraciones)</span>
        </div>
        <div class="apunte-acciones">
          <button class="btn-vista-previa" data-id="${a.id}">👁 Vista previa</button>
          <button class="btn-descargar"    data-id="${a.id}">⬇ Descargar</button>
          <button class="btn-guardar"      data-id="${a.id}">🔖 Guardar</button>
        </div>
      </article>
    `).join("");
  }

  // Paginación
  $("pag-info").textContent = `Página ${estado.paginaActual} de ${totalPaginas}`;
  $("btn-pag-anterior").disabled = estado.paginaActual === 1;
  $("btn-pag-siguiente").disabled = estado.paginaActual === totalPaginas;

  // Eventos de las tarjetas recién creadas
  grid.querySelectorAll(".btn-vista-previa").forEach(btn =>
    btn.addEventListener("click", () => abrirPreview(Number(btn.dataset.id)))
  );
  grid.querySelectorAll(".btn-guardar").forEach(btn =>
    btn.addEventListener("click", () => guardarApunte(Number(btn.dataset.id), btn))
  );
}

/* Paginación */
$("btn-pag-anterior").addEventListener("click", () => {
  if (estado.paginaActual > 1) { estado.paginaActual--; aplicarFiltros(); }
});
$("btn-pag-siguiente").addEventListener("click", () => {
  estado.paginaActual++;
  aplicarFiltros();
});

/* Guardar apunte */
function guardarApunte(id, btn) {
  if (!estado.usuarioActual) {
    abrirModal($("modal-login"));
    return;
  }
  btn.textContent = "✅ Guardado";
  btn.disabled = true;
}

/* ================================================
   BOTONES HERO Y MATERIAS
   ================================================ */
$("btn-explorar").addEventListener("click", () =>
  document.querySelector("#apuntes").scrollIntoView({ behavior: "smooth" })
);

$("btn-subir-hero").addEventListener("click", () => {
  if (!estado.usuarioActual) { abrirModal($("modal-login")); return; }
  abrirModal($("modal-subir"));
});

$("btn-subir-apunte").addEventListener("click", () => {
  if (!estado.usuarioActual) { abrirModal($("modal-login")); return; }
  abrirModal($("modal-subir"));
});

document.querySelectorAll(".btn-ver-materia").forEach(btn => {
  btn.addEventListener("click", e => {
    const materia = e.target.closest(".tarjeta-materia").dataset.materia;
    $("filtro-materia").value = materia;
    aplicarFiltros();
    document.querySelector("#apuntes").scrollIntoView({ behavior: "smooth" });
  });
});

document.querySelectorAll(".tarjeta-materia").forEach(card => {
  card.addEventListener("click", e => {
    if (e.target.classList.contains("btn-ver-materia")) return;
    const materia = card.dataset.materia;
    $("filtro-materia").value = materia;
    aplicarFiltros();
    document.querySelector("#apuntes").scrollIntoView({ behavior: "smooth" });
  });
});

/* ================================================
   MODALES — helpers
   ================================================ */
function abrirModal(modal) {
  mostrar(modal);
  document.body.style.overflow = "hidden";
  modal.querySelector(".modal-encabezado button")?.focus();
}

function cerrarModal(modal) {
  ocultar(modal);
  document.body.style.overflow = "";
}

// Cerrar con Escape
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".modal:not(.oculto)").forEach(m => cerrarModal(m));
});

// Cerrar al hacer clic en el fondo
document.querySelectorAll(".modal-fondo").forEach(fondo => {
  fondo.addEventListener("click", () => cerrarModal(fondo.closest(".modal")));
});

/* ================================================
   MODAL LOGIN
   ================================================ */
$("btn-login").addEventListener("click", () => abrirModal($("modal-login")));
$("btn-cerrar-login").addEventListener("click", () => cerrarModal($("modal-login")));

$("btn-confirmar-login").addEventListener("click", () => {
  const email    = $("login-email").value.trim();
  const password = $("login-password").value;
  const error    = $("login-error");

  if (!email || !password) {
    mostrar(error);
    error.textContent = "Por favor completa todos los campos.";
    return;
  }
  if (!email.includes("@")) {
    mostrar(error);
    error.textContent = "Ingresa un correo válido.";
    return;
  }

  // Simulación de inicio de sesión
  estado.usuarioActual = {
    nombre: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    email,
    avatar: "",
    nivel: "",
    bio: "",
    usuario: email.split("@")[0]
  };

  ocultar(error);
  cerrarModal($("modal-login"));
  actualizarHeader();
  $("login-email").value    = "";
  $("login-password").value = "";
});

// Cambiar a registro desde login
$("btn-ir-registro").addEventListener("click", () => {
  cerrarModal($("modal-login"));
  abrirModal($("modal-registro"));
});

/* ================================================
   MODAL REGISTRO
   ================================================ */
$("btn-registro").addEventListener("click", () => abrirModal($("modal-registro")));
$("btn-cerrar-registro").addEventListener("click", () => cerrarModal($("modal-registro")));

$("btn-confirmar-registro").addEventListener("click", () => {
  const nombre   = $("reg-nombre").value.trim();
  const email    = $("reg-email").value.trim();
  const pass1    = $("reg-password").value;
  const pass2    = $("reg-password2").value;
  const terminos = $("reg-terminos").checked;
  const error    = $("registro-error");

  if (!nombre || !email || !pass1 || !pass2) {
    mostrar(error); error.textContent = "Completa todos los campos."; return;
  }
  if (!email.includes("@")) {
    mostrar(error); error.textContent = "Ingresa un correo válido."; return;
  }
  if (pass1.length < 8) {
    mostrar(error); error.textContent = "La contraseña debe tener al menos 8 caracteres."; return;
  }
  if (pass1 !== pass2) {
    mostrar(error); error.textContent = "Las contraseñas no coinciden."; return;
  }
  if (!terminos) {
    mostrar(error); error.textContent = "Debes aceptar los términos y condiciones."; return;
  }

  // Simular registro e inicio de sesión automático
  estado.usuarioActual = {
    nombre, email,
    avatar: "",
    nivel: $("reg-nivel").value,
    bio: "",
    usuario: email.split("@")[0]
  };

  ocultar(error);
  cerrarModal($("modal-registro"));
  actualizarHeader();

  // Limpiar
  ["reg-nombre","reg-email","reg-password","reg-password2"].forEach(id => $(id).value = "");
  $("reg-terminos").checked = false;
});

// Cambiar a login desde registro
$("btn-ir-login").addEventListener("click", () => {
  cerrarModal($("modal-registro"));
  abrirModal($("modal-login"));
});

/* ================================================
   MODAL PERFIL
   ================================================ */
$("btn-ir-perfil").addEventListener("click", () => {
  ocultar($("menu-usuario"));
  cargarDatosPerfil();
  abrirModal($("modal-perfil"));
});

$("btn-cerrar-perfil").addEventListener("click", () => cerrarModal($("modal-perfil")));
$("btn-cancelar-perfil").addEventListener("click", () => cerrarModal($("modal-perfil")));

function cargarDatosPerfil() {
  const u = estado.usuarioActual;
  if (!u) return;
  $("perfil-nombre").value      = u.nombre  || "";
  $("perfil-email").value       = u.email   || "";
  $("perfil-bio").value         = u.bio     || "";
  $("perfil-nivel").value       = u.nivel   || "";
  $("perfil-usuario").value     = u.usuario || "";
  $("perfil-institucion").value = u.institucion || "";

  // Mostrar avatar si existe
  if (u.avatar) {
    $("perfil-avatar-preview").src = u.avatar;
    mostrar($("perfil-avatar-preview"));
    ocultar($("perfil-avatar-placeholder"));
  } else {
    ocultar($("perfil-avatar-preview"));
    mostrar($("perfil-avatar-placeholder"));
  }

  // Estadísticas simuladas
  $("stat-mis-apuntes").textContent   = "3";
  $("stat-mis-descargas").textContent = "47";
  $("stat-mis-guardados").textContent = "12";
}

$("btn-guardar-perfil").addEventListener("click", () => {
  const u      = estado.usuarioActual;
  const error  = $("perfil-error");
  const exito  = $("perfil-exito");
  const nombre = $("perfil-nombre").value.trim();
  const email  = $("perfil-email").value.trim();

  ocultar(error); ocultar(exito);

  if (!nombre || !email) {
    mostrar(error); error.textContent = "El nombre y el correo son obligatorios."; return;
  }

  // Validar cambio de contraseña si se llenó
  const passActual   = $("perfil-pass-actual").value;
  const passNueva    = $("perfil-pass-nueva").value;
  const passConfirmar = $("perfil-pass-confirmar").value;
  if (passNueva || passConfirmar) {
    if (!passActual) {
      mostrar(error); error.textContent = "Ingresa tu contraseña actual para cambiarla."; return;
    }
    if (passNueva.length < 8) {
      mostrar(error); error.textContent = "La nueva contraseña debe tener al menos 8 caracteres."; return;
    }
    if (passNueva !== passConfirmar) {
      mostrar(error); error.textContent = "Las contraseñas nuevas no coinciden."; return;
    }
  }

  // Guardar cambios
  u.nombre      = nombre;
  u.email       = email;
  u.bio         = $("perfil-bio").value.trim();
  u.nivel       = $("perfil-nivel").value;
  u.usuario     = $("perfil-usuario").value.trim();
  u.institucion = $("perfil-institucion").value.trim();

  actualizarHeader();

  mostrar(exito);
  exito.textContent = "✅ Perfil guardado correctamente.";
  setTimeout(() => ocultar(exito), 3000);

  // Limpiar campos de contraseña
  $("perfil-pass-actual").value    = "";
  $("perfil-pass-nueva").value     = "";
  $("perfil-pass-confirmar").value = "";
});

/* ── Cambio de foto de perfil ── */
$("btn-cambiar-avatar").addEventListener("click", () => $("input-avatar").click());

$("input-avatar").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert("La imagen no debe superar 2 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    const src = ev.target.result;
    $("perfil-avatar-preview").src = src;
    mostrar($("perfil-avatar-preview"));
    ocultar($("perfil-avatar-placeholder"));
    if (estado.usuarioActual) {
      estado.usuarioActual.avatar = src;
      $("header-avatar-img").src  = src;
      $("menu-avatar-img").src    = src;
    }
  };
  reader.readAsDataURL(file);
});

/* ================================================
   MODAL SUBIR APUNTE
   ================================================ */
$("btn-cerrar-modal").addEventListener("click", () => cerrarModal($("modal-subir")));
$("btn-cancelar-subida").addEventListener("click", () => cerrarModal($("modal-subir")));

// Zona de carga
$("zona-carga").addEventListener("click", () => $("input-archivo").click());
$("zona-carga").addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") $("input-archivo").click();
});

// Drag & drop
$("zona-carga").addEventListener("dragover", e => {
  e.preventDefault();
  $("zona-carga").style.background = "var(--verde-claro)";
});
$("zona-carga").addEventListener("dragleave", () => {
  $("zona-carga").style.background = "";
});
$("zona-carga").addEventListener("drop", e => {
  e.preventDefault();
  $("zona-carga").style.background = "";
  const file = e.dataTransfer.files[0];
  if (file) mostrarArchivoSeleccionado(file);
});

$("input-archivo").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) mostrarArchivoSeleccionado(file);
});

function mostrarArchivoSeleccionado(file) {
  $("nombre-archivo").textContent = file.name;
  mostrar($("archivo-seleccionado"));
  ocultar($("zona-carga"));
}

$("btn-quitar-archivo").addEventListener("click", () => {
  $("input-archivo").value = "";
  ocultar($("archivo-seleccionado"));
  mostrar($("zona-carga"));
});

$("btn-confirmar-subida").addEventListener("click", () => {
  const titulo    = $("apunte-titulo-input").value.trim();
  const materia   = $("apunte-materia-select").value;
  const nivel     = $("apunte-nivel-select").value;
  const archivo   = $("input-archivo").files[0];

  if (!titulo || !materia || !nivel) {
    alert("Por favor completa título, materia y nivel educativo."); return;
  }
  if (!archivo) {
    alert("Selecciona un archivo para subir."); return;
  }

  // Agregar apunte al estado
  const nuevo = {
    id: estado.apuntes.length + 1,
    titulo,
    materia,
    tipo: archivo.name.split(".").pop().toUpperCase(),
    nivel,
    autor: estado.usuarioActual?.nombre || "Anónimo",
    fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }),
    descripcion: $("apunte-descripcion-input").value.trim() || "Sin descripción.",
    valoracion: 0,
    numValoraciones: 0
  };
  estado.apuntes.unshift(nuevo);

  cerrarModal($("modal-subir"));
  aplicarFiltros();

  // Limpiar formulario
  ["apunte-titulo-input","apunte-subtema-input","apunte-descripcion-input","apunte-etiquetas-input"]
    .forEach(id => $(id).value = "");
  $("apunte-materia-select").value = "";
  $("apunte-nivel-select").value   = "";
  $("input-archivo").value = "";
  ocultar($("archivo-seleccionado"));
  mostrar($("zona-carga"));

  alert(`✅ "${titulo}" publicado exitosamente.`);
});

/* ================================================
   MODAL VISTA PREVIA
   ================================================ */
function abrirPreview(id) {
  const apunte = estado.apuntes.find(a => a.id === id);
  if (!apunte) return;
  $("preview-titulo").textContent = apunte.titulo;
  $("preview-area").innerHTML = `
    <div style="text-align:center;padding:2rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">
        ${apunte.tipo === "PDF" ? "📄" : apunte.tipo === "Word" ? "📝" : "📊"}
      </div>
      <p style="font-weight:600;color:var(--pizarron);margin-bottom:0.5rem;">${apunte.titulo}</p>
      <p style="color:#888;font-size:0.88rem;">${apunte.tipo} · ${nombreMateria(apunte.materia)} · ${apunte.nivel}</p>
      <p style="color:#aaa;font-size:0.82rem;margin-top:1rem;">Vista previa no disponible para archivos simulados.</p>
    </div>`;
  abrirModal($("modal-preview"));
}

$("btn-cerrar-preview").addEventListener("click", () => cerrarModal($("modal-preview")));

$("btn-valorar").addEventListener("click", () => {
  if (!estado.usuarioActual) { cerrarModal($("modal-preview")); abrirModal($("modal-login")); return; }
  alert("⭐ ¡Gracias por tu valoración!");
});
$("btn-comentar").addEventListener("click", () => {
  if (!estado.usuarioActual) { cerrarModal($("modal-preview")); abrirModal($("modal-login")); return; }
  alert("💬 Función de comentarios próximamente.");
});
$("btn-descargar-preview").addEventListener("click", () => {
  if (!estado.usuarioActual) { cerrarModal($("modal-preview")); abrirModal($("modal-login")); return; }
  alert("⬇ Descarga iniciada.");
});

/* ================================================
   MOSTRAR/OCULTAR CONTRASEÑA
   ================================================ */
document.querySelectorAll(".btn-toggle-password").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.target);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    btn.textContent = input.type === "password" ? "👁" : "🙈";
  });
});

/* ================================================
   MENÚ MÓVIL
   ================================================ */
$("btn-menu-movil").addEventListener("click", () => {
  const nav = $("nav-principal");
  const abierto = nav.style.display === "flex";
  nav.style.display = abierto ? "" : "flex";
  nav.style.flexDirection = "column";
  nav.style.position = "absolute";
  nav.style.top = "100%";
  nav.style.left = "0";
  nav.style.right = "0";
  nav.style.background = "var(--pizarron)";
  nav.style.padding = "1rem 2rem";
  nav.style.gap = "1rem";
  nav.style.zIndex = "99";
  if (abierto) nav.removeAttribute("style");
});

// Cerrar menú móvil al hacer clic en un enlace
document.querySelectorAll("#nav-principal a").forEach(a => {
  a.addEventListener("click", () => $("nav-principal").removeAttribute("style"));
});

/* ================================================
   INICIALIZACIÓN
   ================================================ */
document.addEventListener("DOMContentLoaded", () => {
  iniciarEstadisticas();
  renderizarApuntes(estado.apuntes);
  actualizarHeader();
});
