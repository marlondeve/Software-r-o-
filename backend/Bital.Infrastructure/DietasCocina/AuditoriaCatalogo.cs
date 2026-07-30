namespace Bital.Infrastructure.DietasCocina;

public static class AuditoriaCatalogo
{
    public static class Modulos
    {
        public const string Dietas = "Dietas";
        public const string Catalogo = "Catalogo";
        public const string Ordenes = "Ordenes";
        public const string Etiquetas = "Etiquetas";
        public const string Conciliacion = "Conciliacion";
        public const string Parametros = "Parametros";
        public const string Usuarios = "Usuarios";
        public const string Roles = "Roles";
    }

    public static class Resultados
    {
        public const string Exitoso = "Exitoso";
        public const string Fallido = "Fallido";
    }

    public static class Acciones
    {
        public const string Solicitar = "Solicitar";
        public const string Confirmar = "Confirmar";
        public const string ConfirmarMasivo = "ConfirmarMasivo";
        public const string Cancelar = "Cancelar";
        public const string Novedad = "Novedad";
        public const string Crear = "Crear";
        public const string Actualizar = "Actualizar";
        public const string Desactivar = "Desactivar";
        public const string RegistrarTarifa = "RegistrarTarifa";
        public const string ActualizarEstado = "ActualizarEstado";
        public const string ActualizarChecklist = "ActualizarChecklist";
        public const string Generar = "Generar";
        public const string Imprimir = "Imprimir";
        public const string Reimprimir = "Reimprimir";
        public const string PreEntrega = "PreEntrega";
        public const string Entrega = "Entrega";
        public const string Devolucion = "Devolucion";
        public const string MarcarConciliado = "MarcarConciliado";
        public const string MarcarPendiente = "MarcarPendiente";
        public const string SubirFactura = "SubirFactura";
        public const string ActualizarTiempos = "ActualizarTiempos";
        public const string ActualizarCategoriasEdad = "ActualizarCategoriasEdad";
        public const string Editar = "Editar";
        public const string CambiarRol = "CambiarRol";
        public const string CambiarEstado = "CambiarEstado";
        public const string RestablecerClave = "RestablecerClave";
        public const string CambiarClave = "CambiarClave";
        public const string Login = "Login";
        public const string Renombrar = "Renombrar";
        public const string ActualizarPermisos = "ActualizarPermisos";
        public const string Eliminar = "Eliminar";
    }

    public static class Entidades
    {
        public const string FilaDieta = "FilaDieta";
        public const string DietaCatalogo = "DietaCatalogo";
        public const string TarifaDieta = "TarifaDieta";
        public const string OrdenCocina = "OrdenCocina";
        public const string EtiquetaEnfermera = "EtiquetaEnfermera";
        public const string FilaConciliacion = "FilaConciliacion";
        public const string ParametroOperativo = "ParametroOperativo";
        public const string UsuarioModulo = "UsuarioModulo";
        public const string RolModulo = "RolModulo";
    }
}
