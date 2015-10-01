# nodejs-selenium-runner
A library to download and launch the Selenium Server. Rewrite [https://github.com/daaku/nodejs-selenium-launcher](https://github.com/daaku/nodejs-selenium-launcher), supported run on defined port.

[Selenium-runner](https://github.com/dunght160387/nodejs-selenium-runner)
=================

A library to download and launch the Selenium Server.

```javascript
var seleniumRunner = require('selenium-runner')
seleniumRunner(function(er, selenium) {
  // selenium is running
  // selenium.host / selenium.port are available
  // selenium is a child process, so you can do selenium.kill()
})
```

Forcing selenium server version
---

You can override the selenium server version used by the runner
 via the environment variable

```bash
SELENIUM_VERSION=2.32.0 node app.js
```

You'll have to supply a valid sha for the version.

A list of selenium-server jar's and their sha can be found on
https://code.google.com/p/selenium/downloads/list


Testing
---

```sh
npm test
```

---
Many thanks to daaku.
