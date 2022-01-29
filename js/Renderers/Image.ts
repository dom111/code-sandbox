import IFrame from './IFrame';

/**
 * Uses the following icons:
 *   https://iconmonstr.com/magnifier-7-svg/
 *   https://iconmonstr.com/magnifier-8-svg/
 */
export class Image extends IFrame {
  private imageBuffer: string = '';
  private imageMimeType: string = 'image/png';

  public activate(mimeType: string) {
    super.activate('text/html');

    this.imageMimeType = mimeType;
  }

  // TODO: this whole renderer should be a separate package with the contents parsed into a minified file
  private css(): string {
    return `
html, body {
  margin: 0;
  padding: 0;
}

body > img {
  --z: 1;
  image-rendering: pixelated;
  transform: scale(var(--z));
  transform-origin: 0 0;
}

.checked {
  background-image: linear-gradient(to right, rgba(192, 192, 192, 0.75), rgba(192, 192, 192, 0.75)),
    linear-gradient(to right, black 50%, white 50%),
    linear-gradient(to bottom, black 50%, white 50%);
  background-blend-mode: normal, difference, normal;
  background-size: 2em 2em;
}

.controls {
  background: rgba(255, 255, 255, .2);
  border: solid rgba(255, 255, 255, .6);
  border-radius: .3em 0 0 .3em;
  border-width: 1px 0 1px 1px;
  padding: .2em .2em .5em;
  position: fixed;
  right: 0;
  top: 1em;
}

.controls button {
  appearance: none;
  background: transparent;
  border: 0;
}

.controls button.toggle:after {
  content: '\\27f5';
}

.controls.left {
  border-radius: 0 .3em .3em 0;
  border-width: 1px 1px 1px 0;
  left: 0;
  right: auto;
}

.controls.left header {
  text-align: right;
}

.controls.left button.toggle:after {
  content: '\\27f6';
}
`
      .replace(/\s*,\s*/g, ',')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s*;\s*}\s*/g, '}')
      .replace(/\s*{\s*/g, '{')
      .replace(/\s*:\s*/g, ':')
      .replace(/\s*;\s*/g, ';');
  }

  private data(): string {
    return `
<style>${this.css()}</style>
<img src="data:${this.imageMimeType};base64,${btoa(this.imageBuffer)}">
<div class="controls">
  <header>
    <button class="toggle"></button>
  </header>
  <section>
    <button class="zoom-in"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTMgMTBoLTN2M2gtMnYtM2gtM3YtMmgzdi0zaDJ2M2gzdjJ6bTguMTcyIDE0bC03LjM4Ny03LjM4N2MtMS4zODguODc0LTMuMDI0IDEuMzg3LTQuNzg1IDEuMzg3LTQuOTcxIDAtOS00LjAyOS05LTlzNC4wMjktOSA5LTkgOSA0LjAyOSA5IDljMCAxLjc2MS0uNTE0IDMuMzk4LTEuMzg3IDQuNzg1bDcuMzg3IDcuMzg3LTIuODI4IDIuODI4em0tMTIuMTcyLThjMy44NTkgMCA3LTMuMTQgNy03cy0zLjE0MS03LTctNy03IDMuMTQtNyA3IDMuMTQxIDcgNyA3eiIvPjwvc3ZnPg=="></button>
    <button class="zoom-out"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNMTMgMTBoLTh2LTJoOHYyem04LjE3MiAxNGwtNy4zODctNy4zODdjLTEuMzg4Ljg3NC0zLjAyNCAxLjM4Ny00Ljc4NSAxLjM4Ny00Ljk3MSAwLTktNC4wMjktOS05czQuMDI5LTkgOS05IDkgNC4wMjkgOSA5YzAgMS43NjEtLjUxNCAzLjM5OC0xLjM4NyA0Ljc4NWw3LjM4NyA3LjM4Ny0yLjgyOCAyLjgyOHptLTEyLjE3Mi04YzMuODU5IDAgNy0zLjE0IDctN3MtMy4xNDEtNy03LTctNyAzLjE0LTcgNyAzLjE0MSA3IDcgN3oiLz48L3N2Zz4="></button>
  </section>
  <section>
    <button class="checked">&#x2580;&#x2584;</button>
  </section>
</div>
<script>${this.js()}</script>
`;
  }

  // TODO: this whole renderer should be a separate package with the contents parsed into a minified file
  private js(): string {
    //     return `
    // const image = document.querySelector('img'),
    //   controls = document.querySelector('.controls');
    //
    // document.addEventListener('click', (event) => {
    //   const target = event.target,
    //     currentZoom = getComputedStyle(image).getPropertyValue('--z');
    //
    //   if (target.matches('.zoom-in,.zoom-in *')) {
    //       image.style.setProperty('--z', currentZoom * 2);
    //   }
    //
    //   if (target.matches('.zoom-out,.zoom-out *')) {
    //       image.style.setProperty('--z', currentZoom / 2);
    //   }
    //
    //   if (target.matches('.toggle,.toggle *')) {
    //     controls.classList.toggle('left');
    //   }
    //
    //   if (target.matches('button.checked')) {
    //     image.classList.toggle('checked');
    //   }
    // });
    // `;
    return `e=document.querySelector("img"),t=document.querySelector(".controls");document.addEventListener("click",(function(o){var c=o.target,l=getComputedStyle(e).getPropertyValue("--z");c.matches(".zoom-in,.zoom-in *")&&e.style.setProperty("--z",2*l),c.matches(".zoom-out,.zoom-out *")&&e.style.setProperty("--z",l/2),c.matches(".toggle,.toggle *")&&t.classList.toggle("left"),c.matches("button.checked")&&e.classList.toggle("checked")}))`;
  }

  public matches(mimeType: string): boolean {
    // Using data from: https://en.wikipedia.org/wiki/Comparison_of_web_browsers#Image_format_support
    //   and: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
    return [
      'image/apng',
      'image/avif',
      'image/bmp',
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/vnd.microsoft.icon',
      'image/webp',
    ].includes(mimeType);
  }

  public reset(): void {
    super.reset();

    this.imageBuffer = '';
  }

  public write(char: number): void;
  public write(data: string): void;
  public write(char: number | string): void {
    if (typeof char === 'number') {
      char = String.fromCharCode(char);
    }

    this.imageBuffer += char;
    this.buffer = '';

    super.write(this.data());
  }
}

export default Image;
