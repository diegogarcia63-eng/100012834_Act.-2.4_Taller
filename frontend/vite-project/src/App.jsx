import { useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";

const API_USUARIOS = "http://localhost:3000/api/usuarios";
const API_PAQUETES = "http://localhost:3000/api/paquetes";

// Tu clave real de Google reCAPTCHA
const RECAPTCHA_SITE_KEY = "6LduMdEtAAAAALZzLiPPuNay3uW6cPArEP83fhHt";

export default function App() {
  // --- Estados de Sesión ---
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
  const [captchaToken, setCaptchaToken] = useState(null);

  const [mensaje, setMensaje] = useState(null);
  const notificar = (texto, tipo = "exito") => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), 3500);
  };

  // --- Datos del sistema ---
  const [usuarios, setUsuarios] = useState([]);
  
  const [paquetes, setPaquetes] = useState(() => {
    const localP = localStorage.getItem("demo_paquetes");
    return localP ? JSON.parse(localP) : [{
      id: 1, titulo: "Tour Cancún Todo Incluido", precio: 450, creador: "operador@viajes.com", estado: "aprobado",
      imagen: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&q=80",
      descripcion: "Playas de arena blanca, tours acuáticos y buffet internacional."
    }];
  });

  // NUEVO: Estado para los pedidos de los clientes
  const [pedidos, setPedidos] = useState(() => {
    const localPedidos = localStorage.getItem("demo_pedidos");
    return localPedidos ? JSON.parse(localPedidos) : [];
  });

  useEffect(() => {
    try { localStorage.setItem("demo_paquetes", JSON.stringify(paquetes)); } catch (e) {}
  }, [paquetes]);

  // Guardar pedidos en LocalStorage
  useEffect(() => {
    localStorage.setItem("demo_pedidos", JSON.stringify(pedidos));
  }, [pedidos]);

  // Formulario Super Admin - Usuarios
  const [adminNombre, setAdminNombre] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminRol, setAdminRol] = useState("cliente");
  const [adminPassword, setAdminPassword] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  // Formulario Super Admin - Editar Paquetes
  const [adminEditandoPaqId, setAdminEditandoPaqId] = useState(null);
  const [adminPaqTitulo, setAdminPaqTitulo] = useState("");
  const [adminPaqPrecio, setAdminPaqPrecio] = useState("");
  const [adminPaqDesc, setAdminPaqDesc] = useState("");
  const [adminPaqImagen, setAdminPaqImagen] = useState("");

  // Formulario Creador - Paquetes
  const [nuevoPaqTitulo, setNuevoPaqTitulo] = useState("");
  const [nuevoPaqPrecio, setNuevoPaqPrecio] = useState("");
  const [nuevoPaqDesc, setNuevoPaqDesc] = useState("");
  const [nuevoPaqImagen, setNuevoPaqImagen] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [editandoPaqId, setEditandoPaqId] = useState(null); 

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

  useEffect(() => {
    if (usuarioActual?.rol === "superadmin") cargarUsuarios();
  }, [usuarioActual]);

  // --- IMÁGENES GENÉRICAS ---
  const procesarImagenLocal = (e, setEstadoImagen) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return notificar("La imagen debe pesar menos de 2MB", "error");
    
    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onloadend = () => { setEstadoImagen(reader.result); setSubiendoFoto(false); };
    reader.onerror = () => { notificar("Error al leer imagen", "error"); setSubiendoFoto(false); };
    reader.readAsDataURL(file);
  };

  // --- AUTENTICACIÓN ---
  const iniciarSesion = async (e) => {
    e.preventDefault();
    if (!captchaToken && tabAuth !== "superadmin") {
      notificar("Completa el captcha de seguridad.", "error"); return;
    }

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

    let autenticado = false;
    try {
      let listaApi = [];
      try {
        const res = await fetch(API_USUARIOS);
        if (res.ok) { const data = await res.json(); listaApi = Array.isArray(data) ? data : data.usuarios || []; }
      } catch (err) {}

      const listaLocal = JSON.parse(localStorage.getItem("demo_usuarios") || "[]");
      const usuariosTotales = [...listaApi, ...listaLocal];

      const user = usuariosTotales.find(
        (u) => (u.email === authEmailUser || u.nombre === authEmailUser) && u.password === authPassword
      );

      if (user) {
        if (user.rol === "creador" && user.estadoCuenta === "pendiente") {
          notificar("Tu cuenta de Creador está en revisión por el Super Admin.", "error"); return;
        }

        const sesion = { id: user.id || user._id, nombre: user.nombre, email: user.email, rol: user.rol || "cliente" };
        setUsuarioActual(sesion);
        localStorage.setItem("sesion_activa", JSON.stringify(sesion));
        notificar(`Bienvenido ${sesion.nombre}`, "exito");
        autenticado = true;
      }
    } catch (err) {}

    if (!autenticado) notificar("Usuario o contraseña incorrectos", "error");
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    if (!captchaToken) { notificar("Completa el captcha de seguridad.", "error"); return; }

    const estadoInicial = regRol === "creador" ? "pendiente" : "aprobado";
    const nuevoUsuario = { nombre: regNombre, email: regEmail, password: regPassword, rol: regRol, estadoCuenta: estadoInicial, id: Date.now() };

    try { await fetch(API_USUARIOS, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevoUsuario) }); } catch (err) {}

    const users = JSON.parse(localStorage.getItem("demo_usuarios") || "[]");
    users.push(nuevoUsuario);
    localStorage.setItem("demo_usuarios", JSON.stringify(users));

    if (estadoInicial === "pendiente") notificar("Cuenta creada. Al ser Creador, será revisada por el Super Admin.", "exito");
    else notificar("Cuenta creada exitosamente. Ya puedes iniciar sesión.", "exito");
    
    setRegNombre(""); setRegEmail(""); setRegPassword(""); setCaptchaToken(null); setTabAuth("login");
  };

  const cerrarSesion = () => { setUsuarioActual(null); localStorage.removeItem("sesion_activa"); setCaptchaToken(null); };

  // --- ACCIONES SUPER ADMIN - USUARIOS Y PAQUETES ---
  const guardarUsuarioSuperAdmin = async (e) => {
    e.preventDefault();
    const payload = { nombre: adminNombre, email: adminEmail, rol: adminRol, estadoCuenta: "aprobado" };
    if (adminPassword) payload.password = adminPassword;

    let lista = [...usuarios];
    if (editandoId) lista = lista.map((u) => ((u.id || u._id) === editandoId ? { ...u, ...payload } : u));
    else lista.push({ ...payload, id: Date.now() });
    
    setUsuarios(lista); localStorage.setItem("demo_usuarios", JSON.stringify(lista)); notificar("Usuario guardado", "exito");
    setAdminNombre(""); setAdminEmail(""); setAdminPassword(""); setAdminRol("cliente"); setEditandoId(null);
  };

  const eliminarUsuario = (id) => {
    if (!window.confirm("¿Eliminar usuario?")) return;
    const filtrados = usuarios.filter((u) => (u.id || u._id) !== id);
    setUsuarios(filtrados); localStorage.setItem("demo_usuarios", JSON.stringify(filtrados)); notificar("Usuario eliminado", "exito");
  };

  const aprobarCuentaAdmin = (id) => {
    const actualizados = usuarios.map(u => (u.id || u._id) === id ? { ...u, estadoCuenta: "aprobado" } : u);
    setUsuarios(actualizados); localStorage.setItem("demo_usuarios", JSON.stringify(actualizados)); notificar("Cuenta aprobada", "exito");
  };

  const cambiarEstadoPaquete = (id, nuevoEstado) => {
    const actualizados = paquetes.map((p) => p.id === id ? { ...p, estado: nuevoEstado } : p);
    setPaquetes(actualizados); notificar(`Paquete ${nuevoEstado}`, "exito");
  };

  const eliminarPaqueteAdmin = (id) => {
    if (!window.confirm("¿Eliminar paquete del sistema?")) return;
    setPaquetes(paquetes.filter(p => p.id !== id)); notificar("Paquete eliminado", "exito");
  };

  const cargarPaqueteParaEdicionAdmin = (paquete) => {
    setAdminEditandoPaqId(paquete.id); setAdminPaqTitulo(paquete.titulo); setAdminPaqPrecio(paquete.precio); setAdminPaqDesc(paquete.descripcion); setAdminPaqImagen(paquete.imagen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const guardarEdicionPaqueteAdmin = (e) => {
    e.preventDefault();
    const actualizados = paquetes.map(p => p.id === adminEditandoPaqId ? { ...p, titulo: adminPaqTitulo, precio: parseFloat(adminPaqPrecio), descripcion: adminPaqDesc, imagen: adminPaqImagen || p.imagen } : p);
    setPaquetes(actualizados); setAdminEditandoPaqId(null); notificar("Cambios guardados", "exito");
  };

  // --- NUEVAS ACCIONES: PEDIDOS ---
  // Acción del Cliente
  const solicitarPedido = (paquete) => {
    const nuevoPedido = {
      id: Date.now(),
      paqueteId: paquete.id,
      paqueteTitulo: paquete.titulo,
      precio: paquete.precio,
      clienteEmail: usuarioActual.email,
      clienteNombre: usuarioActual.nombre,
      estado: "pendiente",
      fecha: new Date().toLocaleDateString()
    };
    setPedidos([nuevoPedido, ...pedidos]);
    notificar("¡Solicitud enviada! Espera la aprobación del Super Admin.", "exito");
  };

  // Acción del Super Admin
  const cambiarEstadoPedido = (id, nuevoEstado) => {
    const actualizados = pedidos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p);
    setPedidos(actualizados);
    notificar(`Pedido ${nuevoEstado === 'aprobado' ? 'aprobado exitosamente' : 'rechazado'}`, "exito");
  };

  // --- ACCIONES CREADOR DE PAQUETES ---
  const handleGuardarPaquete = (e) => {
    e.preventDefault();
    if (subiendoFoto) return notificar("Espera a que suba la foto", "error");

    const imgPorDefecto = "https://placehold.co/500x300?text=Sin+Imagen";

    if (editandoPaqId) {
      const actualizados = paquetes.map(p => p.id === editandoPaqId ? { ...p, titulo: nuevoPaqTitulo, precio: parseFloat(nuevoPaqPrecio), descripcion: nuevoPaqDesc, imagen: nuevoPaqImagen || p.imagen || imgPorDefecto, estado: "pendiente" } : p);
      setPaquetes(actualizados); notificar("Paquete enviado a revisión", "exito"); setEditandoPaqId(null);
    } else {
      setPaquetes([{ id: Date.now(), titulo: nuevoPaqTitulo, precio: parseFloat(nuevoPaqPrecio), descripcion: nuevoPaqDesc, imagen: nuevoPaqImagen || imgPorDefecto, creador: usuarioActual.email, estado: "pendiente" }, ...paquetes]);
      notificar("Paquete enviado a revisión", "exito");
    }
    setNuevoPaqTitulo(""); setNuevoPaqPrecio(""); setNuevoPaqDesc(""); setNuevoPaqImagen("");
  };

  const cargarPaqueteParaEdicionCreador = (paquete) => {
    setEditandoPaqId(paquete.id); setNuevoPaqTitulo(paquete.titulo); setNuevoPaqPrecio(paquete.precio); setNuevoPaqDesc(paquete.descripcion); setNuevoPaqImagen(paquete.imagen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // VISTAS DE AUTENTICACIÓN
  // ==========================================
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
              <div className="encabezado-login"><h2>{tabAuth === "superadmin" ? "Panel Maestro" : "Iniciar Sesión"}</h2><p>{tabAuth === "superadmin" ? "Control total del sistema" : "Ingresa tus credenciales"}</p></div>
              <form onSubmit={iniciarSesion} className="formulario">
                <div className="campo"><label>Usuario / Correo</label><input type="text" required value={authEmailUser} onChange={(e) => setAuthEmailUser(e.target.value)} /></div>
                <div className="campo"><label>Contraseña</label><input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></div>
                {tabAuth !== "superadmin" && (<div className="campo-recaptcha"><ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} onChange={(val) => setCaptchaToken(val)} /></div>)}
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
                      <div><strong>Admin. de Productos</strong><span>Sube paquetes (Requiere aprobación)</span></div>
                    </label>
                    <label className={`opcion-rol ${regRol === "cliente" ? "seleccionado" : ""}`}>
                      <input type="radio" name="rol" value="cliente" checked={regRol === "cliente"} onChange={() => setRegRol("cliente")} />
                      <div><strong>Cliente</strong><span>Compra paquetes directamente</span></div>
                    </label>
                  </div>
                </div>
                <div className="campo-recaptcha"><ReCAPTCHA sitekey={RECAPTCHA_SITE_KEY} onChange={(val) => setCaptchaToken(val)} /></div>
                <button type="submit" className="btn btn-primario">Registrarse</button>
              </form>
            </div>
          )}
        </div>
        <style>{estilosCSS}</style>
      </div>
    );
  }

  // ==========================================
  // DASHBOARDS PRINCIPALES
  // ==========================================
  return (
    <div className="contenedor-app">
      <header className="encabezado-admin">
        <div>
          <h1>
            {usuarioActual.rol === "superadmin" && "Panel de Control Maestro"}
            {usuarioActual.rol === "creador" && "Panel del Gestor de Paquetes"}
            {usuarioActual.rol === "cliente" && "Portal del Cliente"}
          </h1>
          <p>Usuario: <strong>{usuarioActual.nombre}</strong> &bull; <span className={`badge-rol badge-${usuarioActual.rol}`}>{usuarioActual.rol.toUpperCase()}</span></p>
        </div>
        <button onClick={cerrarSesion} className="btn-logout">Cerrar Sesión</button>
      </header>

      {mensaje && <div className={`alerta alerta-${mensaje.tipo}`}>{mensaje.texto}</div>}

      {/* 1. VISTA SUPER ADMIN */}
      {usuarioActual.rol === "superadmin" && (
        <div className="contenedor-superadmin">
          
          {/* NUEVA SECCIÓN: Aprobación de Pedidos */}
          <section className="tarjeta seccion-espaciada" style={{ borderTop: "4px solid #10b981" }}>
            <div className="tabla-header">
              <h2>Aprobación de Compras (Pedidos de Clientes)</h2>
              <span className="badge-contador">{pedidos.filter((p) => p.estado === "pendiente").length} pendientes</span>
            </div>
            <div className="contenedor-tabla">
              <table className="tabla">
                <thead><tr><th>Fecha</th><th>Cliente</th><th>Paquete Solicitado</th><th>Monto</th><th>Estado</th><th style={{ textAlign: "right" }}>Decisión</th></tr></thead>
                <tbody>
                  {pedidos.length === 0 ? <tr><td colSpan="6" className="mensaje-vacio">No hay pedidos registrados.</td></tr> : null}
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td style={{fontSize:"12px"}}>{pedido.fecha}</td>
                      <td><strong>{pedido.clienteNombre}</strong><br/><span style={{fontSize:"11px", color:"#6b7280"}}>{pedido.clienteEmail}</span></td>
                      <td>{pedido.paqueteTitulo}</td>
                      <td style={{fontWeight:"bold", color:"#059669"}}>${pedido.precio}</td>
                      <td><span className={`badge-estado badge-estado-${pedido.estado}`}>{pedido.estado}</span></td>
                      <td style={{ textAlign: "right", minWidth: "180px" }}>
                        {pedido.estado !== "aprobado" && <button onClick={() => cambiarEstadoPedido(pedido.id, "aprobado")} className="btn-accion btn-aprobar">Aprobar Venta</button>}
                        {pedido.estado !== "rechazado" && <button onClick={() => cambiarEstadoPedido(pedido.id, "rechazado")} className="btn-accion btn-peligro-suave">Rechazar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Formulario Edición Paquetes */}
          {adminEditandoPaqId && (
            <section className="tarjeta seccion-espaciada" style={{ border: "2px solid #3b82f6" }}>
              <h2>Edición Rápida de Paquete (Super Admin)</h2>
              <form onSubmit={guardarEdicionPaqueteAdmin} className="formulario" style={{ marginTop: "16px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <div className="campo" style={{ flex: 2 }}><label>Título</label><input type="text" required value={adminPaqTitulo} onChange={(e) => setAdminPaqTitulo(e.target.value)} /></div>
                  <div className="campo" style={{ flex: 1 }}><label>Precio</label><input type="number" required value={adminPaqPrecio} onChange={(e) => setAdminPaqPrecio(e.target.value)} /></div>
                </div>
                <div className="campo"><label>Descripción</label><input type="text" required value={adminPaqDesc} onChange={(e) => setAdminPaqDesc(e.target.value)} /></div>
                <div className="campo"><label>Nueva Foto (URL)</label><input type="url" value={adminPaqImagen.startsWith("data:") ? "" : adminPaqImagen} onChange={(e) => setAdminPaqImagen(e.target.value)} /></div>
                <div className="acciones-form">
                  <button type="submit" className="btn btn-primario">Guardar Cambios</button>
                  <button type="button" className="btn btn-secundario" onClick={() => setAdminEditandoPaqId(null)}>Cancelar</button>
                </div>
              </form>
            </section>
          )}

          {/* Gestión de Paquetes */}
          <section className="tarjeta seccion-espaciada">
            <div className="tabla-header">
              <h2>Aprobación de Paquetes (Creadores)</h2>
              <span className="badge-contador">{paquetes.filter((p) => p.estado === "pendiente").length} pendientes</span>
            </div>
            <div className="contenedor-tabla">
              <table className="tabla">
                <thead><tr><th>Foto</th><th>Paquete / Creador</th><th>Estado</th><th style={{ textAlign: "right" }}>Acciones Admin</th></tr></thead>
                <tbody>
                  {paquetes.map((p) => (
                    <tr key={p.id} style={p.id === adminEditandoPaqId ? {background: "#eff6ff"} : {}}>
                      <td><img src={p.imagen} alt={p.titulo} className="miniatura-tabla" /></td>
                      <td><strong>{p.titulo}</strong> <span style={{color:"#2563eb", fontWeight:"bold"}}>${p.precio}</span><p style={{ fontSize: "11px", color: "#6b7280" }}>Por: {p.creador}</p></td>
                      <td><span className={`badge-estado badge-estado-${p.estado}`}>{p.estado}</span></td>
                      <td style={{ textAlign: "right", minWidth: "220px" }}>
                        {p.estado !== "aprobado" && <button onClick={() => cambiarEstadoPaquete(p.id, "aprobado")} className="btn-accion btn-aprobar">Aprobar</button>}
                        {p.estado !== "rechazado" && <button onClick={() => cambiarEstadoPaquete(p.id, "rechazado")} className="btn-accion btn-peligro-suave">Rechazar</button>}
                        <button onClick={() => cargarPaqueteParaEdicionAdmin(p)} className="btn-accion btn-editar" style={{marginLeft: "10px"}}>Editar</button>
                        <button onClick={() => eliminarPaqueteAdmin(p.id)} className="btn-accion btn-eliminar">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Usuarios */}
          <div className="grid-principal">
            <section className="tarjeta">
              <h2>{editandoId ? "Editar Usuario" : "Crear Usuario Directo"}</h2>
              <form onSubmit={guardarUsuarioSuperAdmin} className="formulario" style={{ marginTop: "16px" }}>
                <div className="campo"><label>Nombre</label><input type="text" required value={adminNombre} onChange={(e) => setAdminNombre(e.target.value)} /></div>
                <div className="campo"><label>Email</label><input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} /></div>
                <div className="campo"><label>Rol</label><select className="input-select" value={adminRol} onChange={(e) => setAdminRol(e.target.value)}><option value="cliente">Cliente</option><option value="creador">Creador</option></select></div>
                <div className="campo"><label>Contraseña {editandoId && "(Vacío para conservar)"}</label><input type="password" required={!editandoId} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} /></div>
                <div className="acciones-form">
                  <button type="submit" className="btn btn-primario">{editandoId ? "Actualizar" : "Registrar Aprobado"}</button>
                  {editandoId && <button type="button" className="btn btn-secundario" onClick={() => setEditandoId(null)}>Cancelar</button>}
                </div>
              </form>
            </section>

            <section className="tarjeta">
              <div className="tabla-header"><h2>Cuentas Registradas</h2></div>
              <div className="contenedor-tabla">
                <table className="tabla">
                  <thead><tr><th>Usuario</th><th>Rol</th><th>Estado</th><th style={{ textAlign: "right" }}>Acciones</th></tr></thead>
                  <tbody>
                    {usuarios.map((u) => {
                      const id = u.id || u._id;
                      const esPendiente = u.estadoCuenta === "pendiente";
                      return (
                        <tr key={id} style={esPendiente ? {background: "#fffbeb"} : {}}>
                          <td><strong>{u.nombre}</strong><br/><span style={{fontSize:"11px", color:"#6b7280"}}>{u.email}</span></td>
                          <td><span className={`badge-rol badge-${u.rol || "cliente"}`}>{u.rol || "cliente"}</span></td>
                          <td><span className={`badge-estado badge-estado-${u.estadoCuenta || "aprobado"}`}>{u.estadoCuenta || "aprobado"}</span></td>
                          <td style={{ textAlign: "right" }}>
                            {esPendiente && <button className="btn-accion btn-aprobar" onClick={() => aprobarCuentaAdmin(id)}>✔ Aprobar</button>}
                            <button className="btn-accion btn-editar" onClick={() => { setEditandoId(id); setAdminNombre(u.nombre); setAdminEmail(u.email); setAdminRol(u.rol || "cliente"); }}>✏️</button>
                            <button className="btn-accion btn-eliminar" onClick={() => eliminarUsuario(id)}>🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* 2. VISTA CREADOR */}
      {usuarioActual.rol === "creador" && (
        <div className="grid-principal">
          <section className="tarjeta">
            <h2>{editandoPaqId ? "Editar Paquete" : "Subir Nuevo Paquete"}</h2>
            <form onSubmit={handleGuardarPaquete} className="formulario">
              <div className="campo"><label>Título</label><input type="text" required value={nuevoPaqTitulo} onChange={(e) => setNuevoPaqTitulo(e.target.value)} /></div>
              <div className="campo"><label>Precio (USD)</label><input type="number" required value={nuevoPaqPrecio} onChange={(e) => setNuevoPaqPrecio(e.target.value)} /></div>
              <div className="campo">
                <label>Foto</label>
                <input type="file" accept="image/*" onChange={(e) => procesarImagenLocal(e, setNuevoPaqImagen)} className="input-file" />
                <input type="url" placeholder="O escribe URL de la foto" value={nuevoPaqImagen.startsWith("data:") ? "" : nuevoPaqImagen} onChange={(e) => setNuevoPaqImagen(e.target.value)} disabled={subiendoFoto} />
                {nuevoPaqImagen && (<div className="preview-foto-box"><img src={nuevoPaqImagen} alt="Preview" className="preview-foto" /><button type="button" onClick={() => setNuevoPaqImagen("")} className="btn-quitar-foto">Eliminar</button></div>)}
              </div>
              <div className="campo"><label>Descripción</label><input type="text" required value={nuevoPaqDesc} onChange={(e) => setNuevoPaqDesc(e.target.value)} /></div>
              <div className="acciones-form">
                <button type="submit" className="btn btn-primario" disabled={subiendoFoto}>{subiendoFoto ? "Cargando..." : editandoPaqId ? "Guardar" : "Enviar a Revisión"}</button>
                {editandoPaqId && <button type="button" className="btn btn-secundario" onClick={() => { setEditandoPaqId(null); setNuevoPaqTitulo(""); setNuevoPaqPrecio(""); setNuevoPaqDesc(""); setNuevoPaqImagen(""); }}>Cancelar</button>}
              </div>
            </form>
          </section>

          <section className="tarjeta">
            <h2>Mis Paquetes Subidos</h2>
            <div className="contenedor-tabla">
              <table className="tabla">
                <thead><tr><th>Foto</th><th>Título</th><th>Estado</th><th style={{textAlign:"right"}}>Acciones</th></tr></thead>
                <tbody>
                  {paquetes.filter((p) => p.creador === usuarioActual.email).map((p) => (
                    <tr key={p.id}>
                      <td><img src={p.imagen} alt={p.titulo} className="miniatura-tabla" /></td>
                      <td>{p.titulo} <br/><span style={{fontSize: "11px", color: "#6b7280"}}>${p.precio} USD</span></td>
                      <td><span className={`badge-estado badge-estado-${p.estado}`}>{p.estado}</span></td>
                      <td style={{textAlign:"right"}}><button className="btn-accion btn-editar" onClick={() => cargarPaqueteParaEdicionCreador(p)}>Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* 3. VISTA CLIENTE (CATÁLOGO Y PEDIDOS) */}
      {usuarioActual.rol === "cliente" && (
        <>
          {/* Historial de Compras del Cliente */}
          <section className="tarjeta seccion-espaciada" style={{background: "#f8fafc"}}>
            <div className="tabla-header">
              <h2>Mis Solicitudes de Paquetes</h2>
            </div>
            <div className="contenedor-tabla">
              <table className="tabla">
                <thead><tr><th>Fecha</th><th>Paquete</th><th>Precio</th><th>Estado de Compra</th></tr></thead>
                <tbody>
                  {pedidos.filter(p => p.clienteEmail === usuarioActual.email).length === 0 ? 
                    <tr><td colSpan="4" className="mensaje-vacio">Aún no has solicitado ningún paquete.</td></tr> : null}
                  {pedidos.filter(p => p.clienteEmail === usuarioActual.email).map(pedido => (
                    <tr key={pedido.id}>
                      <td style={{fontSize:"12px", color: "#6b7280"}}>{pedido.fecha}</td>
                      <td><strong>{pedido.paqueteTitulo}</strong></td>
                      <td style={{fontWeight: "bold", color: "#059669"}}>${pedido.precio} USD</td>
                      <td><span className={`badge-estado badge-estado-${pedido.estado}`}>{pedido.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Catálogo de Productos */}
          <section className="tarjeta">
            <h2>Catálogo de Paquetes Disponibles</h2>
            <p className="subtitulo">Explora y solicita tus próximos destinos.</p>
            <div className="catalogo-grid">
              {paquetes.filter((p) => p.estado === "aprobado").length === 0 ? (
                <p className="mensaje-vacio">No hay paquetes aprobados en este momento.</p>
              ) : (
                paquetes.filter((p) => p.estado === "aprobado").map((p) => (
                  <div key={p.id} className="tarjeta-paquete">
                    <div className="contenedor-img-paquete">
                      <img src={p.imagen} alt={p.titulo} className="img-paquete" />
                      <span className="tag-disponible">Disponible</span>
                    </div>
                    <div className="cuerpo-paquete">
                      <h3>{p.titulo}</h3>
                      <p className="desc-paquete">{p.descripcion}</p>
                      <div className="pie-paquete">
                        <span className="precio-paquete">${p.precio} USD</span>
                        {/* BOTÓN SOLICITAR PARA EL CLIENTE */}
                        <button className="btn btn-primario" onClick={() => solicitarPedido(p)}>Solicitar</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      <style>{estilosCSS}</style>
    </div>
  );
}

// ==========================================
// ESTILOS CSS
// ==========================================
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
  .encabezado-login p { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .selector-rol { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
  .opcion-rol { display: flex; align-items: flex-start; gap: 10px; padding: 10px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; font-size: 13px; }
  .opcion-rol.seleccionado { border-color: #2563eb; background: #f0f7ff; }
  .opcion-rol input { margin-top: 3px; }
  .opcion-rol div { display: flex; flex-direction: column; }
  .opcion-rol span { color: #6b7280; font-size: 11px; }
  .campo-recaptcha { display: flex; justify-content: center; margin-top: 10px; margin-bottom: 6px; }
  .contenedor-app { max-width: 1100px; margin: 40px auto; padding: 0 20px; }
  .encabezado-admin { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .btn-logout { background: #fff; border: 1px solid #d1d5db; color: #374151; padding: 8px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; }
  .btn-logout:hover { background: #fee2e2; color: #991b1b; }
  .alerta { padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
  .alerta-exito { background: #def7ec; color: #03543f; }
  .alerta-error { background: #fde8e8; color: #9b1c1c; }
  .seccion-espaciada { margin-bottom: 24px; }
  .grid-principal { display: grid; grid-template-columns: 360px 1fr; gap: 24px; }
  @media (max-width: 850px) { .grid-principal { grid-template-columns: 1fr; } }
  .formulario { display: flex; flex-direction: column; gap: 14px; }
  .campo { display: flex; flex-direction: column; gap: 4px; }
  .campo label { font-size: 13px; font-weight: 600; color: #374151; }
  .campo input, .input-select { padding: 10px 12px; border-radius: 6px; border: 1px solid #d1d5db; font-size: 14px; outline: none; }
  .input-file { padding: 6px 0 !important; border: none !important; }
  .preview-foto-box { margin-top: 6px; display: flex; align-items: center; gap: 10px; }
  .preview-foto { width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db; }
  .btn-quitar-foto { background: none; border: none; color: #dc2626; font-size: 12px; cursor: pointer; text-decoration: underline; }
  .miniatura-tabla { width: 60px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid #e5e7eb; background: #f9fafb; }
  .acciones-form { display: flex; gap: 10px; margin-top: 6px; }
  .btn { padding: 10px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; flex: 1; }
  .btn-primario { background: #2563eb; color: white; }
  .btn-peligro { background: #dc2626; color: white; }
  .btn-secundario { background: #e5e7eb; color: #374151; }
  .badge-rol { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; }
  .badge-superadmin { background: #fee2e2; color: #991b1b; }
  .badge-creador { background: #fef3c7; color: #92400e; }
  .badge-cliente { background: #e0e7ff; color: #3730a3; }
  .badge-estado { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize; display: inline-block; }
  .badge-estado-aprobado { background: #def7ec; color: #03543f; }
  .badge-estado-pendiente { background: #fef3c7; color: #92400e; }
  .badge-estado-rechazado { background: #fee2e2; color: #991b1b; }
  .contenedor-tabla { overflow-x: auto; }
  .tabla { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
  .tabla th { background: #f9fafb; padding: 10px; text-align: left; font-size: 12px; color: #6b7280; }
  .tabla td { padding: 12px 10px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
  .btn-accion { padding: 6px 10px; border-radius: 5px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; margin-left: 6px; margin-bottom: 4px; display: inline-block; }
  .btn-aprobar { background: #def7ec; color: #03543f; }
  .btn-peligro-suave { background: #fca5a5; color: #7f1d1d; }
  .btn-editar { background: #fef3c7; color: #92400e; }
  .btn-eliminar { background: #fee2e2; color: #991b1b; }
  .catalogo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; margin-top: 16px; }
  .tarjeta-paquete { border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
  .contenedor-img-paquete { position: relative; width: 100%; height: 160px; background: #f3f4f6; }
  .img-paquete { width: 100%; height: 100%; object-fit: cover; }
  .cuerpo-paquete { padding: 16px; display: flex; flex-direction: column; flex: 1; justify-content: space-between; }
  .desc-paquete { font-size: 13px; color: #6b7280; margin: 8px 0; }
  .tag-disponible { position: absolute; top: 10px; right: 10px; background: rgba(3, 84, 63, 0.9); color: #fff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; }
  .precio-paquete { font-size: 18px; font-weight: 700; color: #111827; }
  .pie-paquete { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
  .mensaje-vacio { text-align: center; color: #9ca3af; padding: 36px 0; font-size: 14px; width: 100%; grid-column: 1 / -1; }
`;