# Code

Faut bien commencer quelque part. Commencons donc par le web

## Ceci est une page html
```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="manifest" href="manifest.json" />
    <title>Khyonn's blog</title>
    <style>
      *,
      ::before,
      ::after {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <!---->
    <script defer>
      window.addEventListener("load", () => {
        navigator.serviceWorker?.register("./sw.js");
        document.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
            });
        });
      });
    </script>
  </body>
</html>

```
## Ceci est un script js
```js
const toto = 'Hello world';

console.log(toto);
```
<style>
  @import "./assets/styles/highlight.min.css";
  .hljs {
      display: block;
      overflow-x: auto;
      padding: 1em;
      background: #1E1E1E;
      color: #D4D4D4;
  }

  /* DOCTYPE "html" */
  .hljs-keyword,
  /* CSS rulename */
  .hljs-attribute,
  /* HTML attribute */
  .hljs-tag .hljs-attr,
  /* JS variable */
  .hljs-variable,
  /* JS attribute */
  .hljs-property,
  /* JS function parameter */
  .hljs-params {
      color: #9cdcfe;
  }

  /* HTML <> */
  .hljs-meta,
  .hljs-tag {
      color: #808080;
  }

  /* HTML tag name*/
  .hljs-tag .hljs-name {
      color: #569cd6;
  }
  /* HTML,JS string */
  .hljs-string {
      color: #CE9178
  }
  /* JS, CSS number */
  .hljs-number {
      color: #b5cea8;
  }

  /* CSS Selectors */
  .hljs-selector-tag,
  .hljs-selector-pseudo {
      color: #d7ba7d;
  }

  /* JS function name */
  .hljs-title.function_ {
      color: #dcdcaa;
  }
</style>
<script>
  const highlightScript = document.createElement("script");
  highlightScript.src = "./assets/scripts/highlight.min.js";
  highlightScript.onload = () => {
    hljs.highlightAll();
  };
  document.body.append(highlightScript);
</script>