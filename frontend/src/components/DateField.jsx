import { useEffect, useId, useRef, useState } from "react";
import "../styles/forms.css";

const SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

function mascarar(valor) {
  const iso = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;

  const digitos = valor.replace(/\D/g, "").slice(0, 8);
  let texto = digitos.slice(0, 2);
  if (digitos.length > 2) texto += `/${digitos.slice(2, 4)}`;
  if (digitos.length > 4) texto += `/${digitos.slice(4, 8)}`;
  return texto;
}

function interpretar(texto) {
  const partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!partes) return null;

  const dia = Number(partes[1]);
  const mes = Number(partes[2]);
  const ano = Number(partes[3]);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function isoParaTexto(iso) {
  if (!iso) return "";
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

function partesIso(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return { ano, mes, dia };
}

function tituloMes(ano, mes) {
  const texto = new Date(Date.UTC(ano, mes - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function DateField({ id, name, value, min, invalid = false, onChange, onError }) {
  const popoverId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [texto, setTexto] = useState(() => isoParaTexto(value));
  const [open, setOpen] = useState(false);
  const [opensUp, setOpensUp] = useState(false);
  const inicial = value || min;
  const [visivel, setVisivel] = useState(() => {
    const partes = partesIso(inicial);
    return { ano: partes.ano, mes: partes.mes };
  });

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setTexto(isoParaTexto(value));
  }, [value]);

  useEffect(() => {
    if (!open) return undefined;

    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpensUp(spaceBelow < 340 && rect.top > spaceBelow);
    }

    const fecharFora = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", fecharFora);
    return () => document.removeEventListener("mousedown", fecharFora);
  }, [open]);

  function publicar(proximoTexto, mostrarErro) {
    const iso = interpretar(proximoTexto);
    if (!proximoTexto) {
      onChange({ target: { name, value: "" } });
      onError("");
      return;
    }
    if (!iso) {
      onChange({ target: { name, value: "" } });
      onError(mostrarErro ? "Use uma data válida, no formato dd/mm/aaaa." : "");
      return;
    }
    if (min && iso < min) {
      onChange({ target: { name, value: "" } });
      onError(mostrarErro ? "Escolha hoje ou uma data futura." : "");
      return;
    }
    onError("");
    onChange({ target: { name, value: iso } });
    setVisivel(partesIso(iso));
  }

  function aoDigitar(event) {
    const mascarado = mascarar(event.target.value);
    setTexto(mascarado);
    publicar(mascarado, mascarado.length === 10);
  }

  function escolher(iso) {
    setTexto(isoParaTexto(iso));
    publicar(isoParaTexto(iso), true);
    setOpen(false);
    inputRef.current?.focus();
  }

  function limpar() {
    setTexto("");
    publicar("", false);
    setOpen(false);
    inputRef.current?.focus();
  }

  const minimo = min ? partesIso(min) : null;
  const mesAnteriorBloqueado = Boolean(
    minimo && (visivel.ano < minimo.ano || (visivel.ano === minimo.ano && visivel.mes <= minimo.mes))
  );
  const primeiroDia = new Date(Date.UTC(visivel.ano, visivel.mes - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(visivel.ano, visivel.mes, 0)).getUTCDate();
  const celulas = [
    ...Array.from({ length: primeiroDia }, () => null),
    ...Array.from({ length: diasNoMes }, (_, indice) => indice + 1)
  ];

  function mudarMes(delta) {
    setVisivel((atual) => {
      const data = new Date(Date.UTC(atual.ano, atual.mes - 1 + delta, 1));
      return { ano: data.getUTCFullYear(), mes: data.getUTCMonth() + 1 };
    });
  }

  return (
    <div className={`date-field${open ? " is-open" : ""}${opensUp ? " opens-up" : ""}`} ref={rootRef}>
      <div className="date-control">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="dd/mm/aaaa"
          maxLength={10}
          value={texto}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-erro` : undefined}
          onChange={aoDigitar}
          onBlur={() => publicar(texto, true)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <button
          type="button"
          className="date-open"
          aria-label="Abrir calendário"
          aria-expanded={open}
          aria-controls={popoverId}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setOpen((atual) => !atual)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M3.5 10h17M8 3.5v3M16 3.5v3" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div id={popoverId} className="date-popover" role="dialog" aria-label="Calendário">
          <div className="date-popover-head">
            <strong>{tituloMes(visivel.ano, visivel.mes)}</strong>
            <div>
              <button type="button" aria-label="Mês anterior" disabled={mesAnteriorBloqueado} onClick={() => mudarMes(-1)}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" aria-label="Próximo mês" onClick={() => mudarMes(1)}>
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </div>
          </div>
          <div className="date-week" aria-hidden="true">
            {SEMANA.map((dia, indice) => <span key={`${dia}-${indice}`}>{dia}</span>)}
          </div>
          <div className="date-grid" role="grid">
            {celulas.map((dia, indice) => {
              if (!dia) return <span key={`vazio-${indice}`} />;
              const iso = `${visivel.ano}-${String(visivel.mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
              const desabilitado = Boolean(min && iso < min);
              const selecionado = iso === value;
              const hoje = iso === min;
              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  disabled={desabilitado}
                  aria-selected={selecionado}
                  aria-current={hoje ? "date" : undefined}
                  className={`${selecionado ? "is-selected" : ""} ${hoje ? "is-today" : ""}`.trim()}
                  onClick={() => escolher(iso)}
                >
                  {dia}
                </button>
              );
            })}
          </div>
          <div className="date-popover-foot">
            <button type="button" onClick={limpar}>Limpar</button>
            <button type="button" onClick={() => escolher(min)} disabled={!min}>Hoje</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateField;
