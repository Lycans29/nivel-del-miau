console.log('💾 script.js cargado');

// ============ RESEÑAS (robusto, con logs) ============
(() => {
  const run = () => {
    // 0) ¿Estamos en una página que debe mostrar reseñas?
    const juegoKey = document.body?.dataset?.juego || null;
    if (!juegoKey) {
      console.log("[reseñas] Sin data-juego en <body>. No renderizo (página principal u otra).");
      return;
    }
    const STORAGE_KEY = `reseñas_${juegoKey}`;

    // 1) toma referencias por IDs ASCII
    const form  = document.getElementById("form-resena");
    const lista = document.getElementById("lista-resenas") || document.getElementById("resenas");

    // logs de diagnóstico
    if (!form)  console.warn("[reseñas] No encontré #form-resena");
    if (!lista) console.warn("[reseñas] No encontré #lista-resenas ni #resenas");

    if (!form || !lista) return;

    // 2) carga estado
    let reseñas = [];
    try {
      reseñas = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      reseñas = [];
    }

    // 3) helpers
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const escapeHTML = (s) =>
      String(s).replaceAll("&","&amp;").replaceAll("<","&lt;")
               .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
    const estrellas = (n) => {
      const x = clamp(Number(n)||1, 1, 5);
      return "★★★★★".slice(0, x) + "☆☆☆☆☆".slice(0, 5 - x);
    };
    const fechaBonita = (ts) => {
      const d = new Date(ts);
      const pad = (v) => String(v).padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
    };

    // 4) render
    function render() {
      // limpia anteriores generadas por este script
      lista.querySelectorAll(".dynamic").forEach(n => n.remove());

      if (!reseñas.length) {
        const emp = document.createElement("p");
        emp.className = "dynamic text-texto font-texto";
        emp.textContent = "Aún no hay reseñas. ¡Sé el primero en opinar! 😺";
        lista.appendChild(emp);
        return;
      }

      // recientes primero
      const items = [...reseñas].sort((a,b) => (b.fecha||0) - (a.fecha||0));

      items.forEach((r, i) => {
        const art = document.createElement("article");
        art.className = "dynamic border-l-4 border-verde pl-4 pb-3";
        art.innerHTML = `
          <div class="text-sm text-verde">
            <span class="font-texto font-semibold">${escapeHTML(r.nombre || "Anónimo")}</span>
            • ${fechaBonita(r.fecha || Date.now())}
          </div>
          <div class="text-morado text-sm">${estrellas(r.puntuacion)}</div>
          <p class="mt-1  text-texto">${escapeHTML(r.opinion || "")}</p>
        `;
        lista.appendChild(art);

        if (i < items.length - 1) {
          const hr = document.createElement("hr");
          hr.className = "dynamic border-morado/40 my-1";
          lista.appendChild(hr);
        }
      });
    }

    // 5) submit
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nombre     = document.getElementById("nombre")?.value.trim();
      const opinion    = document.getElementById("opinion")?.value.trim();
      const puntuacion = clamp(parseInt(document.getElementById("puntuacion")?.value, 10), 1, 5);

      if (!nombre || !opinion || !Number.isFinite(puntuacion)) {
        console.warn("[reseñas] Datos incompletos", { nombre, opinion, puntuacion });
        return;
      }

      reseñas.push({ nombre, opinion, puntuacion, fecha: Date.now() });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reseñas));
      console.log("[reseñas] Guardada OK en clave", STORAGE_KEY, reseñas);

      render();
      form.reset();
    });

    render();
  };

  // Esperar DOM si el script no lleva 'defer'
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();


// ===== Carrusel con dots y auto-rotación =====
(function () {
  function init() {
    const $carousel = document.getElementById('carousel');
    if (!$carousel) return;

    const $slides = Array.from($carousel.querySelectorAll('.js-slide'));
    const $dots   = Array.from(document.querySelectorAll('.dot'));
    if ($slides.length === 0) return;

    let idx = 0;
    let timer = null;

    let offsets = [];
    function measure() { offsets = $slides.map(sl => sl.offsetLeft); }
    measure();

    window.addEventListener('resize', () => { measure(); goTo(idx, false); });

    function goTo(i, smooth = true) {
      idx = (i + $slides.length) % $slides.length;
      const x = offsets[idx] ?? 0;
      $carousel.scrollTo({ left: x, behavior: smooth ? 'smooth' : 'auto' });
      $dots.forEach((d, k) => d.classList.toggle('dot-active', k === idx));
    }

    $dots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.i)));

    function start() { if (!timer) timer = setInterval(() => goTo(idx + 1), 5000); }
    function stop()  { clearInterval(timer); timer = null; }

    $carousel.addEventListener('mouseenter', stop);
    $carousel.addEventListener('mouseleave', start);
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

    let raf;
    $carousel.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sl = $carousel.scrollLeft;
        let nearest = 0, min = Infinity;
        offsets.forEach((off, i) => {
          const d = Math.abs(off - sl);
          if (d < min) { min = d; nearest = i; }
        });
        if (nearest !== idx) {
          idx = nearest;
          $dots.forEach((d, k) => d.classList.toggle('dot-active', k === idx));
        }
      });
    });

    goTo(0, false);
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

//menu categorias 

// Helpers
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

const menu = $('#menu-cats');

if (menu) {
  const links = $$('.nav-cat', menu);
  const cards = $$('#cards > article'); // tus <article> ya sirven tal cual

  function applyFilter(category) {
    const cat = category.toLowerCase();
    cards.forEach(card => {
      const cats = (card.dataset.cat || '').toLowerCase().split(/\s+/);
      const show = (cat === 'all') || cats.includes(cat);
      card.classList.toggle('hidden', !show); // usa la clase de Tailwind
    });
  }

  function setActive(link) {
    links.forEach(a => a.classList.remove('link-catact'));
    link.classList.add('link-catact');
  }

  // Click en el menú (delegación)
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-filter]');
    if (!a) return;
    e.preventDefault();
    setActive(a);
    applyFilter(a.dataset.filter);
    history.replaceState(null, '', a.dataset.filter === 'all' ? '#' : `#${a.dataset.filter}`);
  });

  // Estado inicial (usa hash si existe)
  window.addEventListener('DOMContentLoaded', () => {
    const initial = (location.hash || '#all').slice(1).toLowerCase();
    const current = links.find(a => a.dataset.filter === initial) || links[0];
    setActive(current);
    applyFilter(current.dataset.filter);
  });
} else {
  console.log('[menu-cats] No hay menú de categorías en esta página, se omite la lógica.');
}



// ==========================
// VOTACIONES TOP 5
// ==========================
console.log('🔹 Entrando a módulo de votos Top 5');

const STORAGE_KEY_TOP5 = 'nivelMiauTop5Votes';

const botonesVotoTop5 = document.querySelectorAll('.btn-voto');
const resultadosTop5 = document.getElementById('resultados-votos');

console.log('🔹 Botones encontrados:', botonesVotoTop5.length);
console.log('🔹 resultadosTop5 existe:', !!resultadosTop5);

// Si no estamos en top.html, salimos
if (!botonesVotoTop5.length || !resultadosTop5) {
  console.log('🔹 No hay botones o contenedor de resultados, saliendo del módulo de votos.');
} else {

  function cargarVotosTop5() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_TOP5);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('No se pudieron cargar los votos del Top 5', e);
      return {};
    }
  }

  function guardarVotosTop5(votos) {
    try {
      localStorage.setItem(STORAGE_KEY_TOP5, JSON.stringify(votos));
    } catch (e) {
      console.warn('No se pudieron guardar los votos del Top 5', e);
    }
  }

  function renderResultadosTop5() {
    const votos = cargarVotosTop5();
    const entradas = Object.entries(votos);
    console.log('🔹 Votos cargados:', votos);

    if (!entradas.length) {
      resultadosTop5.textContent = 'Aún no hay votos. ¡Sé el primero en elegir tu favorito!';
      return;
    }

    const total = entradas.reduce((acc, [, cantidad]) => acc + cantidad, 0);

    let html = '<p class="mb-2 font-semibold text-verde">Resultados (solo en este navegador):</p>';
    html += '<ul class="inline-block text-left mx-auto">';

    entradas
      .sort((a, b) => b[1] - a[1])
      .forEach(([id, cantidad]) => {
        const boton = document.querySelector('.btn-voto[data-juego="' + id + '"]');
        const nombre = boton ? boton.dataset.nombre : id;
        const porcentaje = total > 0 ? Math.round((cantidad * 100) / total) : 0;

        html += '<li>• ' + nombre + ': ' + cantidad + ' voto(s) (' + porcentaje + '%)</li>';
      });

    html += '</ul>';
    resultadosTop5.innerHTML = html;
  }

  function marcarSeleccionTop5(idSeleccionado) {
    botonesVotoTop5.forEach((btn) => {
      if (btn.dataset.juego === idSeleccionado) {
        btn.classList.add('bg-morado', 'text-verde');
      } else {
        btn.classList.remove('bg-morado', 'text-verde');
      }
    });
  }

  botonesVotoTop5.forEach((boton) => {
    boton.addEventListener('click', () => {
      const id = boton.dataset.juego;
      if (!id) return;

      const votos = cargarVotosTop5();
      votos[id] = (votos[id] || 0) + 1;
      guardarVotosTop5(votos);
      marcarSeleccionTop5(id);
      renderResultadosTop5();
    });
  });

  // Render inicial
  renderResultadosTop5();
}



 