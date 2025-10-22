const User = require('../models/User')
const Reemplazo = require ('../models/Reemplazo')
const jwt = require('jsonwebtoken')
const Option = require ('../models/OpcionesComboBox')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cron = require('node-cron');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'zuri.app01@gmail.com',
    pass: 'password2023!'
  }
});

// FUNCION PARA REGISTRO DE USUARIOS
async function register(req, res) {
  const {
    rut,
    nombre,
    apellido,
    fecha_nac,
    direccion,
    telefono,
    email,
    ciudad,
    tipo_cargo,
  } = req.body;

  console.log(req.body)

  try {
    const [rutExists, telefonoExist, emailExist] = await Promise.all([
      User.exists({ rut }).exec(),
      User.exists({ telefono }).exec(),
      User.exists({ email }).exec(),
    ]);

    if (rutExists || telefonoExist || emailExist) {
      return res.sendStatus(409);
    }
  } catch (error) {
    return res.status(500).send("Error en el servidor");
  }
  const generarPassword = crypto.randomBytes(3).toString("hex");
  console.log(generarPassword)
  const hashedPassword = await bcrypt.hash(generarPassword, 10);
  try {
    let NuevoUsuario = {
      rut,
      nombre,
      apellido,
      fecha_nac,
      direccion,
      telefono,
      email,
      ciudad,
      tipo_cargo,
      password: hashedPassword,
    };

    if (tipo_cargo === 'TENS') {
      NuevoUsuario.habilitado = req.body.habilitado; 
    } else if (tipo_cargo === 'JEFA SERVICIO') {
      NuevoUsuario.servicio = req.body.servicio; 
    }

    NuevoUsuario.password = hashedPassword;
    await User.create(NuevoUsuario);

    const mailOptions = {
      from: "zuri.app01@gmail.com",
      to: email,
      subject: "Contraseña generada automáticamente",
      text: `¡Hola ${nombre}! Tu contraseña generada automáticamente es: ${generarPassword}. Recuerda cambiarla después de iniciar sesión.`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Correo enviado: " + info.response);
      }
    });

    return res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ mensaje: "No se pudo registrar" });
  }
}


//FUNCION PARA REGISTRO DE REEMPLAZOS Y TURNOS
async function registerReemplazo(req, res){
  const {id_saliente, rut_saliente, nombre_saliente, apellido_saliente, id_entrante, rut_entrante, nombre_entrante, apellido_entrante,
        tipo_turno, fecha_inicio, fecha_termino, servicio} = req.body

  try {
    await Reemplazo.create({id_saliente, rut_saliente, nombre_saliente, apellido_saliente, id_entrante ,rut_entrante, nombre_entrante, apellido_entrante,
      tipo_turno, fecha_inicio, fecha_termino, servicio})

    return res.sendStatus(201)
  } catch (error) {
    console.log(error)
    return res.status(400).json({mensaje: "No se pudo registrar"})
    
  }
}

// FUNCION PARA MOSTRAR REEMPLAZOS CON FILTROS
async function mostrarReemplazos(req, res) {
  try {
    const datos = await Reemplazo.find({ eliminado: false, activo: true });
    res.json(datos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

// FUNCION PARA MOSTRAR HISTORIAL
async function mostrarHistorial(req, res) {
  try {
    const datos = await Reemplazo.find({ eliminado: false, activo: false });
    res.json(datos);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

//TAREA PARA EJECUCION DIARIA, ACTUALIZACION DE LOS DOCUMENTOS CUANDO FECHA ACTUAL > FECHA TERMINO 00:01
cron.schedule('1 0 * * *', async () => {
  try {
    const fechaActual = new Date();
    await Reemplazo.updateMany(
      { fecha_termino: { $lt: fechaActual }, activo: true },
      { $set: { activo: false } }
    );
    console.log('Tarea programada ejecutada con éxito');
  } catch (error) {
    console.error('Error al ejecutar la tarea programada:', error);
    // Manejo de errores
  }
});

//FUNCION PARA MOSTRAR USUARIOS "TENS"
async function mostrarUsuarios(req, res){
  try {
    const usuariosEnfermeros = await User.find({ tipo_cargo: 'TENS' });
    res.json(usuariosEnfermeros);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

//FUNCION PARA MOSTRAR TODOS LOS USUARIOS
async function mostrarTodos(req, res){
  try {
    const usuarios = await User.find({eliminado:false});
    res.json(usuarios);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

//FUNCION PARA ELIMINAR REEMPLAZO
async function eliminarReemplazo(req, res) {
  const reemplazoId = req.params.id; // Obtener el ID del parámetro de la URL

  try {
    const reemplazo = await Reemplazo.findByIdAndUpdate(
      reemplazoId,
      { eliminado: true , activo: false },
      { new: true }
    );

    if (!reemplazo) {
      return res.status(404).json({ mensaje: 'Reemplazo no encontrado' });
    }

    const datos = await Reemplazo.find({ eliminado: { $ne: true } }); // Obtener solo los documentos no eliminados
    res.json(datos);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

//FUNCION PARA ELIMINAR UN USUARIO
async function eliminarUsuario(req, res) {
  const usuarioId = req.params.id; // Obtener el ID del parámetro de la URL

  try {
    const usuario = await User.findByIdAndUpdate(
      usuarioId,
      { eliminado: true },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const datos = await User.find({ eliminado: { $ne: true } });
    res.json(datos);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

//FUNCION PARA ACTUALIZAR REEMPLAZO
async function actualizarReemplazo(req, res) {
  const reemplazoId = req.params.id;
  const {rut_saliente, nombre_saliente, apellido_saliente, rut_entrante, nombre_entrante, apellido_entrante,
    tipo_turno, fecha_inicio, fecha_termino, servicio} = req.body

  try {
    const reemplazoActualizado = await Reemplazo.findByIdAndUpdate(reemplazoId,{rut_saliente, nombre_saliente, apellido_saliente, rut_entrante, nombre_entrante, apellido_entrante,
      tipo_turno, fecha_inicio, fecha_termino, servicio},{new:true});

    if (!reemplazoActualizado) {
      return res.status(404).json({ mensaje: 'Reemplazo no encontrado' });
    }
    const datos = await Reemplazo.find();
    res.json(datos);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

async function actualizarUsuario(req, res) {
  const usuarioId = req.params.id;
  const {rut, nombre, apellido, fecha_nac, direccion, telefono,
    email, ciudad, habilitado, tipo_cargo} = req.body

  try {
    const usuarioActualizado = await User.findByIdAndUpdate(usuarioId,{rut, nombre, apellido, fecha_nac, direccion, telefono,
      email, ciudad, habilitado, tipo_cargo},{new:true});

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    const datos = await User.find({eliminado:false});
    res.json(datos);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ mensaje: error });
  }
}

//FUNCION PARA MOSTRAR SERVICIOS EN COMBOBOX
async function mostrarServicios(req, res) {
  try {
    const servicios = await Option.findOne({ nombre: "SERVICIOS" }, 'opciones');
    if (!servicios) {
      return res.status(404).json({ mensaje: 'No se encontraron servicios' });
    }
    res.json(servicios.opciones);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al obtener servicios' });
  }
}

//FUNCION PARA MOSTRAR TIPO DE TURNOS EN COMBOBOX
async function mostrarTipoTurnos(req, res) {
    try {
      const tipoTurno = await Option.findOne({ nombre: "TIPO_TURNO" }, 'opciones');
      if (!tipoTurno) {
        return res.status(404).json({ mensaje: 'No se encontraron servicios' });
      }
      res.json(tipoTurno.opciones);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ mensaje: 'Error al obtener servicios' });
    }
  }

  //FUNCION PARA MOSTRAR TIPO DE CARGOS EN COMBOBOX
async function mostrarTipoCargo(req, res) {
  try {
    const tipoCargo = await Option.findOne({ nombre: "TIPO_CARGO" }, 'opciones');
    if (!tipoCargo) {
      return res.status(404).json({ mensaje: 'No se encontraron cargos' });
    }
    res.json(tipoCargo.opciones);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: 'Error al obtener cargos' });
  }
}

  //FUNCION PARA MOSTRAR HABILITADO EN COMBOBOX
  async function mostrarHabilitado(req, res) {
    try {
      const habilitado = await Option.findOne({ nombre: "HABILITADO" }, 'opciones');
      if (!habilitado) {
        return res.status(404).json({ mensaje: 'No se encontraron servicios' });
      }
      res.json(habilitado.opciones);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ mensaje: 'Error al obtener servicios' });
    }
  }

//FUNCION PARA INICIAR SESION
async function login(req, res){
  const {rut, password } = req.body
  console.log("login intent", {rut, password })
  if(!rut || !password) return res.status(422).json({'mensaje': 'Campos Invalidos'})
  
  const user = await User.findOne({rut}).exec()
  if(!user) return res.status(401).json({mensaje: "Rut incorrecto"})

  const match = await bcrypt.compare(password, user.password)
  if(!match) return res.status(401).json({mensaje: "Contraseña incorrecta"})

  const accessToken = jwt.sign(
    {
      id: user.id
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '1800s'
    }
  )

  const refreshToken = jwt.sign(
    {
      id: user.id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '1d'
    }
  )

  user.refresh_token = refreshToken
  await user.save()

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true, 
    sameSite: 'Lax',  //SOLO DEV
    secure: false, //SOLO DEV
    maxAge: 24*60*60*1000})
  res.json({access_token: accessToken})
}


//FUNCION PARA CERRAR SESION
async function logout(req, res){
  const cookies = req.cookies

  if(!cookies.refresh_token) return res.sendStatus(204)

  const refreshToken = cookies.refresh_token
  const user = await User.findOne({refresh_token: refreshToken}).exec()

  if(!user){
    res.clearCookie('refresh_token', {httpOnly: true, sameSite: 'None', secure: true})
    return res.sendStatus(204)
  }

  user.refresh_token = null
  await user.save()

  res.clearCookie('refresh_token', {httpOnly: true, sameSite: 'None', secure: true})
  res.sendStatus(204)
}




async function refresh(req, res){
  const cookies = req.cookies
  if(!cookies.refresh_token) return res.sendStatus(401)

  const refreshToken = cookies.refresh_token

  const user = await User.findOne({refresh_token: refreshToken}).exec()

  if(!user) return res.sendStatus(403)

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
      if(err || user.id !== decoded.id) return res.sendStatus(403)

      const accessToken = jwt.sign(
        { id: decoded.id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1800s' }
      )

      res.json({access_token: accessToken})
    }
  )
}


async function user(req, res){
  
  const user = req.user

  return res.status(200).json(user)
}

module.exports = {register, registerReemplazo, login, logout, refresh, user, mostrarReemplazos, eliminarReemplazo, actualizarReemplazo,
  mostrarServicios, mostrarTipoTurnos, mostrarUsuarios, mostrarHistorial, eliminarUsuario, mostrarTodos, actualizarUsuario, mostrarTipoCargo,
  mostrarHabilitado}

