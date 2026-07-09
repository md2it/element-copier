# ELEMENT COPIER

=-=-=-=-=-=-=-=-= | [DE](./DE.md) | [EN](../../README.md) | ES | [FR](./FR.md) | [RU](./RU.md) | [中文](./ZH.md) | [عربي](./AR.md) | =-=-=-=-=-=-=-=-=

## INSTALACIÓN

### Tiendas

- Chrome https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel
- Firefox https://addons.mozilla.org/firefox/addon/element-copier/ (en moderación)

### Modo de desarrollo

Carga el directorio completo [`extension`](../../extension) como una extensión descomprimida.

## DESCRIPCIÓN

Copia y descarga rápidamente contenido de páginas web en un formato práctico.

Element Copier puede procesar una página completa o un elemento específico y preparar el resultado en varios formatos a la vez. El último contenido copiado permanece disponible para cada formato habilitado.

## FUNCIONES PRINCIPALES

- Copiar una página completa o un elemento específico
- Convertir contenido a varios formatos a la vez
- Conservar el último contenido copiado para todos los formatos habilitados
- Copiar contenido al portapapeles o descargarlo como archivo
- Usar una acción predeterminada configurable para acelerar las copias repetidas
- Atajos de teclado
- Temas claro y oscuro
- Configuración flexible

## PRIVACIDAD

- No se recopilan datos
- Sin seguimiento
- Sin solicitudes de red
- El contenido de la página se procesa localmente en el navegador

## FORMATOS COMPATIBLES

- Texto enriquecido para pegar en Google Docs y Word
- Imágenes:
   - PNG
   - JPEG
- Markdown
- HTML
- Formatos para desarrollo y pruebas:
   - Selector
   - Ruta JS
   - XPath
   - XPath completo
   - Estilos declarados
   - Estilos calculados

## IDIOMAS DE LA INTERFAZ

- Inglés
- Ruso
- Español
- Francés
- Alemán
- Chino simplificado
- Árabe

## USO

U = Usuario
E = Extensión

1. U inicia E haciendo clic en su botón de la barra de herramientas del navegador
2. E abre una ventana:
   - Si la caché está vacía, E abre la ventana START
   - Si la caché no está vacía, E abre la ventana COPIED
3. U hace clic en START o START OVER
4. U pasa el cursor sobre un elemento
5. E resalta el elemento
6. U hace clic en el elemento
7. E realiza todas las acciones siguientes:
   - Guarda los datos según la configuración
   - Abre una ventana con información sobre el resultado
   - Detiene el modo de selección de elementos

Consulta [todas las rutas de usuario](../spec/user-path.md) para conocer los atajos de teclado, el comportamiento de la caché, la copia de texto enriquecido y las acciones sobre el contenido copiado.

## NOTAS DEL PRODUCTO

- El formato de texto enriquecido está diseñado para ofrecer un resultado mejor que copiar y pegar de forma básica
- Los atajos de teclado y una acción predeterminada reducen los pasos de las copias repetidas
- Los formatos para desarrolladores ofrecen datos de inspección habituales sin abrir DevTools
- El procesamiento de Markdown conserva, cuando es posible, el diseño, los enlaces y las imágenes del contenido, incluidas las imágenes SVG convertidas

## LIMITACIONES

- **La selección de iframes es diferente** a la de otros elementos:
   - El iframe se selecciona como un todo
   - Esto se debe a una limitación de la plataforma; no se considera conveniente inyectar código dentro del iframe
   - La selección se ve diferente por usar otros controladores de eventos, pero no afecta a la funcionalidad
- **Las páginas grandes pueden tardar en procesarse:**
   - La velocidad está limitada por bibliotecas de terceros que se usan sin modificaciones
   - La generación y el guardado de imágenes se pueden desactivar en la configuración
   - Sin procesamiento de imágenes, incluso las páginas muy grandes se procesan en una fracción de segundo
- **La apertura de la ventana emergente de resultados puede interrumpirse:**
   - El navegador puede abrir otra ventana emergente con mayor prioridad
   - Los procesos ya iniciados se completarán
- **El tratamiento de imágenes pequeñas en Markdown es opcional:**
   - Algunos casos requieren incluirlas y otros excluirlas
   - Este comportamiento se controla mediante una configuración independiente

## LICENCIA

[Licencia MIT](../../LICENSE)
