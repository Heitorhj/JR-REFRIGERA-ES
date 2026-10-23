import "../styles/feedback-message.css";

function FeedbackMessage({ type = "error", children, onDismiss }) {
  if (!children) return null;

  return (
    <div className={`feedback-message feedback-${type}`} role={type === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Fechar mensagem">
          ×
        </button>
      )}
    </div>
  );
}

export default FeedbackMessage;
