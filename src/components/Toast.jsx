import React from "react";
import { s } from "../styles/theme";

export function Toast({ msg, type }) {
  return (
    <div style={s.toast} className={type === "error" ? "kt-toast-err" : "kt-toast-cyan"}>
      {type === "error" ? "⚠ " : "✓ "}{msg}
    </div>
  );
}
