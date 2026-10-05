const iniciarSesion = async (e) => {
    e.preventDefault();
    if (!captchaToken && tabAuth !== "superadmin") {
      notificar("Completa el captcha de seguridad.", "error"); return;
    }

    try {
      // VALIDACIÓN ESTRICTA: Obligamos al frontend a consultar tu backend y webdb
      const res = await fetch(API_USUARIOS);
      if (!res.ok) throw new Error("Fallo en la respuesta del servidor");
      
      const data = await res.json();
      const usuariosApi = Array.isArray(data) ? data : data.usuarios || [];

      // Si la BD responde, evaluamos el login
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

      // Validación de usuarios normales 100% desde la BD
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
      // SI WEBDB ESTÁ APAGADA, SE CORTA EL ACCESO AQUÍ:
      notificar("ERROR CRÍTICO: No hay conexión con la Base de Datos o el Servidor.", "error");
    }
  };