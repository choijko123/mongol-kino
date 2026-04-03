import React from "react";
import { s } from "../styles/theme";

export function Splash() {
  return (
    <div style={s.splash}>
      <div style={s.splashLogo} className="kt-logo-glow kt-float">
        КИН<span style={{color:"#00e5ff",textShadow:"0 0 30px #00e5ff,0 0 60px #00e5ff"}}>●</span>ТАЙМ
      </div>
    </div>
  );
}
