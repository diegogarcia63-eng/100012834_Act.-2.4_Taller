import { useState, useEffect } from "react";

const API_USUARIOS = "http://107.22.21.214:3000/api/usuarios";
const API_PAQUETES = "http://107.22.21.214:3000/api/paquetes";

export default function App() {
  const [usuarioActual, setUsuarioActual] = useState(() => {
    const sesionGuardada = localStorage.getItem("sesion_activa");
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const [tabAuth, setTabAuth] = useState("login");
  const [authEmailUser, setAuthEmailUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRol, setRegRol] = useState("cliente");

  const [mensaje, setMensaje] = useState(null);
  const notificar = (texto, tipo = "exito") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3500);
  };

  const [usuarios, setUsuarios] = useState([]);
  const [paquetes, setPaquetes] = useState(() => {
    const localP = localStorage.getItem("demo_paquetes");
    return localP ? JSON.parse(localP) : [{
      id: 1, titulo: "Tour Cancún Todo Incluido", precio: 450, creador: "operador@viajes.com", estado: "aprobado",
      imagen: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
      descripcion: "Playas de arena blanca, tours acuáticos y buffet internacional."
    }];
  });

  const [pedidos, setPedidos] = useState(() => {
    const localPedidos = localStorage.getItem("demo_pedidos");
    return localPedidos ? JSON.parse(localPedidos) : [];
  });

  useEffect(() => { try { localStorage.setItem("demo_paquetes", JSON.stringify(paquetes)); } catch (e) {} }, [paquetes]);
  useEffect(() => { localStorage.setItem("demo_pedidos", JSON.stringify(pedidos)); }, [pedidos]);

  const cargarUsuarios = async () => {
    try {
      const res = await fetch(API_USUARIOS);
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : data.usuarios || []);
    } catch {
      setUsuarios(JSON.parse(localStorage.getItem("demo_usuarios") || "[]"));
    }
  };

  useEffect(() => { if (usuarioActual?.rol === "superadmin") cargarUsuarios(); }, [usuarioActual]);

  // --- LOGIN ESTRICTO ---
  const iniciarSesion = async (e) => {
    e.preventDefault();

    try {
      // Petición directa al backend. Si webdb está apagada, esto fallará y caerá al catch.
      const res = await fetch(API_USUARIOS);
      if (!res.ok) throw new Error("Fallo en la respuesta del servidor");
      
      const data = await res.json();
      const usuariosApi = Array.isArray(data) ? data : data.usuarios || [];

      if (tabAuth === "superadmin") {
        if (authEmailUser === "superadmin" && authPassword === "admin123") {
          const sesion = { nombre: "Super Administrador", email: "admin@sistema.com", rol: "superadmin" };
          setUsuarioActual(sesion);
          localStorage.setItem("sesion_activa", JSON.stringify(sesion));
          notificar("Bienvenido Super Administrador", "exito"); return;
        } else {
          notificar("Credenciales inválidas", "error"); return;
        }
      }

      const user = usuariosApi.find(
        (u) => (u.email === authEmailUser || u.nombre === authEmailUser) && u.password === authPassword
      );

      if (user) {
        if (user.rol === "creador" && user.estadoCuenta === "pendiente") {
          notificar("Tu cuenta está en revisión por el Super Admin.", "error"); return;
        }
        const sesion = { id: user.id || user._id, nombre: user.nombre, email: user.email, rol: user.rol || "cliente" };
        setUsuarioActual(sesion);
        localStorage.setItem("sesion_activa", JSON.stringify(sesion));
        notificar(`Bienvenido ${sesion.nombre}`, "exito");
      } else {
        notificar("Usuario o contraseña incorrectos", "error");
      }
    } catch (err) {
      notificar("ERROR CRÍTICO: No hay conexión con la Base de Datos o el Servidor.", "error");
    }
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    const estadoInicial = regRol === "creador" ? "pendiente" : "aprobado";
    const nuevoUsuario = { nombre: regNombre, email: regEmail, password: regPassword, rol: regRol, estadoCuenta: estadoInicial, id: Date.now() };

    try { 
      await fetch(API_USUARIOS, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevoUsuario) }); 
    } catch (err) {}

    const users = JSON.parse(localStorage.getItem("demo_usuarios") || "[]");
    users.push(nuevoUsuario);
    localStorage.setItem("demo_usuarios", JSON.stringify(users));

    if (estadoInicial === "pendiente") notificar("Cuenta creada. Al ser Creador, será revisada por el Super Admin.", "exito");
    else notificar("Cuenta creada exitosamente. Ya puedes iniciar sesión.", "exito");
    
    setRegNombre(""); setRegEmail(""); setRegPassword(""); setTabAuth("login");
  };

  const cerrarSesion = () => { setUsuarioActual(null); localStorage.removeItem("sesion_activa"); };

  if (!usuarioActual) {
    return (
      <div className="contenedor-login">
        <div className="tarjeta tarjeta-auth">
          <div className="pestanas-auth">
            <button className={`btn-tab ${tabAuth === "login" ? "activa" : ""}`} onClick={() => setTabAuth("login")}>Iniciar Sesión</button>
            <button className={`btn-tab ${tabAuth === "registro" ? "activa" : ""}`} onClick={() => setTabAuth("registro")}>Registrarse</button>
            <button className={`btn-tab btn-tab-super ${tabAuth === "superadmin" ? "activa" : ""}`} onClick={() => setTabAuth("superadmin")}>Super Admin</button>
          </div>

          {mensaje && <div className={`alerta alerta-${mensaje.tipo}`}>{mensaje.texto}</div>}

          {tabAuth !== "registro" ? (
            <div>
              <div className="encabezado-login"><h2>{tabAuth === "superadmin" ? "Panel Maestro" : "Iniciar Sesión"}</h2></div>
              <form onSubmit={iniciarSesion} className="formulario">
                <div className="campo"><label>Usuario / Correo</label><input type="text" required value={authEmailUser} onChange={(e) => setAuthEmailUser(e.target.value)} /></div>
                <div className="campo"><label>Contraseña</label><input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></div>
                <button type="submit" className={`btn ${tabAuth === "superadmin" ? "btn-peligro" : "btn-primario"}`}>{tabAuth === "superadmin" ? "Ingresar como Super Admin" : "Iniciar Sesión"}</button>
              </form>
            </div>
          ) : (
            <div>
              <div className="encabezado-login"><h2>Crea tu Cuenta</h2></div>
              <form onSubmit={registrarUsuario} className="formulario">
                <div className="campo"><label>Nombre Completo</label><input type="text" required value={regNombre} onChange={(e) => setRegNombre(e.target.value)} /></div>
                <div className="campo"><label>Correo Electrónico</label><input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} /></div>
                <div className="campo"><label>Contraseña</label><input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} /></div>
                <div className="campo">
                  <label>Tipo de cuenta</label>
                  <div className="selector-rol">
                    <label className={`opcion-rol ${regRol === "creador" ? "seleccionado" : ""}`}>
                      <input type="radio" name="rol" value="creador" checked={regRol === "creador"} onChange={() => setRegRol("creador")} />
                      <div><strong>Admin. de Productos</strong><span>Sube paquetes</span></div>
                    </label>
                    <label className={`opcion-rol ${regRol === "cliente" ? "seleccionado" : ""}`}>
                      <input type="radio" name="rol" value="cliente" checked={regRol === "cliente"} onChange={() => setRegRol("cliente")} />
                      <div><strong>Cliente</strong><span>Compra paquetes</span></div>
                    </label>
                  </div>
                </div>
                <button type="submit" className="btn btn-primario">Registrarse</button>
              </form>
            </div>
          )}
        </div>
        <style>{estilosCSS}</style>
      </div>
    );
  }

  return (
    <div className="contenedor-app">
      <header className="encabezado-admin">
        <div>
          <h1>Panel Principal</h1>
          <p>Usuario: <strong>{usuarioActual.nombre}</strong> &bull; <span className={`badge-rol badge-${usuarioActual.rol}`}>{usuarioActual.rol.toUpperCase()}</span></p>
        </div>
        <button onClick={cerrarSesion} className="btn-logout">Cerrar Sesión</button>
      </header>
      <div style={{padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '20px'}}>
        <h2>Dashboard de Control</h2>
        <p style={{marginTop: '10px', color: '#6b7280'}}>Conexión a Base de Datos: <strong style={{color: '#10b981'}}>Activa</strong></p>
      </div>
      <style>{estilosCSS}</style>
    </div>
  );
}

const estilosCSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background-color: #f3f4f6; color: #1f2937; }
  .contenedor-login { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .tarjeta, .tarjeta-auth { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
  .tarjeta-auth { width: 100%; max-width: 480px; }
  .pestanas-auth { display: flex; gap: 6px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
  .btn-tab { flex: 1; padding: 8px 4px; background: none; border: none; font-weight: 600; font-size: 13px; color: #6b7280; cursor: pointer; border-radius: 6px; transition: 0.2s; }
  .btn-tab.activa { background-color: #eff6ff; color: #2563eb; }
  .btn-tab-super.activa { background-color: #fee2e2; color: #b91c1c; }
  .encabezado-login { text-align: center; margin-bottom: 20px; }
  .encabezado-login h2 { font-size: 22px; color: #111827; }
  .selector-rol { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .opcion-rol { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-size: 13px; }
  .opcion-rol.seleccionado { border-color: #2563eb; background: #f0f7ff; }
  .contenedor-app { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
  .encabezado-admin { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .btn-logout { background: #fff; border: 1px solid #d1d5db; color: #374151; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; }
  .alerta { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
  .alerta-exito { background: #def7ec; color: #03543f; }
  .alerta-error { background: #fde8e8; color: #9b1c1c; }
  .formulario { display: flex; flex-direction: column; gap: 14px; }
  .campo { display: flex; flex-direction: column; gap: 4px; }
  .campo label { font-size: 13px; font-weight: 600; color: #374151; }
  .campo input { padding: 10px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 14px; outline: none; }
  .btn { padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; flex: 1; }
  .btn-primario { background: #2563eb; color: white; }
  .btn-peligro { background: #dc2626; color: white; }
  .badge-rol { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: #e0e7ff; color: #3730a3; }
`;