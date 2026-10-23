import { useEffect, useId, useRef, useState } from "react";
import "../styles/forms.css";

function SelectField({
  id,
  name,
  value,
  options,
  placeholder,
  disabled = false,
  invalid = false,
  onChange
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [opensUp, setOpensUp] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  useEffect(() => {
    if (!open) return undefined;

    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpensUp(spaceBelow < 240 && rect.top > spaceBelow);
    }

    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    rootRef.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function choose(option) {
    onChange({ target: { name, value: option.value } });
    setOpen(false);
  }

  function openList() {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function onKeyDown(event) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((current) => {
        const start = current < 0 ? (selectedIndex >= 0 ? selectedIndex : 0) : current;
        const next = event.key === "ArrowDown" ? start + 1 : start - 1;
        return Math.max(0, Math.min(options.length - 1, next));
      });
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      if (options[activeIndex]) choose(options[activeIndex]);
      return;
    }

    if (event.key === "Escape" || event.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      className={`select-field${open ? " is-open" : ""}${opensUp ? " opens-up" : ""}`}
      ref={rootRef}
    >
      <button
        id={id}
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={selected ? "select-value" : "select-placeholder"}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="select-chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 7.5 10 12.5 15 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul id={listId} className="select-menu" role="listbox" aria-labelledby={id}>
          {options.length === 0 ? (
            <li className="select-empty">Nenhuma opção disponível</li>
          ) : (
            options.map((option, index) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    data-index={index}
                    aria-selected={isSelected}
                    className={index === activeIndex ? "is-active" : undefined}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => choose(option)}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3.2 8.2 6.3 11.2 12.8 4.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default SelectField;
