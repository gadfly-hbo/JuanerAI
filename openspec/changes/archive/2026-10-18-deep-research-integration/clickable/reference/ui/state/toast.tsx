/* 全局 Toast:底部深色胶囊(替代 antd message)。 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface ToastCtx { show(msg: string): void }
const Ctx = createContext<ToastCtx>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  }, []);

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current); }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      {msg !== null && <div className="toast" role="status" aria-live="polite">{msg}</div>}
    </Ctx.Provider>
  );
}

export const useToast = (): ToastCtx => useContext(Ctx);
