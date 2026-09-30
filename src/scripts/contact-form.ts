/**
 * contact-form.ts — Validación y envío del formulario de contacto.
 * Reemplaza a validator.min.js (Bootstrap Validator 0.11.9, jQuery) y al
 * $.ajax de function.js.
 *
 * Lo importa ui/ContactForm.astro:
 *   <script>import '@/scripts/contact-form';</script>
 *
 * Engancha (mismo marcado que el original):
 *   <form id="contactForm" action="…" method="POST">
 *     <div class="form-group …">
 *       <input … required>            ← cualquier input/textarea/select
 *       <div class="help-block with-errors"></div>
 *     </div>
 *     <button type="submit" class="btn-default">…</button>
 *     <div id="msgSubmit" class="h3 hidden"></div>
 *   </form>
 *
 * Qué hace, igual que el plugin:
 *   - Pone novalidate en el form: los globos nativos del navegador no se
 *     muestran; los mensajes van al .help-block como
 *     <ul class="list-unstyled"><li>mensaje</li></ul>, y el .form-group
 *     recibe "has-error has-danger".
 *   - Los mensajes son los NATIVOS del navegador (validationMessage), como
 *     hacía el plugin ("Please fill out this field.", etc.). Se pueden
 *     cambiar por campo con data-error / data-required-error / data-type-error.
 *   - Mientras se escribe (input/change) el error aparece con 500 ms de
 *     demora; al salir del campo (focusout), en el momento. Si el campo pasa
 *     a ser válido, el error se borra en el momento.
 *   - El botón de enviar lleva la clase "disabled" mientras falten campos
 *     obligatorios o haya errores (el plugin lo hacía; no lo deshabilita de
 *     verdad, solo la clase).
 *   - Al enviar: valida todo; si hay errores, no envía (focus: false en
 *     function.js → no mueve el foco).
 *
 * Envío (decisión D6): el original hacía POST a form-process.php, que no
 * existe. Acá se hace fetch a form.action si es una URL real (se configura
 * con PUBLIC_FORM_ENDPOINT → site.formEndpoint). Si no hay endpoint
 * (action="#" o vacío), se muestra en #msgSubmit el mensaje de error, con las
 * mismas clases que submitMSG(false, …) del original: "h4 text-danger".
 *
 * Accesibilidad (añadido): aria-invalid y aria-describedby en cada campo
 * con error, y #msgSubmit como región aria-live para que se anuncie.
 */

const FORM = {
  /** Validator DEFAULTS.delay: demora del error mientras se escribe (ms). */
  errorDelay: 500,
  /** Texto de éxito de formSuccess() en function.js. */
  successMessage: 'Message Sent Successfully!',
  /** Texto de error cuando no hay endpoint o falla el envío. Es el que
   *  devolvía el form-process.php de la plantilla cuando algo fallaba. */
  errorMessage: 'Something went wrong :(',
  /** Clases de submitMSG(valid, msg) en function.js. */
  successClasses: 'h4 text-success',
  errorClasses: 'h4 text-danger',
} as const;

type Field = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** Validator.INPUT_SELECTOR: todos los campos menos hidden/submit/reset/botones. */
const FIELD_SELECTOR =
  'input:not([type="hidden"]):not([type="submit"]):not([type="reset"]):not([type="button"]), textarea, select';

/** Valor "lleno" como lo entendía el plugin (checkbox/radio/select múltiple). */
function hasValue(field: Field, form: HTMLFormElement): boolean {
  if (field instanceof HTMLInputElement && field.type === 'checkbox') return field.checked;
  if (field instanceof HTMLInputElement && field.type === 'radio') {
    return !!form.querySelector(`input[name="${CSS.escape(field.name)}"]:checked`);
  }
  if (field instanceof HTMLSelectElement && field.multiple) return field.selectedOptions.length > 0;
  return field.value.trim() !== '';
}

/** Mensaje de error del campo (o null), en el mismo orden de prioridad que el plugin. */
function errorFor(field: Field, form: HTMLFormElement): string | null {
  // El plugin solo validaba campos con valor o con required.
  if (!hasValue(field, form) && !field.required) return null;
  if (field.checkValidity()) return null;
  const v = field.validity;
  const d = field.dataset;
  const specific = v.typeMismatch
    ? d['typeError']
    : v.patternMismatch
      ? d['patternError']
      : v.stepMismatch
        ? d['stepError']
        : v.rangeOverflow
          ? d['maxError']
          : v.rangeUnderflow
            ? d['minError']
            : v.valueMissing
              ? d['requiredError']
              : undefined;
  return d['nativeError'] ?? specific ?? d['error'] ?? (field.validationMessage || 'error!');
}

function initContactForm(form: HTMLFormElement) {
  const fields = Array.from(form.querySelectorAll<Field>(FIELD_SELECTOR)).filter(
    (f) => f.dataset['validate'] !== 'false',
  );
  const submitButtons = [
    ...form.querySelectorAll<HTMLElement>('button[type="submit"], input[type="submit"]'),
    ...(form.id ? document.querySelectorAll<HTMLElement>(`[type="submit"][form="${CSS.escape(form.id)}"]`) : []),
  ];
  const msg = form.querySelector<HTMLElement>('#msgSubmit') ?? document.getElementById('msgSubmit');
  const errors = new Map<Field, string>();
  const timers = new Map<Field, number>();
  let uid = 0;

  form.noValidate = true;
  if (msg) {
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
  }

  const helpBlockOf = (field: Field) =>
    field.closest('.form-group')?.querySelector<HTMLElement>('.help-block.with-errors') ?? null;

  const showError = (field: Field) => {
    const message = errors.get(field);
    const group = field.closest('.form-group');
    const help = helpBlockOf(field);
    if (!message || !group) return;
    if (help) {
      const ul = document.createElement('ul');
      ul.className = 'list-unstyled';
      const li = document.createElement('li');
      li.textContent = message;
      ul.append(li);
      help.replaceChildren(ul);
      if (!help.id) help.id = `${form.id || 'form'}-error-${++uid}`;
      field.setAttribute('aria-describedby', help.id);
    }
    group.classList.add('has-error', 'has-danger');
    field.setAttribute('aria-invalid', 'true');
  };

  const clearError = (field: Field) => {
    const help = helpBlockOf(field);
    help?.replaceChildren();
    field.closest('.form-group')?.classList.remove('has-error', 'has-danger', 'has-success');
    field.removeAttribute('aria-invalid');
  };

  const isIncomplete = () => fields.some((f) => f.required && !hasValue(f, form));
  const hasErrors = () => errors.size > 0;
  const toggleSubmit = () => {
    const off = isIncomplete() || hasErrors();
    submitButtons.forEach((b) => b.classList.toggle('disabled', off));
  };

  /** validateInput del plugin. `deferred` = mostrar el error con demora. */
  const validate = (field: Field, deferred: boolean) => {
    window.clearTimeout(timers.get(field));
    const message = errorFor(field, form);
    if (message) {
      errors.set(field, message);
      if (deferred) timers.set(field, window.setTimeout(() => showError(field), FORM.errorDelay));
      else showError(field);
    } else {
      errors.delete(field);
      clearError(field);
    }
    toggleSubmit();
  };

  const onInput = (e: Event) => {
    const field = e.target as Field;
    if (fields.includes(field)) validate(field, e.type !== 'focusout');
  };
  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  form.addEventListener('focusout', onInput);

  form.addEventListener('reset', () => {
    timers.forEach((t) => window.clearTimeout(t));
    errors.clear();
    fields.forEach(clearError);
    submitButtons.forEach((b) => b.classList.remove('disabled'));
  });

  const setMessage = (ok: boolean, text: string) => {
    if (!msg) return;
    // submitMSG: removeClass() (todas) + addClass(...) + text(...).
    msg.className = ok ? FORM.successClasses : FORM.errorClasses;
    msg.textContent = text;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    fields.forEach((f) => validate(f, false));
    if (isIncomplete() || hasErrors()) return;

    // Endpoint real = action con URL http(s). "#" o vacío → sin endpoint.
    const action = form.getAttribute('action') ?? '';
    const endpoint = action && action !== '#' ? new URL(action, location.href) : null;
    if (!endpoint || !/^https?:$/.test(endpoint.protocol)) {
      setMessage(false, FORM.errorMessage);
      return;
    }

    try {
      const res = await fetch(endpoint, {
        method: (form.getAttribute('method') ?? 'POST').toUpperCase(),
        body: new FormData(form),
        // Formspree, Getform, etc. responden JSON (y no redirigen) con este encabezado.
        headers: { Accept: 'application/json' },
      });
      const text = (await res.text()).trim();
      // El PHP original respondía "success"; los servicios JSON, un 2xx.
      if (res.ok || text === 'success') {
        form.reset();
        setMessage(true, FORM.successMessage);
      } else {
        setMessage(false, FORM.errorMessage);
      }
    } catch {
      setMessage(false, FORM.errorMessage);
    }
  });

  toggleSubmit();
  // Como el plugin al iniciar: valida en el momento los campos que ya traen
  // valor (autocompletado del navegador).
  fields.filter((f) => hasValue(f, form)).forEach((f) => validate(f, false));
}

document.querySelectorAll<HTMLFormElement>('form#contactForm').forEach(initContactForm);

// Sin imports estáticos: esto lo marca como módulo (ámbito propio, no global).
export {};
