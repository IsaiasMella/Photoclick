# Compilado contra fuente: tres ejemplos

Tres casos que muestran qué cambió entre la plantilla publicada (`referencia/`) y la reconstrucción. En los tres, **el resultado en pantalla es el mismo**; lo que cambia es cómo está escrito y por qué.

> Sobre la palabra "compilado": la plantilla original no está minificada. `custom.css` tiene 5874 líneas legibles. Lo "compilado" es que llega **ya resuelto**: el contenido copiado a mano en cada página, los valores escritos uno por uno y todas las librerías juntas. La fuente reconstruida recupera la estructura que había detrás.

---

## Ejemplo 1: un botón. De valores sueltos a tokens

**Antes:** `referencia/css/custom.css`, sección 02.

```css
.btn-default{
	position: relative;
	display: inline-block;
	font-size: 16px;
	font-weight: 600;
	line-height: 1em;
	text-transform: capitalize;
	color: var(--bg-color);
	background: var(--accent-color);
	border-radius: 8px;
	padding: 17px 59px 17px 24px;
	border: none;
	overflow: hidden;
	transition: all 0.4s ease-in-out;
	z-index: 1;
}

.btn-default::before{
	content: '';
	position: absolute;
	top: 50%;
	right: 5px;
	width: 40px;
	height: 40px;
	transform: translateY(-50%);
	background-color: var(--white-color);
	background-image: url('../images/arrow-primary.svg');
	...
	border-radius: 5px;
	transition: all 0.4s ease-in-out;
}
```

**Después:** `src/styles/components/buttons.css`.

```css
.btn-default {
	position: relative;
	display: inline-block;
	font-size: var(--text-sm);
	font-weight: var(--font-weight-semibold);
	line-height: var(--leading-none);
	text-transform: capitalize;
	color: var(--on-accent);
	background: var(--accent);
	border-radius: var(--radius-md);
	padding: 17px 59px 17px 24px;          /* óptico: deja lugar a la flecha de 40 px */
	border: none;
	overflow: hidden;
	transition: all var(--duration-base) var(--ease-in-out);
	z-index: 1;
}

.btn-default::before {
	content: '';
	position: absolute;
	top: 50%;
	right: var(--space-1);
	width: 40px;
	height: 40px;
	transform: translateY(-50%);
	background-color: var(--surface-highlight);
	background-image: url('../../assets/images/arrow-primary.svg');
	...
	border-radius: var(--radius-xs);
	transition: all var(--duration-base) var(--ease-in-out);
}
```

**Qué cambió y por qué:**
- `16px`, `600`, `8px`, `0.4s`… ahora son tokens. Si se cambia `--radius-md`, cambian **todos** los elementos con ese radio. En el original había que buscar `8px` a mano entre 5874 líneas.
- `--bg-color` usado como **color de texto** pasa a `--on-accent` ("texto sobre el dorado"). El nombre ahora dice para qué sirve, y por eso el tema claro funciona: el fondo de la página cambia y el texto del botón no.
- `--white-color` como relleno pasa a `--surface-highlight`. Ver en `TOKENS.md` por qué "blanco" se separó en tres roles.
- El `url()` apunta a `src/assets`: Vite lo procesa (hash en el nombre, caché larga).
- El padding asimétrico y los 40 px de la flecha quedaron literales: son geometría propia del botón, no valores del sistema.

La migración fue automática y está verificada: los estilos computados dan **idénticos** en todo el sitio (`VERIFICACION.md`).

---

## Ejemplo 2: tres tarjetas. De HTML copiado a mano a colección + componente

**Antes:** `referencia/index.html`. El mismo bloque, pegado tres veces en la home y seis en `services.html`, con el texto adentro.

```html
<div class="col-xl-4 col-md-6">
    <!-- Service Item Start -->
    <div class="service-item wow fadeInUp">
        <div class="service-item-header">
            <div class="icon-box">
                <img src="images/icon-service-item-1.svg" alt="">
            </div>
            <div class="service-item-content">
                <h2><a href="service-single.html">Pre-Wedding Photography</a></h2>
                <p>We focus on natural moments location and personalized themes to create.</p>
            </div>
        </div>
        <div class="service-item-image">
            <figure>
                <a href="service-single.html" data-cursor-text="View">
                    <img src="images/service-item-image-1.jpg" alt="">
                </a>
            </figure>
        </div>
    </div>
</div>

<div class="col-xl-4 col-md-6">
    <div class="service-item wow fadeInUp" data-wow-delay="0.2s">
        … (otra vez lo mismo, con otro texto y otra foto)
```

**Después:** tres capas, cada una con su responsabilidad.

`src/content/services/pre-wedding-photography.md`, **el dato**:
```md
---
title: "Pre-Wedding Photography"
summary: "We focus on natural moments locations and personalized themes to create."
icon: "../../assets/images/icon-service-item-1.svg"
image: "../../assets/images/service-item-image-1.jpg"
order: 1
---
(el cuerpo es el texto de la página de detalle)
```

`src/components/sections/OurServices.astro`, **la lista**:
```astro
---
const { limit = 3 } = Astro.props;
const services = (await getCollection('services'))
  .sort((a, b) => a.data.order - b.data.order)
  .slice(0, limit);
---
{services.map((entry, i) => (
  <div class="col-xl-4 col-md-6">
    <ServiceItem entry={entry} index={i} />
  </div>
))}
```

`src/components/cards/ServiceItem.astro`, **la tarjeta**:
```astro
<div class="service-item wow fadeInUp" data-wow-delay={delay(index)}>
  <div class="service-item-header">
    <div class="icon-box"><Image src={icon} alt="" /></div>
    <div class="service-item-content">
      <h2><a href={href}>{title}</a></h2>
      <p>{summary}</p>
    </div>
  </div>
  <div class="service-item-image">
    <a href={href} data-cursor-text="View">
      <figure class="image-anime">
        <Image src={image} alt={`${title} session`}
               widths={[400, 600, 800, 1200]}
               sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 400px" />
      </figure>
    </a>
  </div>
</div>
```

**Qué cambió y por qué:**
- **El mismo marcado y las mismas clases:** el CSS del autor aplica sin tocarlo.
- El texto existe **una sola vez**. En el original, la home decía "location" y el listado "locations". Ahora no pueden divergir.
- `data-wow-delay` sale de `delay(i)` (0, 0.2s, 0.4s…) y no de escribirlo a mano.
- Los enlaces apuntan al detalle **de ese** servicio (`/services/pre-wedding-photography/`). En el original todos iban a la misma `service-single.html`.
- `<Image>` genera AVIF/WebP en 4 anchos, con `width`/`height` (sin saltos de diseño) y `alt` descriptivo.
- **En React** esto es exactamente `services.map(s => <ServiceItem key={s.id} {...s} />)` con los datos en un CMS. Astro lo hace al compilar y al navegador llega HTML plano.

---

## Ejemplo 3: una regla responsive. La cascada escondida en el orden

**Antes:** `referencia/css/custom.css`. Todas las `@media` van juntas al final (sección 32, línea 4450 en adelante). Dos reglas de **igual especificidad** (0,2,0) apuntan al mismo `<span>`:

```css
/* sección 07 (línea 1387) */
.why-choose-us-box-content .section-sub-title{
	margin-bottom: 15px;
}

/* … 3000 líneas después … sección 32 */
@media only screen and (max-width: 1024px){
	.section-sub-heading .section-sub-title,
	.section-title .section-sub-title{
		margin-bottom: 10px;
	}
}
```

En ≤1024 px gana la de 10 px, **solo porque está más abajo en el archivo**.

**Lo que habría pasado** al mover cada `@media` junto a su componente, que es lo esperable: `section-title.css` va **antes** que `why-choose-us.css`, así que la regla de 10 px habría perdido. Resultado: 5 px más en esa tarjeta, y la sección "Why choose us" un poco más alta en tablet y celular. A simple vista es casi invisible; en la comparación de estilos computados aparecieron **720 diferencias**, todas por esta única regla.

**Después:** `src/styles/components/why-choose-us.css`.

```css
/* --bp-lg */
@media only screen and (max-width: 1024px) {
	/* Cascada: esta regla es de section-title.css pero vive acá porque why-choose-us.css
	   tiene una regla base de igual especificidad sobre el mismo elemento. En el
	   original ganaba esta (estaba al final, en la sección 32); si se mueve a
	   section-title.css, pierde. Verificado con tools/computed-styles.mjs. */
	.section-sub-heading .section-sub-title,
	.section-title .section-sub-title {
		margin-bottom: var(--space-2);
	}
}
```

**Qué cambió y por qué:**
- Cada componente tiene sus `@media` al lado (se lee y se borra como una unidad), **salvo** esta regla, que lleva un comentario que lo explica.
- `/* --bp-lg */` nombra el token del breakpoint. Las `@media` no aceptan `var()`, así que el número va literal y el comentario dice a qué token corresponde.
- **La lección:** separar un CSS largo en archivos no es "cortar y pegar". El orden es parte del significado. Por eso la migración se verificó con `tools/computed-styles.mjs` (`getComputedStyle` de todos los elementos, sin JS) y no solo a ojo.
