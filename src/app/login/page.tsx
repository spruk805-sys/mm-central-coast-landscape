"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Lock, ArrowRight } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
  const [role, setRole] = useState<"OWNER" | "EMPLOYEE">("EMPLOYEE");
  const [pin, setPin] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "OWNER") {
      if (pin === "1234") { // MVP PIN
        localStorage.setItem("mm_role", "OWNER");
        router.push("/dashboard");
      } else {
        setError("Invalid Command PIN");
      }
    } else {
      if (employeeId.length >= 3) {
        localStorage.setItem("mm_role", "EMPLOYEE");
        localStorage.setItem("mm_emp_id", employeeId);
        router.push("/dashboard");
      } else {
        setError("Invalid Employee ID");
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoGroup}>
          <div className={styles.logoIcon}>
            <ShieldCheck size={32} />
          </div>
          <h1 className={styles.logoText}>MM<span>OPS.</span></h1>
        </div>

        <div className={styles.roleSelector}>
          <button 
            className={`${styles.roleBtn} ${role === "EMPLOYEE" ? styles.active : ""}`}
            onClick={() => setRole("EMPLOYEE")}
          >
            <User size={18} />
            <span>Employee</span>
          </button>
          <button 
            className={`${styles.roleBtn} ${role === "OWNER" ? styles.active : ""}`}
            onClick={() => setRole("OWNER")}
          >
            <ShieldCheck size={18} />
            <span>Owner</span>
          </button>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {role === "OWNER" ? (
            <div className={styles.inputGroup}>
              <label><Lock size={14} /> COMMAND PIN</label>
              <input 
                type="password" 
                placeholder="••••" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
              />
            </div>
          ) : (
            <div className={styles.inputGroup}>
              <label><User size={14} /> EMPLOYEE ID</label>
              <input 
                type="text" 
                placeholder="EMP-001" 
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitBtn}>
            INITIATE SYSTEM ACCESS <ArrowRight size={18} />
          </button>
        </form>

        <p className={styles.footer}>MM Central Coast operations Intel</p>
      </div>
    </div>
  );
}
