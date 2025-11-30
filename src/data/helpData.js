export const categories = [
    { id: 'general', name: 'General' },
    { id: 'cuenta', name: 'Mi Cuenta' },
    { id: 'comprar', name: 'Comprar' },
    { id: 'vender', name: 'Vender' },
    { id: 'seguridad', name: 'Seguridad' },
];

export const articles = [
    {
        id: 1,
        slug: 'como-crear-una-cuenta',
        title: 'Cómo crear una cuenta en Vecivendo',
        category: 'cuenta',
        excerpt: 'Aprende paso a paso cómo registrarte en nuestra plataforma para empezar a comprar y vender en tu comunidad.',
        content: `
### Pasos para crear tu cuenta

1. **Accede a la página de registro**: Haz clic en el botón "Registrarse" ubicado en la esquina superior derecha de la página de inicio.
2. **Completa el formulario**: Ingresa tu nombre completo, correo electrónico y crea una contraseña segura.
3. **Verifica tu número de teléfono**: Te enviaremos un código SMS para verificar que eres un usuario real.
4. **Selecciona tu residencial**: Elige el residencial donde vives para conectarte con tus vecinos.
5. **Confirma tu correo**: Revisa tu bandeja de entrada y haz clic en el enlace de confirmación.

¡Listo! Ya eres parte de Vecivendo.
    `
    },
    {
        id: 2,
        slug: 'como-recuperar-contrasena',
        title: 'Cómo recuperar tu contraseña',
        category: 'cuenta',
        excerpt: 'Si olvidaste tu contraseña, sigue estos pasos para restablecerla y recuperar el acceso a tu cuenta.',
        content: `
### Pasos para restablecer tu contraseña

1. **Ve a Iniciar Sesión**: En la pantalla de inicio de sesión, haz clic en el enlace "¿Olvidaste tu contraseña?".
2. **Ingresa tu correo**: Escribe la dirección de correo electrónico asociada a tu cuenta.
3. **Revisa tu correo**: Te enviaremos un enlace para restablecer tu contraseña.
4. **Crea una nueva contraseña**: Haz clic en el enlace y sigue las instrucciones para crear una nueva contraseña.
5. **Inicia sesión**: Usa tu nueva contraseña para acceder a tu cuenta.
    `
    },
    {
        id: 3,
        slug: 'como-editar-perfil',
        title: 'Cómo editar tu perfil',
        category: 'cuenta',
        excerpt: 'Mantén tu información actualizada. Aprende a cambiar tu foto de perfil, nombre y otros datos.',
        content: `
### Pasos para editar tu perfil

1. **Accede a tu perfil**: Haz clic en tu avatar en la esquina superior derecha y selecciona "Mi Perfil".
2. **Haz clic en Editar**: Busca el botón o icono de edición junto a tu información.
3. **Actualiza tus datos**: Puedes cambiar tu nombre, foto de perfil o dirección dentro del residencial.
4. **Guarda los cambios**: No olvides hacer clic en "Guardar" para aplicar las actualizaciones.
    `
    },
    {
        id: 4,
        slug: 'como-buscar-productos',
        title: 'Cómo buscar productos',
        category: 'comprar',
        excerpt: 'Encuentra lo que necesitas rápidamente utilizando nuestro buscador y filtros.',
        content: `
### Pasos para buscar productos

1. **Usa la barra de búsqueda**: Escribe el nombre del producto que buscas en la barra superior.
2. **Navega por categorías**: Si prefieres explorar, haz clic en las categorías del menú principal.
3. **Aplica filtros**: Usa los filtros de precio, categoría o estado para refinar tu búsqueda.
4. **Ordena los resultados**: Puedes ordenar por precio (mayor a menor o viceversa) o por los más recientes.
    `
    },
    {
        id: 5,
        slug: 'como-contactar-vendedor',
        title: 'Cómo contactar a un vendedor',
        category: 'comprar',
        excerpt: 'Comunícate directamente con tus vecinos para acordar la compra de un producto.',
        content: `
### Pasos para contactar al vendedor

1. **Abre el detalle del producto**: Haz clic en el producto que te interesa.
2. **Busca el botón de contacto**: Verás un botón para enviar un mensaje o contactar por WhatsApp.
3. **Envía tu mensaje**: Escribe tus dudas o propón un horario para ver el producto.
4. **Espera la respuesta**: El vendedor recibirá una notificación y te responderá lo antes posible.
    `
    },
    {
        id: 6,
        slug: 'como-publicar-anuncio',
        title: 'Cómo publicar un anuncio',
        category: 'vender',
        excerpt: 'Vende lo que ya no usas. Sigue esta guía para crear un anuncio atractivo y efectivo.',
        content: `
### Pasos para publicar un anuncio

1. **Haz clic en "Vender"**: Busca el botón destacado en la barra de navegación.
2. **Sube fotos de calidad**: Agrega fotos claras y bien iluminadas de tu producto.
3. **Describe tu producto**: Escribe un título llamativo y una descripción detallada (estado, medidas, etc.).
4. **Establece el precio**: Define un precio justo. Puedes ver productos similares para guiarte.
5. **Selecciona la categoría**: Clasifica tu producto correctamente para que los compradores lo encuentren.
6. **Publica**: Revisa la información y haz clic en "Publicar". ¡Tu anuncio ya está visible!
    `
    },
    {
        id: 7,
        slug: 'consejos-fotos-anuncios',
        title: 'Consejos para tomar buenas fotos',
        category: 'vender',
        excerpt: 'Las fotos son clave para vender rápido. Aquí tienes algunos tips para mejorar tus imágenes.',
        content: `
### Tips para mejores fotos

1. **Iluminación natural**: Intenta tomar las fotos cerca de una ventana o con buena luz natural.
2. **Fondo limpio**: Usa un fondo neutro y despejado para que el producto resalte.
3. **Varios ángulos**: Toma fotos desde diferentes perspectivas y muestra los detalles importantes.
4. **Muestra defectos**: Si el producto tiene algún detalle, sé honesto y muéstralo en las fotos.
5. **Evita el flash**: El flash directo puede crear reflejos molestos.
    `
    },
    {
        id: 8,
        slug: 'como-editar-borrar-anuncio',
        title: 'Cómo editar o borrar un anuncio',
        category: 'vender',
        excerpt: 'Administra tus publicaciones. Aprende a modificar la información o eliminar un anuncio vendido.',
        content: `
### Pasos para gestionar tus anuncios

1. **Ve a "Mis Anuncios"**: Accede a esta sección desde tu perfil.
2. **Selecciona el anuncio**: Busca el anuncio que deseas modificar.
3. **Editar**: Haz clic en "Editar" para cambiar fotos, precio o descripción.
4. **Borrar**: Si ya vendiste el producto o quieres retirarlo, selecciona "Eliminar" o "Marcar como vendido".
    `
    },
    {
        id: 9,
        slug: 'como-funciona-carrito',
        title: 'Cómo funciona el carrito de compras',
        category: 'comprar',
        excerpt: 'Agrega varios productos y gestiona tu pedido antes de confirmar la compra.',
        content: `
### Uso del carrito

1. **Agregar al carrito**: En la página del producto, haz clic en "Agregar al carrito".
2. **Revisar carrito**: Haz clic en el icono del carrito en la barra superior para ver tus productos.
3. **Modificar cantidades**: Puedes aumentar o disminuir la cantidad de cada artículo.
4. **Eliminar productos**: Si cambias de opinión, usa el icono de papelera para quitar un artículo.
5. **Proceder al pago**: Cuando estés listo, haz clic en "Iniciar pedido" para contactar al vendedor.
    `
    },
    {
        id: 10,
        slug: 'metodos-de-pago',
        title: 'Métodos de pago aceptados',
        category: 'general',
        excerpt: 'Conoce las formas de pago disponibles en Vecivendo para tus transacciones.',
        content: `
### Formas de pago

En Vecivendo, los acuerdos se realizan directamente entre vecinos. Los métodos más comunes son:

1. **Efectivo**: El método más sencillo al momento de la entrega.
2. **Transferencia bancaria**: Acuerda con el vendedor si acepta transferencias inmediatas.
3. **Apps de pago**: Algunos vecinos pueden aceptar pagos por aplicaciones móviles.

**Nota**: Vecivendo no procesa pagos directamente, solo conecta a compradores y vendedores.
    `
    },
    {
        id: 11,
        slug: 'consejos-seguridad-encuentros',
        title: 'Consejos de seguridad para encuentros',
        category: 'seguridad',
        excerpt: 'Tu seguridad es lo primero. Sigue estas recomendaciones al reunirte para comprar o vender.',
        content: `
### Recomendaciones de seguridad

1. **Lugares públicos**: Reúnete en lugares concurridos dentro del residencial, como el parque o la caseta de vigilancia.
2. **Acompañado**: Si es posible, ve acompañado o avisa a alguien de tu encuentro.
3. **Revisa el producto**: Verifica el estado del producto antes de entregar el dinero.
4. **Confía en tu instinto**: Si algo no te da buena espina, cancela el encuentro.
    `
    },
    {
        id: 12,
        slug: 'como-reportar-usuario',
        title: 'Cómo reportar a un usuario o anuncio',
        category: 'seguridad',
        excerpt: 'Ayúdanos a mantener la comunidad segura reportando comportamientos sospechosos.',
        content: `
### Pasos para reportar

1. **Ve al perfil o anuncio**: Navega a la página del usuario o del anuncio en cuestión.
2. **Busca la opción "Reportar"**: Generalmente se encuentra en un menú de opciones (tres puntos) o al final de la página.
3. **Selecciona el motivo**: Elige la razón por la que estás reportando (fraude, contenido inapropiado, etc.).
4. **Envía el reporte**: Nuestro equipo revisará la situación y tomará las medidas necesarias.
    `
    },
    {
        id: 13,
        slug: 'que-es-vecivendo',
        title: '¿Qué es Vecivendo?',
        category: 'general',
        excerpt: 'Descubre nuestra misión y cómo ayudamos a conectar comunidades.',
        content: `
### Sobre Vecivendo

Vecivendo es una plataforma diseñada para conectar a vecinos dentro de sus propios residenciales.

*   **Compra y Venta**: Facilita el comercio local de segunda mano.
*   **Seguridad**: Al tratar solo con vecinos verificados, aumentamos la confianza.
*   **Comunidad**: Fomentamos la interacción y el apoyo mutuo entre residentes.
    `
    },
    {
        id: 14,
        slug: 'como-usar-favoritos',
        title: 'Cómo usar la lista de favoritos',
        category: 'comprar',
        excerpt: 'Guarda los productos que te gustan para verlos más tarde.',
        content: `
### Guardar en favoritos

1. **Haz clic en el corazón**: En cada anuncio verás un icono de corazón. Haz clic para guardarlo.
2. **Accede a tus favoritos**: Ve a la sección "Favoritos" en el menú principal o tu perfil.
3. **Gestiona tu lista**: Desde ahí puedes ver todos tus guardados o eliminarlos si ya no te interesan.
    `
    },
    {
        id: 15,
        slug: 'normas-comunidad',
        title: 'Normas de la comunidad',
        category: 'seguridad',
        excerpt: 'Conoce las reglas básicas para convivir y comerciar en armonía.',
        content: `
### Reglas básicas

1. **Respeto**: Trata a todos los vecinos con amabilidad y respeto.
2. **Honestidad**: Describe tus productos con veracidad.
3. **Compromiso**: Si acuerdas una compra o venta, cumple con tu palabra.
4. **No spam**: No publiques anuncios repetidos ni contenido no relacionado con compra/venta.
    `
    },
    {
        id: 16,
        slug: 'como-cambiar-residencial',
        title: 'Cómo cambiar de residencial',
        category: 'cuenta',
        excerpt: 'Si te mudaste, actualiza tu residencial para ver los anuncios de tu nueva comunidad.',
        content: `
### Cambio de residencial

1. **Contacta a soporte**: Por seguridad, el cambio de residencial requiere verificación.
2. **Envía tu solicitud**: Escríbenos indicando tu nueva dirección.
3. **Verificación**: Te pediremos un comprobante de domicilio reciente.
4. **Actualización**: Una vez verificado, actualizaremos tu perfil a la nueva comunidad.
    `
    },
    {
        id: 17,
        slug: 'horarios-entrega',
        title: 'Mejores horarios para entregas',
        category: 'general',
        excerpt: 'Sugerencias para acordar entregas exitosas con tus vecinos.',
        content: `
### Horarios sugeridos

*   **Fines de semana**: Sábados y domingos por la mañana suelen ser ideales.
*   **Tardes entre semana**: Después del horario laboral (6 PM - 8 PM).
*   **Coordinación**: Siempre confirma la hora exacta por mensaje antes de salir.
    `
    },
    {
        id: 18,
        slug: 'que-hacer-problema-compra',
        title: 'Qué hacer si hay un problema con una compra',
        category: 'seguridad',
        excerpt: 'Pasos a seguir si el producto no es lo que esperabas.',
        content: `
### Resolución de problemas

1. **Habla con el vendedor**: La mayoría de los problemas se resuelven con una conversación amable.
2. **Explica el problema**: Detalla qué es lo que está mal con el producto.
3. **Busca un acuerdo**: Pueden acordar una devolución o un descuento.
4. **Soporte**: Si no logran un acuerdo y crees que hubo mala fe, contáctanos.
    `
    },
    {
        id: 19,
        slug: 'como-destacar-anuncio',
        title: 'Cómo destacar tu anuncio',
        category: 'vender',
        excerpt: 'Aumenta la visibilidad de tus ventas con nuestros planes de destacado.',
        content: `
### Destacar anuncios

1. **Ve a "Mis Anuncios"**: Selecciona el anuncio que quieres promocionar.
2. **Elige "Destacar"**: Verás las opciones disponibles (destacado en home, tope de lista, etc.).
3. **Realiza el pago**: Sigue las instrucciones para pagar el servicio.
4. **Disfruta la visibilidad**: Tu anuncio aparecerá en lugares privilegiados por el tiempo contratado.
    `
    },
    {
        id: 20,
        slug: 'contacto-soporte',
        title: 'Cómo contactar a soporte técnico',
        category: 'general',
        excerpt: '¿Tienes dudas o problemas técnicos? Estamos para ayudarte.',
        content: `
### Contacto

*   **Correo electrónico**: Escríbenos a ayuda@vecivendo.com
*   **Formulario**: Usa el formulario de contacto al pie de la página.
*   **Redes sociales**: Envíanos un mensaje directo en nuestras redes oficiales.

Tratamos de responder a todas las solicitudes en menos de 24 horas.
    `
    }
];
