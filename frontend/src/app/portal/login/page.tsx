"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api.js";

export default function PortalLoginPage() {

  const router = useRouter();

  const [mode,setMode] = useState<"login"|"register">("login");

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");



  async function handleSubmit(e:React.FormEvent){

    e.preventDefault();

    setLoading(true);
    setError("");

    try{

      let data;

      if(mode === "register"){

        data = await api.register(name,email,password);

      }
      else{

        data = await api.login(email,password);

      }

      // Prevent admin logging into citizen portal
      if(data.user.role !== "user"){

        setError("This is not a citizen account");
        setLoading(false);
        return;

      }

      // Clear old tokens
      localStorage.removeItem("adminToken");
      localStorage.removeItem("citizenToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("citizenUser");

      // Store citizen auth
      localStorage.setItem("citizenToken",data.token);
      localStorage.setItem("citizenUser",JSON.stringify(data.user));

      router.push("/portal/dashboard");

    }
    catch(err:any){

      setError(err.message || "Something went wrong");

    }
    finally{

      setLoading(false);

    }

  }



  return(

    <main className="login-root">

      <div className="login-bg">

        <div className="orb orb-1"/>
        <div className="orb orb-2"/>

        <div className="grid-overlay"/>

      </div>



      <div className="login-card">

        <div className="login-logo">

          <div className="logo-hex">
            <span>B</span>
          </div>

          <div>

            <h1 className="logo-title">
              BHOOMI<span>LEDGER</span>
            </h1>

            <p className="logo-sub">
              CITIZEN PORTAL
            </p>

          </div>

        </div>



        <p className="login-tagline">
          <em>Your land. Your rights. On-chain.</em>
        </p>



        <div className="portal-tabs">

          <button
            className={`portal-tab ${mode==="login"?"active":""}`}
            onClick={()=>{
              setMode("login");
              setError("");
            }}
          >
            SIGN IN
          </button>


          <button
            className={`portal-tab ${mode==="register"?"active":""}`}
            onClick={()=>{
              setMode("register");
              setError("");
            }}
          >
            REGISTER
          </button>

        </div>



        <form onSubmit={handleSubmit} className="login-form">

          {mode==="register" && (

            <div className="field">

              <label>FULL NAME</label>

              <input
                value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="Your full legal name"
                required
              />

            </div>

          )}



          <div className="field">

            <label>EMAIL ADDRESS</label>

            <input
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

          </div>



          <div className="field">

            <label>PASSWORD</label>

            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />

          </div>



          {error && (
            <p className="login-error">
              ⚠ {error}
            </p>
          )}



          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >

            {loading
              ? "PLEASE WAIT..."
              : mode==="login"
                ? "ACCESS PORTAL →"
                : "CREATE ACCOUNT →"
            }

          </button>

        </form>



        <p className="login-footer">

          Admin?

          <a
            href="/login"
            style={{
              color:"#d4af37",
              textDecoration:"none"
            }}
          >

            Go to Admin Dashboard →

          </a>

        </p>

      </div>

    </main>

  );

}