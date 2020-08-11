# tex.rossprogram.org

This is a live demo of the JavaScript-based TeX compiler and DVI viewer discussed in:

> [J. Fowler, *Both TEX and DVI viewers inside the
web browser*, TUGboat, Volume 40 (2019), No. 1](https://www.tug.org/TUGboat/tb40-1/tb124fowler-js.pdf).

In particular, it uses [https://github.com/kisonecat/web2js](web2js) to compile [https://ctan.org/tex-archive/systems/knuth/dist/tex](Knuth's Pascal TeX source) into WebAssembly, which can then be run in a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) in the browser.  The texmf hierarchy from [TexLive](https://nixos.wiki/wiki/TexLive) is also served on a web endpoint, and the WebAssembly is instrumented with [asyncify](https://emscripten.org/docs/porting/asyncify.html) so TeX can be interrupted while waiting for files to be fetched from the network.  Finally [dvi2html](https://github.com/kisonecat/dvi2html) is used to convert the resulting dvi into HTML, and an SVG driver is used to support TikZ as well.

The real-time collaborative features are made possible by [ShareDB](https://github.com/share/sharedb), and the [Ace Editor](https://ace.c9.io/) is used with its TeX language support.

