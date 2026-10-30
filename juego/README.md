# La Biblioteca de los Ecos

Juego original de combate por cartas y dados, inspirado en el género de *deckbuilders* con choques de dados.
Todo el arte (personajes, pisos y mapa) está dibujado en SVG desde el código, sin imágenes externas.

## Cómo jugar

Abre `index.html` en el navegador (no necesita servidor ni instalación).

1. Cada personaje tira **dados de velocidad**; los más rápidos actúan primero.
2. Selecciona uno de tus dados, elige una **página** (carta) y toca un dado enemigo como objetivo.
3. Si dos dados se apuntan entre sí hay un **choque**: los dados de cada página se comparan uno a uno.
   - Corte / Perforante / Contundente: hacen daño (el contundente aturde más).
   - Bloqueo: resta daño y aturde al atacante si gana.
   - Evasión: recupera aturdimiento y se reutiliza si gana contra un ataque.
4. Con la barra de aturdimiento en 0, el personaje pierde el siguiente turno y recibe el doble de daño.
5. Ganar choques y golpear da **emoción**: +1 Luz máxima, +1 a los dados y +1 dado de velocidad.

## Contenido

- 3 bibliotecarios jugables y 11 invitados (4 jefes).
- 4 pisos con mapa de recepciones: Relojes, Marea, Lámparas y Cúpula.
- Recompensas de páginas tras cada victoria y edición de mazos.
- Galería con todos los diseños.
- El progreso se guarda en el navegador.

## Archivos

- `data.js`: cartas, personajes, enemigos y pisos (fácil de ampliar).
- `art.js`: retratos, fondos y íconos en SVG.
- `game.js`: lógica de combate, mapa y pantallas.
- `style.css`: estilos.
